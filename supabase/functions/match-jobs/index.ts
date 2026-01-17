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

// Helper function to call AI with retry logic
async function callAIWithRetry(
  apiKey: string,
  messages: { role: string; content: string }[],
  maxRetries = 3
): Promise<{ content: string } | { error: string; status: number }> {
  let lastError: Error | null = null;
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`AI call attempt ${attempt}/${maxRetries}`);
      
      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemini-3-flash-preview",
          messages,
          temperature: 0.3,
        }),
      });

      // Handle rate limits and payment issues - don't retry these
      if (response.status === 429) {
        return { error: "Rate limit exceeded. Please try again later.", status: 429 };
      }
      if (response.status === 402) {
        return { error: "AI credits exhausted. Please add credits to continue.", status: 402 };
      }

      // Retry on 5xx errors
      if (response.status >= 500) {
        const errorText = await response.text();
        console.error(`AI gateway error (attempt ${attempt}):`, response.status, errorText);
        lastError = new Error(`AI gateway error: ${response.status}`);
        
        if (attempt < maxRetries) {
          // Exponential backoff: 1s, 2s, 4s
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw lastError;
      }

      if (!response.ok) {
        const errorText = await response.text();
        console.error("AI gateway error:", response.status, errorText);
        throw new Error(`AI gateway error: ${response.status}`);
      }

      const data = await response.json();
      const content = data.choices?.[0]?.message?.content;

      if (!content) {
        console.error("Empty AI response, attempt:", attempt);
        lastError = new Error("No response from AI");
        
        if (attempt < maxRetries) {
          const delay = Math.pow(2, attempt - 1) * 1000;
          console.log(`Empty response, retrying in ${delay}ms...`);
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
        throw lastError;
      }

      return { content };
    } catch (error) {
      console.error(`AI call attempt ${attempt} failed:`, error);
      lastError = error instanceof Error ? error : new Error(String(error));
      
      if (attempt < maxRetries) {
        const delay = Math.pow(2, attempt - 1) * 1000;
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("AI call failed after retries");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Verify authentication
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Unauthorized - Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || !SUPABASE_ANON_KEY) {
      throw new Error("Supabase credentials not configured");
    }

    // Create client with user's JWT to verify authentication
    const supabaseAuth = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user }, error: authError } = await supabaseAuth.auth.getUser();
    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized - Invalid token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Authenticated user:", user.id);

    const { profile, limit = 5 } = await req.json() as { profile: ProfileData; limit?: number };

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");

    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Create Supabase client with service role for fetching jobs
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

    const aiResult = await callAIWithRetry(LOVABLE_API_KEY, [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ]);

    // Check for rate limit / payment errors
    if ("error" in aiResult) {
      return new Response(
        JSON.stringify({ error: aiResult.error }),
        { status: aiResult.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response received, parsing...");

    // Parse AI response
    let matchData;
    try {
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        matchData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResult.content);
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
