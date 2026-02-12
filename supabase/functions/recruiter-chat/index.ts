import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function getCandidateCategory(candidate: any): { category: string; rank: number } {
  const role = (candidate.role || "").toLowerCase();
  const headline = (candidate.headline || "").toLowerCase();
  const combinedText = `${role} ${headline}`;
  const experience = candidate.years_experience || 0;

  const goldKeywords = ["hod", "head of department", "dean", "vice chancellor", "vc", "pvc", "pro vice chancellor", "director", "principal", "registrar", "ceo", "cto", "cfo"];
  if (goldKeywords.some(keyword => combinedText.includes(keyword))) {
    return { category: "GOLD", rank: 3 };
  }

  const silverKeywords = ["professor", "manager", "senior lecturer", "associate professor", "coordinator", "lead", "head", "senior"];
  if (silverKeywords.some(keyword => combinedText.includes(keyword)) && !combinedText.includes("assistant")) {
    return { category: "SILVER", rank: 2 };
  }

  const bronzeKeywords = ["assistant professor", "lecturer", "instructor", "teaching assistant", "research associate"];
  if (bronzeKeywords.some(keyword => combinedText.includes(keyword))) {
    return { category: "BRONZE", rank: 1 };
  }

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

    // Use AI to extract requirements - supports Hindi and English
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
            content: `You are a multilingual assistant that understands both Hindi and English. You extract job/candidate search requirements from recruiter queries.

The recruiter may speak in Hindi (e.g., "mujhe HR ka manager chahiye", "xyz ka email do", "marketing mein 5 saal experience wale candidates dikhao") or English. Understand both languages and extract the intent.

There are 3 types of queries:
1. CANDIDATE SEARCH - Looking for candidates by role/skills/department/experience/location
2. EMAIL QUERY - Asking for email/contact of a specific candidate by name
3. GREETING/OTHER - Not a search query

For CANDIDATE SEARCH, respond with:
{"query_type": "search", "role": "...", "department": "...", "skills": [...], "experience_years": null or number, "location": "..."}
Only include fields that are clearly mentioned.

For EMAIL QUERY (e.g., "get me email of John", "xyz ka email do", "contact details of abc"), respond with:
{"query_type": "email", "candidate_name": "the name they mentioned"}

For GREETING/OTHER, respond with:
{"query_type": "greeting", "greeting_response": "your friendly response in the SAME LANGUAGE the user spoke (Hindi or English)"}

IMPORTANT: Always respond in JSON only. For greetings, respond in the same language the user used.`
          },
          { role: "user", content: message }
        ],
        temperature: 0.3,
      }),
    });

    if (!extractionResponse.ok) {
      const errorText = await extractionResponse.text();
      console.error("AI extraction error:", errorText);
      if (extractionResponse.status === 429) {
        return new Response(
          JSON.stringify({ type: "text", message: "Too many requests. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      throw new Error("Failed to process your request");
    }

    const extractionData = await extractionResponse.json();
    const extractedText = extractionData.choices?.[0]?.message?.content || "";
    console.log("AI extraction response:", extractedText);

    let parsed;
    try {
      const jsonMatch = extractedText.match(/```(?:json)?\s*([\s\S]*?)```/) || [null, extractedText];
      parsed = JSON.parse(jsonMatch[1].trim());
    } catch (e) {
      console.error("Failed to parse AI response:", e);
      return new Response(
        JSON.stringify({
          type: "text",
          message: "I'm here to help you find candidates! Try saying something like 'I need a Manager for Human Resources' or Hindi mein 'mujhe HR ka manager chahiye'.",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle greeting
    if (parsed.query_type === "greeting" || (!parsed.query_type && !parsed.is_search)) {
      return new Response(
        JSON.stringify({
          type: "text",
          message: parsed.greeting_response || "Hello! I'm here to help you find candidates. You can speak in Hindi or English! 👋",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle EMAIL QUERY
    if (parsed.query_type === "email" && parsed.candidate_name) {
      const searchName = parsed.candidate_name.toLowerCase();
      const { data: candidates, error } = await supabase
        .from("candidate_directory")
        .select("id, full_name, email, role, headline, avatar_url, location")
        .order("updated_at", { ascending: false });

      if (error) {
        console.error("Database error:", error);
        throw new Error("Failed to search candidates");
      }

      const matched = (candidates || []).filter((c: any) => 
        c.full_name && c.full_name.toLowerCase().includes(searchName)
      );

      if (matched.length === 0) {
        return new Response(
          JSON.stringify({
            type: "text",
            message: `I couldn't find any candidate named "${parsed.candidate_name}". Please check the spelling and try again.`,
          }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const emailResults = matched.map((c: any) => ({
        name: c.full_name,
        email: c.email || "Email not available",
        role: c.role || c.headline || "N/A",
        location: c.location || "N/A",
      }));

      const emailList = emailResults.map((c: any) => 
        `📧 **${c.name}** — ${c.email} (${c.role})`
      ).join("\n");

      return new Response(
        JSON.stringify({
          type: "text",
          message: `Here are the contact details for "${parsed.candidate_name}":\n\n${emailList}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // CANDIDATE SEARCH (existing logic)
    const searchTerms: string[] = [];
    if (parsed.role) searchTerms.push(parsed.role);
    if (parsed.department) searchTerms.push(parsed.department);
    if (parsed.skills && parsed.skills.length > 0) {
      searchTerms.push(...parsed.skills);
    }

    console.log("Search terms:", searchTerms);

    const { data: allCandidates, error } = await supabase
      .from("candidate_directory")
      .select("*")
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Database error:", error);
      throw new Error("Failed to search candidates");
    }

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

      if (parsed.role && candidateText.includes(parsed.role.toLowerCase())) {
        score += 30;
        matchReasons.push(`Role: ${parsed.role}`);
      }

      if (parsed.department && candidateText.includes(parsed.department.toLowerCase())) {
        score += 25;
        matchReasons.push(`Field: ${parsed.department}`);
      }

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

      if (parsed.experience_years && candidate.years_experience) {
        if (candidate.years_experience >= parsed.experience_years) {
          score += 20;
          matchReasons.push(`${candidate.years_experience}+ years experience`);
        }
      }

      if (parsed.location && candidate.location) {
        if (candidate.location.toLowerCase().includes(parsed.location.toLowerCase())) {
          score += 10;
          matchReasons.push(`Location: ${candidate.location}`);
        }
      }

      for (const term of searchTerms) {
        if (candidateText.includes(term.toLowerCase()) && !matchReasons.some(r => r.toLowerCase().includes(term.toLowerCase()))) {
          score += 5;
        }
      }

      const categoryInfo = getCandidateCategory(candidate);
      return { ...candidate, score, matchReasons, category: categoryInfo.category, categoryRank: categoryInfo.rank };
    });

    const matchedCandidates = scoredCandidates
      .filter((c: any) => c.score > 0)
      .sort((a: any, b: any) => {
        if (b.categoryRank !== a.categoryRank) return b.categoryRank - a.categoryRank;
        return b.score - a.score;
      });

    let candidatesToShow = matchedCandidates;
    if (showMore && previousCandidateIds && previousCandidateIds.length > 0) {
      candidatesToShow = matchedCandidates.filter((c: any) => !previousCandidateIds.includes(c.id));
    }

    const topCandidates = candidatesToShow.slice(0, 3);
    const hasMore = candidatesToShow.length > 3;
    const totalMatches = matchedCandidates.length;
    const shownSoFar = showMore && previousCandidateIds ? previousCandidateIds.length + topCandidates.length : topCandidates.length;

    const searchDescription = [
      parsed.role,
      parsed.department ? `in ${parsed.department}` : null,
      parsed.experience_years ? `with ${parsed.experience_years}+ years experience` : null,
      parsed.location ? `in ${parsed.location}` : null,
    ].filter(Boolean).join(" ");

    let responseMessage = "";
    if (topCandidates.length === 0) {
      if (showMore) {
        responseMessage = "No more candidates available for this search.";
      } else {
        responseMessage = `I couldn't find any candidates matching "${searchDescription}". Try broadening your search or check back later.`;
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
