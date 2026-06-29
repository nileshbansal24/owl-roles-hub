import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import mammoth from "npm:mammoth@1.8.0";
import { extractText, getDocumentProxy } from "npm:unpdf@0.12.1";


const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ExperienceItem {
  title?: string;
  company?: string;
  location?: string;
  start_date?: string;
  end_date?: string;
  description?: string;
  current?: boolean;
}

interface ParsedResume {
  full_name?: string;
  role?: string;
  headline?: string;
  professional_summary?: string;
  location?: string;
  phone?: string;
  email?: string;
  skills?: string[];
  experience?: ExperienceItem[];
  education?: Array<Record<string, string>>;
  achievements?: string[];
  research_papers?: Array<Record<string, string>>;
}

interface UploadResult {
  filename: string;
  success: boolean;
  email?: string;
  error?: string;
  userId?: string;
  password?: string;
  years_experience?: number;
  tier?: string;
}

const CONCURRENCY = 3; // parallel resumes per request — lower to dodge AI gateway rate limits on big runs

function makeNamePassword(fullName: string | undefined, email: string): string {
  const source = (fullName?.trim() || email.split("@")[0] || "user").replace(/[^a-zA-Z]/g, "");
  const prefix = (source.slice(0, 4) || "USER").toUpperCase().padEnd(4, "X");
  return `${prefix}1234`;
}

function parseDateToMonths(text?: string, fallbackToToday = false): Date | null {
  if (!text) return fallbackToToday ? new Date() : null;
  const t = text.trim();
  if (!t) return fallbackToToday ? new Date() : null;
  if (/^(present|current|now|till date|ongoing)$/i.test(t)) return new Date();
  // YYYY
  let m = t.match(/^(\d{4})$/);
  if (m) return new Date(parseInt(m[1]), fallbackToToday ? 11 : 0, 1);
  // MM/YYYY or M/YYYY
  m = t.match(/^(\d{1,2})[\/\-](\d{4})$/);
  if (m) return new Date(parseInt(m[2]), parseInt(m[1]) - 1, 1);
  // Month YYYY or Mon YYYY
  m = t.match(/^([A-Za-z]+)\.?\s+(\d{4})$/);
  if (m) {
    const months = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];
    const idx = months.indexOf(m[1].toLowerCase().slice(0, 3));
    if (idx >= 0) return new Date(parseInt(m[2]), idx, 1);
  }
  const d = new Date(t);
  if (!isNaN(d.getTime())) return d;
  return fallbackToToday ? new Date() : null;
}

function computeYearsExperience(exp?: ExperienceItem[]): number {
  if (!exp || exp.length === 0) return 0;
  type Range = [number, number]; // months since epoch
  const ranges: Range[] = [];
  for (const e of exp) {
    const start = parseDateToMonths(e.start_date);
    if (!start) continue;
    const isCurrent = e.current === true || /present|current|ongoing/i.test(e.end_date || "");
    const end = isCurrent ? new Date() : parseDateToMonths(e.end_date, true);
    if (!end) continue;
    const s = start.getFullYear() * 12 + start.getMonth();
    const en = end.getFullYear() * 12 + end.getMonth();
    if (en >= s) ranges.push([s, en]);
  }
  if (!ranges.length) return 0;
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Range[] = [ranges[0]];
  for (let i = 1; i < ranges.length; i++) {
    const last = merged[merged.length - 1];
    if (ranges[i][0] <= last[1] + 1) {
      last[1] = Math.max(last[1], ranges[i][1]);
    } else merged.push(ranges[i]);
  }
  const months = merged.reduce((sum, [a, b]) => sum + (b - a + 1), 0);
  return Math.min(50, Math.max(0, Math.round(months / 12)));
}

function computeTier(years: number): string {
  if (years <= 0) return "Black";
  if (years <= 4) return "Bronze";
  if (years <= 9) return "Silver";
  return "Gold";
}

function bytesToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function mimeFor(ext: string): string {
  if (ext === "pdf") return "application/pdf";
  if (ext === "docx") return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
  if (ext === "doc") return "application/msword";
  if (ext === "txt") return "text/plain";
  if (ext === "rtf") return "application/rtf";
  return "application/octet-stream";
}

// Format-specific text extraction fallbacks.
async function extractDocxText(bytes: Uint8Array): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer: bytes });
    return (result?.value || "").trim();
  } catch (e) {
    console.error("mammoth docx extract failed", e);
    return "";
  }
}

async function extractPdfText(bytes: Uint8Array): Promise<string> {
  try {
    const pdf = await getDocumentProxy(bytes);
    const { text } = await extractText(pdf, { mergePages: true });
    return (Array.isArray(text) ? text.join("\n") : text || "").trim();
  } catch (e) {
    console.error("unpdf extract failed", e);
    return "";
  }
}

