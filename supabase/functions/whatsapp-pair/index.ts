// Generates or returns a WhatsApp pairing code for the calling recruiter
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

const senderNumber = Deno.env.get("TWILIO_WHATSAPP_NUMBER") || "+1 415 523 8886";
const sandboxJoinPhrase = (Deno.env.get("TWILIO_WHATSAPP_SANDBOX_JOIN_PHRASE") || "").trim() || null;
const webhookUrl = `${Deno.env.get("SUPABASE_URL")}/functions/v1/whatsapp-webhook`;

function pairPayload(row: {
  pairing_code: string;
  phone_number: string | null;
  linked: boolean;
  linked_at: string | null;
}) {
  return {
    pairing_code: row.pairing_code,
    phone_number: row.phone_number,
    linked: row.linked,
    linked_at: row.linked_at,
    sender_number: senderNumber,
    sandbox_join_phrase: sandboxJoinPhrase,
    sandbox_configured: Boolean(sandboxJoinPhrase),
    webhook_url: webhookUrl,
  };
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const anon = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } },
    );
    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: cErr } = await anon.auth.getClaims(token);
    if (cErr || !claims?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const userId = claims.claims.sub as string;

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
    );

    const { data: profile } = await admin
      .from("profiles").select("user_type").eq("id", userId).maybeSingle();
    if (!profile || profile.user_type !== "recruiter") {
      return new Response(JSON.stringify({ error: "Recruiter access only" }), {
        status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let action = "get";
    try {
      const body = await req.json();
      if (body && typeof body.action === "string") action = body.action;
    } catch { /* no body */ }
    const url = new URL(req.url);
    const regenerate = action === "regenerate" || url.searchParams.get("regenerate") === "1";

    const { data: existing } = await admin
      .from("recruiter_whatsapp_links")
      .select("id, pairing_code, phone_number, linked, linked_at")
      .eq("recruiter_id", userId)
      .maybeSingle();

    if (existing && !regenerate) {
      return new Response(JSON.stringify(pairPayload(existing)), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate unique code
    let code = "";
    for (let i = 0; i < 5; i++) {
      code = genCode();
      const { data: clash } = await admin
        .from("recruiter_whatsapp_links").select("id").eq("pairing_code", code).maybeSingle();
      if (!clash) break;
    }

    if (existing) {
      await admin.from("recruiter_whatsapp_links").update({
        pairing_code: code, linked: false, phone_number: null, linked_at: null,
      }).eq("id", existing.id);
    } else {
      await admin.from("recruiter_whatsapp_links").insert({
        recruiter_id: userId, pairing_code: code, linked: false,
      });
    }

    return new Response(JSON.stringify(pairPayload({
      pairing_code: code, phone_number: null, linked: false, linked_at: null,
    })), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (e) {
    console.error("whatsapp-pair error:", e);
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
