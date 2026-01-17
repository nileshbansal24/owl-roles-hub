import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ProfileData {
  role?: string | null;
  headline?: string | null;
  yearsExperience?: number | null;
  location?: string | null;
  skills?: string[] | null;
  university?: string | null;
  bio?: string | null;
}

interface Job {
  id: string;
  title: string;
  institute: string;
  location: string;
  description: string | null;
  job_type: string | null;
  salary_range: string | null;
  tags: string[] | null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile, limit = 5 } = await req.json() as { profile: ProfileData; limit?: number };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Create Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch available jobs
    const { data: jobs, error: jobsError } = await supabase
      .from("jobs")
      .select("id, title, institute, location, description, job_type, salary_range, tags")
      .order("created_at", { ascending: false })
      .limit(50);

    if (jobsError) {
      console.error("Error fetching jobs:", jobsError);
      throw new Error("Failed to fetch jobs");
    }

    if (!jobs || jobs.length === 0) {
      return new Response(
        JSON.stringify({ matches: [], message: "No jobs available at the moment" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Fetched ${jobs.length} jobs for matching`);

    // Build profile context
    const profileContext = [
      profile.role ? `Current Role: ${profile.role}` : null,
      profile.headline ? `Professional Headline: ${profile.headline}` : null,
      profile.yearsExperience !== null && profile.yearsExperience !== undefined
        ? `Years of Experience: ${profile.yearsExperience} years`
        : null,
      profile.location ? `Location: ${profile.location}` : null,
      profile.skills && profile.skills.length > 0
        ? `Skills: ${profile.skills.join(", ")}`
        : null,
      profile.university ? `University/Institution: ${profile.university}` : null,
      profile.bio ? `About: ${profile.bio}` : null,
    ].filter(Boolean).join("\n");

    // Build jobs list for AI
    const jobsList = jobs.map((job: Job, index: number) => {
      return `
Job ${index + 1} (ID: ${job.id}):
- Title: ${job.title}
- Institute: ${job.institute}
- Location: ${job.location}
- Type: ${job.job_type || "Not specified"}
- Salary: ${job.salary_range || "Not disclosed"}
- Tags: ${job.tags?.join(", ") || "None"}
- Description: ${job.description?.substring(0, 300) || "No description"}
`;
    }).join("\n");

    const systemPrompt = `You are an expert job matching AI for academic and professional positions in India.
Your task is to analyze a candidate's profile and match them with the most suitable job opportunities.

Consider these matching factors:
1. Role alignment - Does the job title match the candidate's current role or career goals?
2. Experience level - Is the job appropriate for their years of experience?
3. Location preference - How well does the job location match?
4. Skills match - Do the candidate's skills align with job requirements/tags?
5. Institution fit - Does the institution type match their background?

Respond ONLY with a JSON object in this exact format, no other text:
{
  "matches": [
    {
      "jobId": "uuid-string",
      "matchScore": number (0-100),
      "matchReasons": string[] (2-3 brief reasons why this is a good match)
    }
  ]
}

Return the top ${limit} best matches, sorted by matchScore (highest first).
Only include jobs with matchScore >= 40.
If no good matches exist, return an empty matches array.`;

    const userPrompt = `CANDIDATE PROFILE:
${profileContext || "Incomplete profile - match based on general entry-level positions"}

AVAILABLE JOBS:
${jobsList}

Analyze and return the best job matches for this candidate.`;

    console.log("Calling AI for job matching...");

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again later." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      const errorText = await response.text();
      console.error("AI gateway error:", response.status, errorText);
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content;

    if (!content) {
      throw new Error("No response from AI");
    }

    console.log("AI response received, parsing...");

    // Parse AI response
    let matchData;
    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matchData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      matchData = { matches: [] };
    }

    // Enrich matches with full job data
    const enrichedMatches = matchData.matches
      .map((match: { jobId: string; matchScore: number; matchReasons: string[] }) => {
        const job = jobs.find((j: Job) => j.id === match.jobId);
        if (!job) return null;
        return {
          ...match,
          job: {
            id: job.id,
            title: job.title,
            institute: job.institute,
            location: job.location,
            job_type: job.job_type,
            salary_range: job.salary_range,
            tags: job.tags,
          },
        };
      })
      .filter(Boolean)
      .slice(0, limit);

    console.log(`Returning ${enrichedMatches.length} job matches`);

    return new Response(
      JSON.stringify({
        matches: enrichedMatches,
        totalJobsAnalyzed: jobs.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Job matching error:", error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Failed to match jobs",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