// Legacy .doc has no clean text layer in Deno; pull printable ASCII runs as a last-ditch fallback.
function extractLegacyDocText(bytes: Uint8Array): string {
  const out: string[] = [];
  let current = "";
  for (let i = 0; i < bytes.length; i++) {
    const b = bytes[i];
    const printable = (b >= 0x20 && b <= 0x7e) || b === 0x09 || b === 0x0a || b === 0x0d;
    if (printable) {
      current += String.fromCharCode(b);
    } else {
      if (current.length >= 4) out.push(current);
      current = "";
    }
  }
  if (current.length >= 4) out.push(current);
  return out.join("\n").trim();
}

async function extractTextByFormat(file: File, ext: string): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  if (ext === "docx") return await extractDocxText(bytes);
  if (ext === "pdf") return await extractPdfText(bytes);
  if (ext === "doc") return extractLegacyDocText(bytes);
  if (ext === "txt" || ext === "rtf") return new TextDecoder().decode(bytes);
  return "";
}

const TOOL_SPEC = [{
  type: "function" as const,
  function: {
    name: "extract_resume_data",
    description: "Extract structured profile data from a resume",
    parameters: {
      type: "object",
      properties: {
        full_name: { type: "string" },
        role: { type: "string" },
        headline: { type: "string" },
        professional_summary: { type: "string" },
        location: { type: "string" },
        phone: { type: "string" },
        email: { type: "string" },
        skills: { type: "array", items: { type: "string" } },
        experience: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" }, company: { type: "string" }, location: { type: "string" },
              start_date: { type: "string" }, end_date: { type: "string" },
              description: { type: "string" }, current: { type: "boolean" }
            },
            required: ["title", "company"]
          }
        },
        education: {
          type: "array",
          items: {
            type: "object",
            properties: {
              degree: { type: "string" }, institution: { type: "string" }, field: { type: "string" },
              start_year: { type: "string" }, end_year: { type: "string" }
            },
            required: ["degree", "institution"]
          }
        },
        achievements: { type: "array", items: { type: "string" } },
        research_papers: {
          type: "array",
          items: {
            type: "object",
            properties: {
              title: { type: "string" }, journal: { type: "string" }, year: { type: "string" },
              doi: { type: "string" }, authors: { type: "string" }
            },
            required: ["title"]
          }
        }
      },
      required: ["full_name", "email"]
    }
  }
}];

const SYSTEM_PROMPT = `You are an expert resume parser specialised in academic and professional resumes. Extract ALL available data even from poorly formatted resumes. Infer reasonable values where context allows (e.g. headline from latest role). The email is CRITICAL. Output dates as 'Month YYYY' or 'YYYY' format. If a role is current, set current=true.`;

async function callGemini(
  userContent: unknown,
  lovableApiKey: string,
  model: string = "google/gemini-2.5-flash",
  retries = 5,
): Promise<ParsedResume | null> {
  try {
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools: TOOL_SPEC,
        tool_choice: { type: "function", function: { name: "extract_resume_data" } },
        temperature: 0.1,
        max_tokens: 8000,
      }),
    });

    if ((aiResponse.status === 429 || aiResponse.status === 503 || aiResponse.status === 502 || aiResponse.status === 504) && retries > 0) {
      const retryAfter = parseInt(aiResponse.headers.get("retry-after") || "0", 10);
      const backoff = retryAfter > 0
        ? retryAfter * 1000
        : Math.min(30000, 1500 * Math.pow(2, 5 - retries)) + Math.floor(Math.random() * 750);
      await new Promise(r => setTimeout(r, backoff));
      return callGemini(userContent, lovableApiKey, model, retries - 1);
    }
    if (!aiResponse.ok) {
      console.error("AI error", model, aiResponse.status, (await aiResponse.text()).slice(0, 300));
      return null;
    }
    const aiResult = await aiResponse.json();
    const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall?.function?.arguments) {
      // Some models return content rather than a tool call — try to recover JSON.
      const raw = aiResult.choices?.[0]?.message?.content;
      if (typeof raw === "string") {
        const m = raw.match(/\{[\s\S]*\}/);
        if (m) { try { return JSON.parse(m[0]) as ParsedResume; } catch { /* ignore */ } }
      }
      return null;
    }
    try {
      return JSON.parse(toolCall.function.arguments) as ParsedResume;
    } catch (e) {
      console.error("AI JSON parse failed", e);
      return null;
    }
  } catch (e) {
    console.error("AI exception", e);
    if (retries > 0) {
      await new Promise(r => setTimeout(r, 1500 + Math.floor(Math.random() * 750)));
      return callGemini(userContent, lovableApiKey, model, retries - 1);
    }
    return null;
  }
}

