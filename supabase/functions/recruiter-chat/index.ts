import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Candidate category ranking (higher is better)
function getCandidateCategory(candidate: any): { category: string; rank: number } {
  const role = (candidate.role || "").toLowerCase();
  const headline = (candidate.headline || "").toLowerCase();
  const combinedText = `${role} ${headline}`;
  const experience = candidate.years_experience || 0;

  // GOLD: Top-tier leadership positions
  const goldKeywords = ["hod", "head of department", "dean", "vice chancellor", "vc", "pvc", "pro vice chancellor", "director", "principal", "registrar", "ceo", "cto", "cfo"];
  if (goldKeywords.some(keyword => combinedText.includes(keyword))) {
    return { category: "GOLD", rank: 3 };
  }

  // SILVER: Senior positions
  const silverKeywords = ["professor", "manager", "senior lecturer", "associate professor", "coordinator", "lead", "head", "senior"];
  if (silverKeywords.some(keyword => combinedText.includes(keyword)) && !combinedText.includes("assistant")) {
    return { category: "SILVER", rank: 2 };
  }

  // BRONZE: Entry to mid-level
  const bronzeKeywords = ["assistant professor", "lecturer", "instructor", "teaching assistant", "research associate"];
  if (bronzeKeywords.some(keyword => combinedText.includes(keyword))) {
    return { category: "BRONZE", rank: 1 };
  }

  // Experience-based fallback
  if (experience >= 10) return { category: "SILVER", rank: 2 };
  if (experience >= 3) return { category: "BRONZE", rank: 1 };

  return { category: "FRESHER", rank: 0 };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, showMore, previousCandidateIds } = await req.json();
    
    if (!message) {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // First, use AI to extract job requirements from natural language
    const extractionResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
            content: `You are a helpful assistant that extracts job requirements from recruiter queries.
Extract the following information if mentioned:
- role/position (e.g., Manager, Director, Professor, HOD)
- department/field (e.g., Human Resources, Computer Science, Marketing)
- skills (any specific skills mentioned)
- experience_years (minimum years of experience if mentioned)
- location (if mentioned)

Respond ONLY with a JSON object. If the query is a greeting or not a job search, return {"is_search": false, "greeting_response": "your friendly response"}.
For job searches, return {"is_search": true, "role": "...", "department": "...", "skills": [...], "experience_years": null or number, "location": "..."}.
Only include fields that are clearly mentioned.`
          },
          { role: "user", content: message }
        ],
        temperature: 0.3,
      }),
    });

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text();
      console.error("AI extraction error:", errorText);
      throw new Error("Failed to process your request");
    }

    const extractionData = await extractionResponse.json();
    const extractedText = extractionData.choices?.[0]?.message?.content || "";
    
    console.log("AI extraction response:", extractedText);

    // Parse the JSON response
    let parsed;
    try {
      // Extract JSON from potential markdown code blocks
      const jsonMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, extractedText];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return new Response(
        JSON.stringify({
          type: "text",
          message: "I'm here to help you find candidates! Try saying something like 'I need a Manager for Human Resources' or 'Find me candidates with 5 years of experience in Marketing'.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // If not a search query, return the greeting
    if (!parsed.is_search) {
      return new Response(
        JSON.stringify({
          type: "text",
          message: parsed.greeting_response || "Hello! I'm here to help you find the perfect candidates. Just tell me what role you're looking for, like 'I need a Manager for Human Resources'.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Build search query for candidates
    let query = supabase.from("candidate_directory").select("*");

    // Build search terms for text search
    const searchTerms: string[] = [];
    if (parsed.role) searchTerms.push(parsed.role);
    if (parsed.department) searchTerms.push(parsed.department);
    if (parsed.skills && parsed.skills.length > 0) {
      searchTerms.push(...parsed.skills);
    }

    console.log("Search terms:", searchTerms);
    console.log("Parsed requirements:", parsed);

    // Fetch all candidates first, then filter in memory for more flexible matching
    const { data: allCandidates, error } = await query.order("updated_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      throw new Error("Failed to search candidates");
    }

    // Score and filter candidates based on extracted requirements
    const scoredCandidates = (allCandidates || []).map((candidate: any) => {
      let score = 0;
      const matchReasons: string[] = [];

      const candidateText = [
        candidate.role || "",
        candidate.headline || "",
        candidate.bio || "",
        candidate.professional_summary || "",
        candidate.university || "",
        ...(candidate.skills || []),
      ].join(" ").toLowerCase();

      // Check role match
      if (parsed.role && candidateText.includes(parsed.role.toLowerCase())) {
        score += 30;
        matchReasons.push(`Role: ${parsed.role}`);
      }

      // Check department/field match
      if (parsed.department && candidateText.includes(parsed.department.toLowerCase())) {
        score += 25;
        matchReasons.push(`Field: ${parsed.department}`);
      }

      // Check skills match
      if (parsed.skills && parsed.skills.length > 0) {
        const candidateSkills = (candidate.skills || []).map((s: string) => s.toLowerCase());
        for (const skill of parsed.skills) {
          if (candidateSkills.some((cs: string) => cs.includes(skill.toLowerCase())) ||
              candidateText.includes(skill.toLowerCase())) {
            score += 15;
            matchReasons.push(`Skill: ${skill}`);
          }
        }
      }

      // Check experience
      if (parsed.experience_years && candidate.years_experience) {
        if (candidate.years_experience >= parsed.experience_years) {
          score += 20;
          matchReasons.push(`${candidate.years_experience}+ years experience`);
        }
      }

      // Check location
      if (parsed.location && candidate.location) {
        if (candidate.location.toLowerCase().includes(parsed.location.toLowerCase())) {
          score += 10;
          matchReasons.push(`Location: ${candidate.location}`);
        }
      }

      // Bonus for having any search term in profile
      for (const term of searchTerms) {
        if (candidateText.includes(term.toLowerCase()) && !matchReasons.some(r => r.toLowerCase().includes(term.toLowerCase()))) {
          score += 5;
        }
      }

      // Get category ranking
      const categoryInfo = getCandidateCategory(candidate);

      return { ...candidate, score, matchReasons, category: categoryInfo.category, categoryRank: categoryInfo.rank };
    });

    // Filter candidates with score > 0 and sort by category rank first, then score
    const matchedCandidates = scoredCandidates
      .filter((c: any) => c.score > 0)
      .sort((a: any, b: any) => {
        // First sort by category rank (GOLD > SILVER > BRONZE > FRESHER)
        if (b.categoryRank !== a.categoryRank) {
          return b.categoryRank - a.categoryRank;
        }
        // Then by score
        return b.score - a.score;
      });

    // If showMore is requested, exclude previously shown candidates
    let candidatesToShow = matchedCandidates;
    if (showMore && previousCandidateIds && previousCandidateIds.length > 0) {
      candidatesToShow = matchedCandidates.filter((c: any) => !previousCandidateIds.includes(c.id));
    }

    // Limit to top 3 candidates
    const topCandidates = candidatesToShow.slice(0, 3);
    const hasMore = candidatesToShow.length > 3;
    const totalMatches = matchedCandidates.length;
    const shownSoFar = showMore && previousCandidateIds ? previousCandidateIds.length + topCandidates.length : topCandidates.length;

    console.log(`Found ${matchedCandidates.length} matching candidates, showing ${topCandidates.length}`);

    // Generate a friendly response
    const searchDescription = [
      parsed.role,
      parsed.department ? `in ${parsed.department}` : null,
      parsed.experience_years ? `with ${parsed.experience_years}+ years experience` : null,
      parsed.location ? `in ${parsed.location}` : null,
    ].filter(Boolean).join(" ");

    let responseMessage = "";
    if (topCandidates.length === 0) {
      if (showMore) {
        responseMessage = "No more candidates available for this search. Try refining your criteria to see different results.";
      } else {
        responseMessage = `I couldn't find any candidates matching "${searchDescription}". Try broadening your search criteria or check back later as new candidates join.`;
      }
    } else {
      if (showMore) {
        responseMessage = `Here are ${topCandidates.length} more candidate${topCandidates.length > 1 ? "s" : ""} (${shownSoFar} of ${totalMatches} total):`;
      } else {
        responseMessage = `I found ${totalMatches} candidate${totalMatches > 1 ? "s" : ""} for ${searchDescription}. Here are the top ${topCandidates.length} ranked by seniority:`;
      }
    }

    return new Response(
      JSON.stringify({
        type: "candidates",
        message: responseMessage,
        candidates: topCandidates.map((c: any) => ({
          id: c.id,
          full_name: c.full_name,
          avatar_url: c.avatar_url,
          role: c.role,
          headline: c.headline,
          university: c.university,
          location: c.location,
          years_experience: c.years_experience,
          skills: c.skills,
          email: c.email,
          matchReasons: c.matchReasons,
          score: c.score,
          category: c.category,
        })),
        searchCriteria: parsed,
        hasMore,
        totalMatches,
        shownSoFar,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error in recruiter-chat:", error);
    
    const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred";
    
    return new Response(
      JSON.stringify({ 
        type: "error",
        error: errorMessage,
        message: "Sorry, I encountered an error. Please try again."
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
