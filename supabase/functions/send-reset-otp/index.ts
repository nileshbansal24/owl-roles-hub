import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const GATEWAY_URL = "https://connector-gateway.lovable.dev/brevo";

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

function escapeHtml(str: string): string {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const BREVO_API_KEY = Deno.env.get("BREVO_API_KEY");
    if (!LOVABLE_API_KEY || !BREVO_API_KEY) {
      return new Response(JSON.stringify({ error: "Email service not configured" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email } = await req.json();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const lowerEmail = String(email).toLowerCase();

    // Verify user actually exists (fetch name for personalization)
    const { data: profile } = await admin
      .from("profiles")
      .select("id, full_name")
      .ilike("email", lowerEmail)
      .maybeSingle();

    // Always respond success-ish to prevent email enumeration, but only send if exists
    if (!profile) {
      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const code_hash = await sha256(code + ":" + lowerEmail);
    const expires_at = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    const { error: upsertErr } = await admin.from("password_reset_otps").upsert({
      email: lowerEmail,
      code_hash,
      attempts: 0,
      expires_at,
      created_at: new Date().toISOString(),
    });
    if (upsertErr) {
      console.error("upsert error", upsertErr);
      return new Response(JSON.stringify({ error: "Could not create reset code" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const safeName = escapeHtml(profile.full_name || "there");
    const html = `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f9fafb;padding:40px 20px;">
        <div style="max-width:520px;margin:0 auto;background:#fff;border-radius:12px;overflow:hidden;box-shadow:0 1px 3px rgba(0,0,0,.08);">
          <div style="background:#0b3d91;padding:24px;text-align:center;">
            <h1 style="color:#fff;margin:0;font-size:22px;">OWL ROLES</h1>
          </div>
          <div style="padding:32px 28px;color:#111827;">
            <p style="margin:0 0 12px;font-size:16px;">Hi ${safeName},</p>
            <p style="margin:0 0 20px;font-size:14px;color:#4b5563;">Use this 6-digit code to reset your OWL ROLES password:</p>
            <div style="text-align:center;margin:28px 0;">
              <div style="display:inline-block;font-size:34px;letter-spacing:10px;font-weight:700;color:#0b3d91;background:#eef2ff;padding:16px 24px;border-radius:10px;">${code}</div>
            </div>
            <p style="margin:0 0 8px;font-size:13px;color:#6b7280;">This code expires in 10 minutes.</p>
            <p style="margin:0;font-size:13px;color:#6b7280;">If you didn't request a password reset, you can safely ignore this email.</p>
          </div>
          <div style="padding:14px 24px;background:#f3f4f6;text-align:center;font-size:12px;color:#6b7280;">OWL ROLES · Academic hiring, simplified.</div>
        </div>
      </div>`;

    const emailRes = await fetch(`${GATEWAY_URL}/smtp/email`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "X-Connection-Api-Key": BREVO_API_KEY,
      },
      body: JSON.stringify({
        sender: { name: "OWL ROLES", email: "no-reply@owlroles.com" },
        to: [{ email: lowerEmail, name: profile.full_name || undefined }],
        subject: `${code} is your OWL ROLES password reset code`,
        htmlContent: html,
      }),
    });

    if (!emailRes.ok) {
      const errText = await emailRes.text();
      console.error("Brevo error", emailRes.status, errText);
      return new Response(JSON.stringify({ error: "Could not send reset email. Please try again." }), {
        status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error(err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
