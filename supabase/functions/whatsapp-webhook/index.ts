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

    // Verify recruiter is still approved
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type, approval_status")
      .eq("id", link.recruiter_id)
      .maybeSingle();

    if (!profile || profile.user_type !== "recruiter" || profile.approval_status !== "approved") {
      return twiml("Your recruiter account isn't active. Please check your Owl dashboard.");
    }

    // 3) AI extraction — what candidate type does the recruiter want?
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) return twiml("AI service isn't configured. Please try later.");

    const ai = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: { Authorization: `Bearer ${LOVABLE_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `Extract candidate search criteria from a recruiter WhatsApp message.
Return JSON only: {"role":"...","skills":[...],"min_experience":null|number,"location":"..."}.
Leave fields empty ("" or []) if not mentioned. Understand Hindi & English.`,
          },
          { role: "user", content: body },
        ],
        temperature: 0.2,
      }),
    });

    let criteria: any = {};
    if (ai.ok) {
      const j = await ai.json();
      const txt = j.choices?.[0]?.message?.content || "";
      const m = txt.match(/\{[\s\S]*\}/);
      if (m) { try { criteria = JSON.parse(m[0]); } catch { /* ignore */ } }
    }

    // 4) Search candidate_directory
    let q = supabase
      .from("candidate_directory")
      .select("full_name, role, headline, university, location, years_experience, current_salary, expected_salary, skills, email")
      .limit(50);

    const roleTerm = (criteria.role || "").toString().trim();
    if (roleTerm) q = q.or(`role.ilike.%${roleTerm}%,headline.ilike.%${roleTerm}%`);
    if (typeof criteria.min_experience === "number") q = q.gte("years_experience", criteria.min_experience);
    if (criteria.location) q = q.ilike("location", `%${criteria.location}%`);

    const { data: candidates } = await q;

    let results = candidates || [];
    // Skills filter (client side, since skills is array)
    const skills: string[] = Array.isArray(criteria.skills) ? criteria.skills.filter(Boolean) : [];
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
