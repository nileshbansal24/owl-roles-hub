import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function sha256(text: string): Promise<string> {
  const buf = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map((b) => b.toString(16).padStart(2, "0")).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { email, code, newPassword } = await req.json();
    if (!email || !code || String(code).length !== 6 || !newPassword || String(newPassword).length < 6) {
      return new Response(JSON.stringify({ error: "Invalid request" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const admin = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const lowerEmail = String(email).toLowerCase();
    const { data: row } = await admin
      .from("password_reset_otps")
      .select("*")
      .eq("email", lowerEmail)
      .maybeSingle();

    if (!row) {
      return new Response(JSON.stringify({ error: "No reset request found. Please request a new code." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (new Date(row.expires_at).getTime() < Date.now()) {
      await admin.from("password_reset_otps").delete().eq("email", lowerEmail);
      return new Response(JSON.stringify({ error: "Code expired. Please request a new one." }), {
        status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (row.attempts >= 5) {
      await admin.from("password_reset_otps").delete().eq("email", lowerEmail);
      return new Response(JSON.stringify({ error: "Too many attempts. Please request a new code." }), {
        status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const expected = await sha256(String(code) + ":" + lowerEmail);
    if (expected !== row.code_hash) {
      await admin.from("password_reset_otps")
        .update({ attempts: (row.attempts ?? 0) + 1 })
        .eq("email", lowerEmail);
      return new Response(JSON.stringify({ error: "Incorrect code. Please try again." }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Find user by email via profiles
    const { data: profile } = await admin
      .from("profiles")
      .select("id")
      .eq("email", lowerEmail)
      .maybeSingle();

    if (!profile) {
      return new Response(JSON.stringify({ error: "User not found." }), {
        status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error: updErr } = await admin.auth.admin.updateUserById(profile.id, {
      password: String(newPassword),
    });

    if (updErr) {
      console.error("updateUser error", updErr);
      return new Response(JSON.stringify({ error: "Could not update password." }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await admin.from("password_reset_otps").delete().eq("email", lowerEmail);

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
