// Twilio WhatsApp inbound webhook — restricted to linked recruiters
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "*",
};

function twiml(msg: string): Response {
  const escaped = msg
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  const body = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${escaped}</Message></Response>`;
  return new Response(body, {
    status: 200,
    headers: { ...corsHeaders, "Content-Type": "text/xml" },
  });
}

function formatSalary(n: number | null): string {
  if (!n || n <= 0) return "N/A";
  return `₹${(n / 100000).toFixed(1)} LPA`;
}

function isPaidPlan(plan?: string | null): boolean {
  const normalized = (plan || "free").toLowerCase().trim();
  return normalized !== "" && normalized !== "free";
}

function upgradeMessage(): string {
  return [
    "🔒 Candidate search is available on paid plans.",
    "",
    "Plans:",
    "Starter — ₹2,999/mo",
    "• 50 candidate searches/month",
    "• Basic filters and email access",
    "",
    "Pro — ₹7,999/mo",
    "• Unlimited candidate searches",
    "• Advanced AI matching",
    "• WhatsApp assistant search included",
    "",
    "Enterprise — Custom",
    "• Team seats, SLA and priority support",
    "",
    "Open Owl Dashboard → Upgrade Plan to unlock candidate search.",
  ].join("\n");
}

async function askAi(messages: Array<{ role: string; content: string }>, temperature = 0.3): Promise<string> {
  const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
  if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

  const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-2.5-flash",
      messages,
      temperature,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("WhatsApp AI error:", response.status, errorText);
    throw new Error("AI request failed");
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() || "";
}

async function classifyMessage(body: string): Promise<any> {
  const text = await askAi([
    {
      role: "system",
      content: `Classify a recruiter WhatsApp message. Return JSON only.
Types:
1. search: recruiter wants to find candidates by role, skills, department, experience, or location.
2. candidate_info: recruiter asks about a named candidate's salary, profile, experience, location, skills, education, role, or contact.
3. advisory: recruiter asks advice about hiring, offering salary to, or evaluating a named candidate.
4. general: greetings, hiring advice, HR questions, definitions, interview tips, policy questions, small talk, or anything not requiring Owl candidate database access.

Shape:
{"query_type":"search|candidate_info|advisory|general","role":"","department":"","skills":[],"min_experience":null,"location":"","candidate_name":"","info_requested":[],"question":""}

Understand Hindi, English, and Hinglish.`,
    },
    { role: "user", content: body },
  ], 0.2);

  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/) || text.match(/\{[\s\S]*\}/);
  const jsonText = match ? (match[1] || match[0]) : text;
  try {
    return JSON.parse(jsonText.trim());
  } catch (error) {
    console.error("WhatsApp classification parse failed:", text, error);
    return { query_type: "general", question: body };
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const contentType = req.headers.get("content-type") || "";
    let from = "";
    let body = "";

    if (contentType.includes("application/x-www-form-urlencoded")) {
      const form = await req.formData();
      from = String(form.get("From") || "");
      body = String(form.get("Body") || "").trim();
    } else {
      const j = await req.json().catch(() => ({}));
      from = j.From || j.from || "";
      body = (j.Body || j.body || "").trim();
    }

    // Normalize: Twilio sends "whatsapp:+91..." — keep the +E.164 part
    const phone = from.replace(/^whatsapp:/i, "").trim();
    if (!phone || !body) return twiml("Hey! Please send a message.");

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    // 1) Pairing flow — "LINK ABCD" binds this phone to a recruiter
    const linkMatch = body.match(/^\s*LINK\s+([A-Z0-9]{4,10})\s*$/i);
    if (linkMatch) {
      const code = linkMatch[1].toUpperCase();
      const { data: row } = await supabase
        .from("recruiter_whatsapp_links")
        .select("id, recruiter_id, linked")
        .eq("pairing_code", code)
        .maybeSingle();

      if (!row) return twiml("Invalid pairing code. Get a fresh code from your Owl dashboard → WhatsApp Assistant.");

      await supabase
        .from("recruiter_whatsapp_links")
        .update({ phone_number: phone, linked: true, linked_at: new Date().toISOString() })
        .eq("id", row.id);

      return twiml("✅ You're linked! Ask me anything — e.g. *Hey Owl! I need a HR manager*");
    }

    // 2) Lookup linked recruiter by phone
    const { data: link } = await supabase
      .from("recruiter_whatsapp_links")
      .select("recruiter_id, linked")
      .eq("phone_number", phone)
      .eq("linked", true)
      .maybeSingle();

    if (!link) {
      return twiml(
        "You're not linked yet. Open Owl → Recruiter Dashboard → WhatsApp Assistant to get your pairing code, then send:\n\nLINK <your-code>",
      );
    }

    // Verify recruiter is still a recruiter. Approval status should not block the WhatsApp link itself.
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, subscription_plan")
      .eq("id", link.recruiter_id)
      .maybeSingle();

    if (!profile || profile.user_type !== "recruiter") {
      return twiml("Your recruiter account isn't active. Please check your Owl dashboard.");
    }

    const parsed = await classifyMessage(body);
    const queryType = parsed.query_type || "general";

    if (queryType === "general") {
      const answer = await askAi([
        {
          role: "system",
          content: "You are Owl, a concise WhatsApp recruiting assistant. Answer general hiring, HR, interview, salary-market, policy, and small-talk questions in the same language as the user. Do not claim to search candidates unless database access is needed; keep replies under 900 characters.",
        },
        { role: "user", content: body },
      ], 0.6);

      return twiml(answer || "Hi, I'm Owl. Ask me hiring questions, or search candidates after upgrading your recruiter plan.");
    }

    if (!isPaidPlan(profile.subscription_plan)) {
      return twiml(upgradeMessage());
    }


    if ((queryType === "candidate_info" || queryType === "advisory") && parsed.candidate_name) {
      const searchName = String(parsed.candidate_name).toLowerCase().trim();
      const { data: candidates } = await supabase
        .from("candidate_directory")
        .select("full_name, role, headline, university, location, years_experience, current_salary, expected_salary, skills, email, professional_summary")
        .limit(100);

      const matched = (candidates || []).filter((c: any) =>
        c.full_name && String(c.full_name).toLowerCase().includes(searchName),
      );

      if (matched.length === 0) {
        return twiml(`I couldn't find a candidate named "${parsed.candidate_name}". Try the full name or search by role/skill.`);
      }

      const top = matched[0] as any;
      if (queryType === "advisory") {
        const advice = await askAi([
          {
            role: "system",
            content: "You are Owl, a practical recruiter advisor. Use only the provided candidate context. Answer in the same language as the recruiter, under 900 characters.",
          },
          {
            role: "user",
            content: `Recruiter question: ${body}\n\nCandidate context:\nName: ${top.full_name}\nRole: ${top.role || top.headline || "N/A"}\nLocation: ${top.location || "N/A"}\nExperience: ${top.years_experience ?? 0} years\nCurrent salary: ${formatSalary(top.current_salary)}\nExpected salary: ${formatSalary(top.expected_salary)}\nSkills: ${(top.skills || []).join(", ") || "N/A"}\nSummary: ${top.professional_summary || "N/A"}`,
          },
        ], 0.5);
        return twiml(advice);
      }

      return twiml([
        `👤 ${top.full_name}`,
        `Role: ${top.role || top.headline || "N/A"}`,
        `University: ${top.university || "N/A"}`,
        `Location: ${top.location || "N/A"}`,
        `Experience: ${top.years_experience ?? 0} yrs`,
        `Salary: ${formatSalary(top.current_salary)} current · ${formatSalary(top.expected_salary)} expected`,
        `Skills: ${(top.skills || []).slice(0, 8).join(", ") || "N/A"}`,
        top.email ? `Email: ${top.email}` : "",
      ].filter(Boolean).join("\n"));
    }

    // Paid candidate search
    let q = supabase
      .from("candidate_directory")
      .select("full_name, role, headline, university, location, years_experience, current_salary, expected_salary, skills, email")
      .limit(50);

    const roleTerm = (parsed.role || parsed.department || "").toString().trim();
    const safeRoleTerm = roleTerm.replace(/[,%]/g, " ").trim();
    if (safeRoleTerm) q = q.or(`role.ilike.%${safeRoleTerm}%,headline.ilike.%${safeRoleTerm}%`);
    if (typeof parsed.min_experience === "number") q = q.gte("years_experience", parsed.min_experience);
    if (parsed.location) q = q.ilike("location", `%${String(parsed.location).replace(/[%]/g, "")}%`);

    const { data: candidates } = await q;

    let results = candidates || [];
    // Skills filter (client side, since skills is array)
    const skills: string[] = Array.isArray(parsed.skills) ? parsed.skills.filter(Boolean) : [];
    if (skills.length) {
      results = results.filter((c: any) =>
        (c.skills || []).some((s: string) => skills.some((k) => s.toLowerCase().includes(k.toLowerCase()))),
      );
    }

    results = results.slice(0, 5);

    if (results.length === 0) {
      return twiml(`🦉 No matching candidates found${roleTerm ? ` for "${roleTerm}"` : ""}. Try a different role or skill.`);
    }

    const lines = results.map((c: any, i: number) => {
      const parts = [
        `${i + 1}. *${c.full_name || "Unnamed"}*`,
        c.role || c.headline ? `   ${c.role || c.headline}` : "",
        c.university ? `   🎓 ${c.university}` : "",
        c.location ? `   📍 ${c.location}` : "",
        `   💼 ${c.years_experience ?? 0} yrs · Exp Salary: ${formatSalary(c.expected_salary)}`,
      ].filter(Boolean);
      return parts.join("\n");
    });

    const header = `🦉 Found ${results.length} candidate${results.length > 1 ? "s" : ""}${roleTerm ? ` for "${roleTerm}"` : ""}:\n\n`;
    const footer = `\n\nOpen Owl dashboard to view full profiles & contact.`;
    return twiml(header + lines.join("\n\n") + footer);
  } catch (e) {
    console.error("whatsapp-webhook error:", e);
    return twiml("Something went wrong on our side. Please try again in a moment.");
  }
});
