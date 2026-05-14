import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function generatePasswordFromName(fullName: string, email: string): string {
  const fallback = (email || "user").split("@")[0];
  const firstName = ((fullName || fallback) || "user").trim().split(/\s+/)[0] || "user";
  const letters = firstName.replace(/[^A-Za-z]/g, "").toUpperCase();
  const base = (letters + "XXXX").slice(0, 4);
  return `${base}1234`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const serviceClient = createClient(supabaseUrl, serviceKey);

    const { data: { user }, error: authError } = await serviceClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { data: adminRole } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Admin access required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get all candidate profiles (non-admin)
    const { data: candidates, error: profErr } = await serviceClient
      .from("profiles")
      .select("id, full_name, email")
      .eq("user_type", "candidate");

    if (profErr) {
      return new Response(JSON.stringify({ error: profErr.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Exclude admins
    const { data: adminRows } = await serviceClient.from("user_roles").select("user_id").eq("role", "admin");
    const adminIds = new Set((adminRows || []).map((r: { user_id: string }) => r.user_id));

    const results: Array<{ id: string; email: string | null; success: boolean; password?: string; error?: string }> = [];

    for (const c of candidates || []) {
      if (adminIds.has(c.id)) continue;
      const password = generatePasswordFromName(c.full_name || "", c.email || "");
      const { error: updErr } = await serviceClient.auth.admin.updateUserById(c.id, {
        password,
        user_metadata: { admin_uploaded: true },
      });
      if (updErr) {
        results.push({ id: c.id, email: c.email, success: false, error: updErr.message });
      } else {
        results.push({ id: c.id, email: c.email, success: true, password });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.length - successCount;

    return new Response(
      JSON.stringify({ success: true, message: `Reset ${successCount} passwords, ${failCount} failed`, results }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Internal error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
