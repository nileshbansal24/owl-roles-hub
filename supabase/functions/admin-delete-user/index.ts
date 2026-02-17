import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify the caller is an admin
    const callerClient = createClient(supabaseUrl, serviceRoleKey);
    const anonClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await anonClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const { data: roleData } = await callerClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: "Forbidden: Admin role required" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId } = await req.json();
    if (!userId) {
      return new Response(JSON.stringify({ error: "userId is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Prevent self-deletion
    if (userId === caller.id) {
      return new Response(JSON.stringify({ error: "Cannot delete your own account" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Delete all related data using service role (bypasses RLS)
    // Order matters due to foreign key constraints

    // 1. Quiz submissions
    await callerClient.from("quiz_submissions").delete().eq("candidate_id", userId);

    // 2. Assignment submissions
    await callerClient.from("assignment_submissions").delete().eq("candidate_id", userId);

    // 3. Event registrations
    await callerClient.from("event_registrations").delete().eq("candidate_id", userId);

    // 4. Event questions for events owned by this recruiter
    const { data: ownedEvents } = await callerClient
      .from("events")
      .select("id")
      .eq("recruiter_id", userId);
    
    if (ownedEvents && ownedEvents.length > 0) {
      const eventIds = ownedEvents.map(e => e.id);
      for (const eventId of eventIds) {
        await callerClient.from("event_questions").delete().eq("event_id", eventId);
        await callerClient.from("event_registrations").delete().eq("event_id", eventId);
        await callerClient.from("quiz_submissions").delete().eq("event_id", eventId);
        await callerClient.from("assignment_submissions").delete().eq("event_id", eventId);
      }
    }

    // 5. Events owned by recruiter
    await callerClient.from("events").delete().eq("recruiter_id", userId);

    // 6. Recruiter notes (as recruiter or as applicant)
    await callerClient.from("recruiter_notes").delete().eq("recruiter_id", userId);
    await callerClient.from("recruiter_notes").delete().eq("applicant_id", userId);

    // 7. Recruiter messages
    await callerClient.from("recruiter_messages").delete().eq("recruiter_id", userId);
    await callerClient.from("recruiter_messages").delete().eq("candidate_id", userId);

    // 8. Candidate rankings
    await callerClient.from("candidate_rankings").delete().eq("recruiter_id", userId);

    // 9. Saved candidates
    await callerClient.from("saved_candidates").delete().eq("recruiter_id", userId);
    await callerClient.from("saved_candidates").delete().eq("candidate_id", userId);

    // 10. Interviews
    await callerClient.from("interviews").delete().eq("recruiter_id", userId);
    await callerClient.from("interviews").delete().eq("candidate_id", userId);

    // 11. Job applications (as applicant)
    await callerClient.from("job_applications").delete().eq("applicant_id", userId);

    // 12. Delete applications for jobs owned by this recruiter
    const { data: ownedJobs } = await callerClient
      .from("jobs")
      .select("id")
      .eq("created_by", userId);

    if (ownedJobs && ownedJobs.length > 0) {
      for (const job of ownedJobs) {
        await callerClient.from("job_applications").delete().eq("job_id", job.id);
      }
    }

    // 13. Jobs created by recruiter
    await callerClient.from("jobs").delete().eq("created_by", userId);

    // 14. Institution verifications
    await callerClient.from("institution_verifications").delete().eq("recruiter_id", userId);

    // 15. Candidate directory
    await callerClient.from("candidate_directory").delete().eq("id", userId);

    // 16. User roles
    await callerClient.from("user_roles").delete().eq("user_id", userId);

    // 17. Profile
    await callerClient.from("profiles").delete().eq("id", userId);

    // 18. Finally delete the auth user (ignore "not found" if already gone)
    const { error: authError } = await callerClient.auth.admin.deleteUser(userId);
    if (authError && authError.status !== 404) {
      console.error("Error deleting auth user:", authError);
      return new Response(JSON.stringify({ error: "Failed to delete auth user: " + authError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