// Require both name AND email — no profile is created from a failed parse.
function isUsableParse(p: ParsedResume | null): boolean {
  return !!(p && p.full_name && p.email);
}


async function parseResumeWithAI(file: File, lovableApiKey: string): Promise<ParsedResume | null> {
  const fileExt = (file.name.split(".").pop() || "pdf").toLowerCase();
  const mimeType = mimeFor(fileExt);

  let best: ParsedResume | null = null;
  const keep = (p: ParsedResume | null) => {
    if (!p) return;
    if (!best) { best = p; return; }
    // Prefer one with email; otherwise the richer one.
    const score = (x: ParsedResume) =>
      (x.email ? 100 : 0) + (x.full_name ? 20 : 0) +
      (x.experience?.length || 0) + (x.education?.length || 0) +
      (x.skills?.length || 0) / 5;
    if (score(p) > score(best)) best = p;
  };

  // Strategy 1: native binary parse (PDF / DOCX) with flash.
  if (fileExt === "pdf" || fileExt === "docx") {
    try {
      const bytes = new Uint8Array(await file.arrayBuffer());
      const base64Content = bytesToBase64(bytes);
      const p1 = await callGemini([
        { type: "text", text: "Parse this resume thoroughly and return structured data via the tool. Include every job, every education entry, every paper. Calculate dates carefully. The email is critical — search the entire document for it." },
        { type: "file", file: { filename: `resume.${fileExt}`, file_data: `data:${mimeType};base64,${base64Content}` } },
      ], lovableApiKey, "google/gemini-2.5-flash");
      keep(p1);
      if (best?.email && best?.full_name) return best;
    } catch (e) {
      console.error("binary strategy failed", file.name, e);
    }
  }

  // Strategy 2: format-specific text extraction → flash.
  const extracted = await extractTextByFormat(file, fileExt);
  if (extracted && extracted.length > 30) {
    const truncated = extracted.length > 60000 ? extracted.slice(0, 60000) : extracted;
    const p2 = await callGemini([
      { type: "text", text: `Text extracted from a ${fileExt.toUpperCase()} resume (formatting may be degraded). Parse it thoroughly and return structured data via the tool. Infer fields from context where possible. The email is critical — scan the full text.\n\n---RESUME TEXT START---\n${truncated}\n---RESUME TEXT END---` },
    ], lovableApiKey, "google/gemini-2.5-flash");
    keep(p2);
    if (best?.email && best?.full_name) return best;
  }

  // Strategy 3: escalate to Gemini 2.5 Pro for stubborn resumes (scanned PDFs, weird layouts).
  if (!best?.email || !best?.full_name) {
    try {
      if (fileExt === "pdf" || fileExt === "docx") {
        const bytes = new Uint8Array(await file.arrayBuffer());
        const base64Content = bytesToBase64(bytes);
        const p3 = await callGemini([
          { type: "text", text: "Parse this resume thoroughly. Use OCR-like reasoning if the document looks scanned. Find the email even if it's an image or oddly formatted." },
          { type: "file", file: { filename: `resume.${fileExt}`, file_data: `data:${mimeType};base64,${base64Content}` } },
        ], lovableApiKey, "google/gemini-2.5-pro", 3);
        keep(p3);
      } else if (extracted && extracted.length > 30) {
        const truncated = extracted.length > 60000 ? extracted.slice(0, 60000) : extracted;
        const p3 = await callGemini([
          { type: "text", text: `Parse this ${fileExt.toUpperCase()} resume text carefully and extract structured data via the tool.\n\n${truncated}` },
        ], lovableApiKey, "google/gemini-2.5-pro", 3);
        keep(p3);
      }
    } catch (e) {
      console.error("pro fallback failed", file.name, e);
    }
  }

  return best;
}




