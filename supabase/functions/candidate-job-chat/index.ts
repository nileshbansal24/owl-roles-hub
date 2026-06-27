import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface JobRow {
  id: string;
  title: string;
  institute: string;
  location: string;
  salary_range: string | null;
  job_type: string | null;
  tags: string[] | null;
  description: string | null;
  created_at: string;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { message, conversationHistory = [] } = await req.json();
    if (!message || typeof message !== "string") {
      return new Response(JSON.stringify({ error: "message required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    // Extract filters with AI
    const extract = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          {
            role: "system",
            content:
              "You extract job-search filters from a candidate's natural-language message (English or Hindi). Return strict JSON with keys: keywords (string[]), location (string|null), job_type (string|null e.g. full-time/part-time/contract), seniority (string|null e.g. junior/mid/senior), intent ('search'|'advice'|'greeting'). Never include commentary.",
          },
          ...conversationHistory.slice(-6),
          { role: "user", content: message },
        ],
        response_format: { type: "json_object" },
      }),
    });

    const extractJson = await extract.json();
    let filters: any = {};
    try {
      filters = JSON.parse(extractJson.choices?.[0]?.message?.content || "{}");
    } catch {
      filters = {};
    }

    if (filters.intent === "greeting") {
      return new Response(
        JSON.stringify({
          type: "message",
          message:
            "Hi! 👋 Tell me what kind of role you're looking for — e.g. 'Assistant Professor in Delhi' or 'remote data science jobs'. You can also type in Hindi!",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Query jobs (RLS allows public read)
    let query = supabase
      .from("jobs")
      .select("id, title, institute, location, salary_range, job_type, tags, description, created_at")
      .order("created_at", { ascending: false })
      .limit(200);

    if (filters.location) {
      query = query.ilike("location", `%${filters.location}%`);
    }
    if (filters.job_type) {
      query = query.ilike("job_type", `%${filters.job_type}%`);
    }

    const { data: jobsData, error: jobsError } = await query;
    if (jobsError) throw jobsError;

    const keywords: string[] = Array.isArray(filters.keywords) ? filters.keywords : [];
    const scored: Array<{ job: JobRow; score: number }> = (jobsData || []).map((j: JobRow) => {
      const hay = `${j.title} ${j.institute} ${(j.tags || []).join(" ")} ${j.description || ""}`.toLowerCase();
      let score = 0;
      for (const k of keywords) {
        if (!k) continue;
        if (hay.includes(k.toLowerCase())) score += 2;
      }
      return { job: j, score };
    });

    const filtered = keywords.length ? scored.filter((s) => s.score > 0) : scored;
    filtered.sort((a, b) => b.score - a.score);
    const top = filtered.slice(0, 6).map((s) => s.job);

    let summary = "";
    if (top.length === 0) {
      summary =
        "I couldn't find matching jobs right now. Try different keywords, broaden the location, or ask for advice on roles to explore.";
    } else {
      summary = `Found ${filtered.length} matching role${filtered.length === 1 ? "" : "s"}. Showing the top ${top.length}:`;
    }

    return new Response(
      JSON.stringify({
        type: top.length ? "jobs" : "message",
        message: summary,
        jobs: top,
        filters,
        totalMatches: filtered.length,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("candidate-job-chat error:", err);
    return new Response(
      JSON.stringify({ error: err instanceof Error ? err.message : "Server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
