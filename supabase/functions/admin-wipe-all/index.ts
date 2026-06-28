import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) return json({ error: "Unauthorized" }, 401);

    const admin = createClient(supabaseUrl, serviceRoleKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) return json({ error: "Unauthorized" }, 401);

    const { data: roleData } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleData) return json({ error: "Forbidden: Admin role required" }, 403);

    // Parse request body for scope: "recruiters" | "candidates" | "all"
    const { scope = "all", confirm, preview = false } = await req.json().catch(() => ({}));
    if (!preview && confirm !== "WIPE") {
      return json({ error: "Confirmation token missing. Send { confirm: 'WIPE' }." }, 400);
    }
    if (!["all", "recruiters", "candidates"].includes(scope)) {
      return json({ error: "Invalid scope" }, 400);
    }

    // Build list of admin user_ids to preserve
    const { data: adminRoles } = await admin
      .from("user_roles")
      .select("user_id")
      .eq("role", "admin");
    const adminIds = new Set<string>((adminRoles ?? []).map((r: any) => r.user_id));
    adminIds.add(caller.id);

    // Pull target profiles based on scope, excluding admins
    let q = admin.from("profiles").select("id, user_type, email");
    if (scope === "recruiters") q = q.eq("user_type", "recruiter");
    else if (scope === "candidates") q = q.eq("user_type", "candidate");
    else q = q.in("user_type", ["recruiter", "candidate"]);
    const { data: targets, error: targetsErr } = await q;
    if (targetsErr) return json({ error: targetsErr.message }, 500);

    const filtered = (targets ?? []).filter(
      (p: any) => !adminIds.has(p.id) && p.email !== "admin@owlroles.com"
    );
    const ids = filtered.map((p: any) => p.id);
    const recruiterCount = filtered.filter((p: any) => p.user_type === "recruiter").length;
    const candidateCount = filtered.filter((p: any) => p.user_type === "candidate").length;

    // Count related rows for preview/reporting
    const countIn = async (table: string, column: string, vals: string[]) => {
      if (!vals.length) return 0;
      let total = 0;
      const chunkSize = 200;
      for (let i = 0; i < vals.length; i += chunkSize) {
        const chunk = vals.slice(i, i + chunkSize);
        const { count } = await admin
          .from(table)
          .select("*", { count: "exact", head: true })
          .in(column, chunk);
        total += count ?? 0;
      }
      return total;
    };

    const [jobsCount, applicationsCount, eventsCount, interviewsCount, messagesCount, savedCount] =
      await Promise.all([
        countIn("jobs", "created_by", ids),
        countIn("job_applications", "applicant_id", ids),
        countIn("events", "recruiter_id", ids),
        countIn("interviews", "candidate_id", ids),
        countIn("recruiter_messages", "recruiter_id", ids),
        countIn("saved_candidates", "recruiter_id", ids),
      ]);

    const counts = {
      totalAccounts: ids.length,
      recruiters: recruiterCount,
      candidates: candidateCount,
      jobs: jobsCount,
      applications: applicationsCount,
      events: eventsCount,
      interviews: interviewsCount,
      messages: messagesCount,
      savedCandidates: savedCount,
    };

    if (preview) {
      return json({ success: true, preview: true, scope, counts });
    }

    if (ids.length === 0) {
      return json({ success: true, deleted: 0, counts, message: "Nothing to delete." });
    }


    // Bulk delete related rows (service role bypasses RLS).
    // Order respects FK constraints.
    const inIds = ids;

    const safeDel = async (table: string, column: string, vals: string[]) => {
      // Chunk to avoid URL/payload limits
      const chunkSize = 200;
      for (let i = 0; i < vals.length; i += chunkSize) {
        const chunk = vals.slice(i, i + chunkSize);
        const { error } = await admin.from(table).delete().in(column, chunk);
        if (error) console.error(`delete ${table}.${column}`, error.message);
      }
    };

    // Find jobs and events owned by targets so we can cascade their children
    const { data: ownedJobs } = await admin.from("jobs").select("id").in("created_by", inIds);
    const jobIds = (ownedJobs ?? []).map((j: any) => j.id);
    const { data: ownedEvents } = await admin.from("events").select("id").in("recruiter_id", inIds);
    const eventIds = (ownedEvents ?? []).map((e: any) => e.id);

    if (eventIds.length) {
      await safeDel("event_questions", "event_id", eventIds);
      await safeDel("event_registrations", "event_id", eventIds);
      await safeDel("quiz_submissions", "event_id", eventIds);
      await safeDel("assignment_submissions", "event_id", eventIds);
    }
    if (jobIds.length) {
      await safeDel("job_applications", "job_id", jobIds);
      await safeDel("job_collaborators", "job_id", jobIds);
      await safeDel("interviews", "job_id", jobIds);
    }

    // Per-user cascades
    await safeDel("quiz_submissions", "candidate_id", inIds);
    await safeDel("assignment_submissions", "candidate_id", inIds);
    await safeDel("event_registrations", "candidate_id", inIds);
    await safeDel("events", "recruiter_id", inIds);
    await safeDel("recruiter_notes", "recruiter_id", inIds);
    await safeDel("recruiter_notes", "applicant_id", inIds);
    await safeDel("recruiter_messages", "recruiter_id", inIds);
    await safeDel("recruiter_messages", "candidate_id", inIds);
    await safeDel("recruiter_notifications", "user_id", inIds);
    await safeDel("candidate_rankings", "recruiter_id", inIds);
    await safeDel("saved_candidates", "recruiter_id", inIds);
    await safeDel("saved_candidates", "candidate_id", inIds);
    await safeDel("interviews", "recruiter_id", inIds);
    await safeDel("interviews", "candidate_id", inIds);
    await safeDel("job_applications", "applicant_id", inIds);
    await safeDel("job_collaborators", "recruiter_id", inIds);
    await safeDel("jobs", "created_by", inIds);
    await safeDel("plan_upgrade_requests", "recruiter_id", inIds);
    await safeDel("institution_verifications", "recruiter_id", inIds);
    await safeDel("credential_verifications", "candidate_id", inIds);
    await safeDel("candidate_directory", "id", inIds);
    await safeDel("user_roles", "user_id", inIds);
    await safeDel("profiles", "id", inIds);

    // Finally delete auth users
    let authDeleted = 0;
    for (const id of inIds) {
      const { error } = await admin.auth.admin.deleteUser(id);
      if (!error || (error as any).status === 404) authDeleted++;
      else console.error("auth delete", id, error.message);
    }

    return json({ success: true, deleted: ids.length, authDeleted, scope, counts });
  } catch (e: any) {
    console.error("admin-wipe-all error", e);
    return json({ error: e?.message ?? "Unknown error" }, 500);
  }
});