async function processFile(
  file: File,
  serviceClient: ReturnType<typeof createClient>,
  lovableApiKey: string,
  existingEmails: Set<string>,
): Promise<UploadResult> {
  const filename = file.name;
  try {
    const parsed = await parseResumeWithAI(file, lovableApiKey);
    if (!parsed) return { filename, success: false, error: "Failed to parse resume" };

    let email = parsed.email?.toLowerCase().trim();
    let synthesizedEmail = false;
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      // No usable email — synthesize one from filename/name so the candidate isn't lost.
      email = synthEmailFromFilename(filename, parsed.full_name);
      synthesizedEmail = true;
    }
    if (existingEmails.has(email)) {
      if (synthesizedEmail) email = synthEmailFromFilename(filename + Date.now(), parsed.full_name);
      else return { filename, success: false, email, error: "User already exists" };
    }

    const password = makeNamePassword(parsed.full_name, email);

    const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: parsed.full_name || email.split("@")[0],
        user_type: "candidate",
        admin_uploaded: true,
      },
    });

    if (createError || !newUser?.user) {
      const msg = createError?.message || "";
      if (/already/i.test(msg)) {
        existingEmails.add(email);
        return { filename, success: false, email, error: "User already exists" };
      }
      return { filename, success: false, email, error: msg || "Failed to create user" };
    }
    existingEmails.add(email);

    const fileExt = filename.split(".").pop()?.toLowerCase() || "pdf";
    const mimeType = fileExt === "pdf"
      ? "application/pdf"
      : fileExt === "docx"
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword";

    const resumePath = `${newUser.user.id}/${Date.now()}_${filename}`;
    const { error: uploadError } = await serviceClient.storage
      .from("resumes")
      .upload(resumePath, file, { contentType: mimeType, upsert: false });

    const years = computeYearsExperience(parsed.experience);
    const tier = computeTier(years);

    const profileData: Record<string, unknown> = {
      full_name: parsed.full_name,
      email,
      role: parsed.role,
      headline: parsed.headline,
      professional_summary: parsed.professional_summary,
      location: parsed.location,
      phone: parsed.phone,
      skills: parsed.skills || [],
      experience: parsed.experience || [],
      education: parsed.education || [],
      achievements: parsed.achievements || [],
      research_papers: parsed.research_papers || [],
      user_type: "candidate",
      years_experience: years,
      tier,
      resume_url: uploadError ? null : resumePath,
    };
    Object.keys(profileData).forEach(k => profileData[k] === undefined && delete profileData[k]);

    const { error: profileError } = await serviceClient
      .from("profiles")
      .update(profileData)
      .eq("id", newUser.user.id);

    if (profileError) console.error("Profile update error", email, profileError);

    return {
      filename,
      success: true,
      email,
      userId: newUser.user.id,
      password,
      years_experience: years,
      tier,
    };
  } catch (e) {
    console.error("processFile error", filename, e);
    return { filename, success: false, error: e instanceof Error ? e.message : "Unknown error" };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "Missing authorization header" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");
  if (!lovableApiKey) {
    return new Response(JSON.stringify({ error: "AI service not configured" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

  const { data: { user }, error: authError } = await serviceClient.auth.getUser(
    authHeader.replace("Bearer ", "")
  );
  if (authError || !user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }),
      { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
  const { data: adminRole } = await serviceClient
    .from("user_roles").select("role").eq("user_id", user.id).eq("role", "admin").maybeSingle();
  if (!adminRole) {
    return new Response(JSON.stringify({ error: "Admin access required" }),
      { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const formData = await req.formData();
  const files = formData.getAll("resumes") as File[];
  if (!files || files.length === 0) {
    return new Response(JSON.stringify({ error: "No resume files provided" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Pre-fetch existing emails to avoid per-file listUsers() calls
  const existingEmails = new Set<string>();
  try {
    let page = 1;
    while (true) {
      const { data } = await serviceClient.auth.admin.listUsers({ page, perPage: 1000 });
      const users = data?.users || [];
      users.forEach(u => u.email && existingEmails.add(u.email.toLowerCase()));
      if (users.length < 1000) break;
      page++;
      if (page > 20) break; // safety: max 20k users
    }
  } catch (e) {
    console.error("listUsers failed", e);
  }

  console.log(`Streaming process of ${files.length} resumes; ${existingEmails.size} existing users`);

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (obj: unknown) => controller.enqueue(encoder.encode(JSON.stringify(obj) + "\n"));
      send({ type: "start", total: files.length });

      let completed = 0;
      let successCount = 0;
      let failCount = 0;
      const queue = [...files];

      const worker = async () => {
        while (queue.length) {
          const f = queue.shift();
          if (!f) break;
          const result = await processFile(f, serviceClient, lovableApiKey, existingEmails);
          completed++;
          if (result.success) successCount++; else failCount++;
          send({ type: "result", index: completed, total: files.length, result });
        }
      };

      const workers = Array.from({ length: Math.min(CONCURRENCY, files.length) }, () => worker());
      await Promise.all(workers);

      send({ type: "complete", total: files.length, successCount, failCount });
      controller.close();
    },
  });

  return new Response(stream, {
    headers: { ...corsHeaders, "Content-Type": "application/x-ndjson", "Cache-Control": "no-cache" },
  });
});
