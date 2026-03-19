import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface JobRow {
  id: string;
  title: string;
  institute: string;
  location: string;
  description: string | null;
  salary_range: string | null;
  job_type: string | null;
  tags: string[] | null;
  created_at: string;
  created_by: string;
}

interface ApplicationRow {
  job_id: string;
  status: string;
}

const getInitials = (name: string) => {
  const words = name.trim().split(/\s+/).filter(Boolean);

  if (words.length === 0) return "UNI";
  if (words.length === 1) return words[0].slice(0, 3).toUpperCase();

  return words
    .slice(0, 3)
    .map((word) => word[0])
    .join("")
    .toUpperCase();
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error("Missing backend configuration.");
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    });

    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, institute, location, description, salary_range, job_type, tags, created_at, created_by")
      .order("created_at", { ascending: false });

    if (jobsError) throw jobsError;

    const jobRows = (jobs || []) as JobRow[];
    const jobIds = jobRows.map((job) => job.id);
    const recruiterIds = [...new Set(jobRows.map((job) => job.created_by))];

    const [{ data: verifications, error: verificationsError }, { data: applications, error: applicationsError }] = await Promise.all([
      recruiterIds.length > 0
        ? supabase
            .from("institution_verifications")
            .select("recruiter_id, status")
            .in("recruiter_id", recruiterIds)
            .eq("status", "verified")
        : Promise.resolve({ data: [], error: null }),
      jobIds.length > 0
        ? supabase
            .from("job_applications")
            .select("job_id, status")
            .in("job_id", jobIds)
        : Promise.resolve({ data: [], error: null }),
    ]);

    if (verificationsError) throw verificationsError;
    if (applicationsError) throw applicationsError;

    const verifiedRecruiters = new Set(
      (verifications || []).map((verification) => verification.recruiter_id)
    );

    const jobToInstitute = new Map<string, string>();
    const institutionJobCounts = new Map<string, number>();

    for (const job of jobRows) {
      jobToInstitute.set(job.id, job.institute);
      institutionJobCounts.set(job.institute, (institutionJobCounts.get(job.institute) || 0) + 1);
    }

    const institutionHiringCounts = new Map<string, number>();

    for (const application of (applications || []) as ApplicationRow[]) {
      if (!["accepted", "shortlisted"].includes(application.status)) continue;

      const institute = jobToInstitute.get(application.job_id);
      if (!institute) continue;

      institutionHiringCounts.set(institute, (institutionHiringCounts.get(institute) || 0) + 1);
    }

    const topInstitutions = Array.from(institutionJobCounts.entries())
      .map(([name, jobCount]) => ({
        name,
        initials: getInitials(name),
        jobCount,
        hiringCount: institutionHiringCounts.get(name) || 0,
      }))
      .sort((a, b) => b.jobCount - a.jobCount || b.hiringCount - a.hiringCount || a.name.localeCompare(b.name))
      .slice(0, 6);

    const publicJobs = jobRows.map((job) => ({
      id: job.id,
      title: job.title,
      institute: job.institute,
      location: job.location,
      description: job.description,
      salary_range: job.salary_range,
      job_type: job.job_type,
      tags: job.tags,
      created_at: job.created_at,
      recruiter: {
        avatar_url: null,
        full_name: null,
        isVerified: verifiedRecruiters.has(job.created_by),
      },
    }));

    return new Response(JSON.stringify({ jobs: publicJobs, topInstitutions }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
      status: 200,
    });
  } catch (error) {
    console.error("public-landing-data error:", error);

    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
        status: 500,
      }
    );
  }
});
