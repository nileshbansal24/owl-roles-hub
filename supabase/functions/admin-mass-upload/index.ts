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

const CONCURRENCY = 5; // parallel resumes per request

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

async function parseResumeWithAI(file: File, lovableApiKey: string): Promise<ParsedResume | null> {
  const arrayBuffer = await file.arrayBuffer();
  // Chunked base64 conversion for large files
  const bytes = new Uint8Array(arrayBuffer);
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  const base64Content = btoa(binary);
  const fileExt = file.name.split(".").pop()?.toLowerCase() || "pdf";
  const mimeType = fileExt === "pdf"
    ? "application/pdf"
    : fileExt === "docx"
      ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      : "application/msword";

  const attempt = async (retries: number): Promise<ParsedResume | null> => {
    try {
      const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${lovableApiKey}`,
        },
        body: JSON.stringify({
          model: "google/gemini-2.5-flash",
          messages: [
            {
              role: "system",
              content: `You are an expert resume parser specialised in academic and professional resumes. Extract ALL available data even from poorly formatted resumes. Infer reasonable values where context allows (e.g. headline from latest role). The email is CRITICAL. Output dates as 'Month YYYY' or 'YYYY' format. If a role is current, set current=true.`
            },
            {
              role: "user",
              content: [
                { type: "text", text: "Parse this resume thoroughly and return structured data via the tool. Include every job, every education entry, every paper. Calculate dates carefully." },
                { type: "file", file: { filename: `resume.${fileExt}`, file_data: `data:${mimeType};base64,${base64Content}` } }
              ]
            }
          ],
          tools: [{
            type: "function",
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
          }],
          tool_choice: { type: "function", function: { name: "extract_resume_data" } },
          temperature: 0.1,
          max_tokens: 8000,
        }),
      });

      if (aiResponse.status === 429 || aiResponse.status === 503) {
        if (retries > 0) {
          await new Promise(r => setTimeout(r, 2000 * (4 - retries)));
          return attempt(retries - 1);
        }
      }
      if (!aiResponse.ok) {
        console.error("AI error", aiResponse.status, await aiResponse.text());
        return null;
      }
      const aiResult = await aiResponse.json();
      const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
      if (!toolCall?.function?.arguments) return null;
      return JSON.parse(toolCall.function.arguments) as ParsedResume;
    } catch (e) {
      console.error("AI exception", e);
      if (retries > 0) {
        await new Promise(r => setTimeout(r, 1500));
        return attempt(retries - 1);
      }
      return null;
    }
  };

  return attempt(3);
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
    if (!parsed.email) return { filename, success: false, error: "No email found in resume" };

    const email = parsed.email.toLowerCase().trim();
    if (existingEmails.has(email)) {
      return { filename, success: false, email, error: "User already exists" };
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
