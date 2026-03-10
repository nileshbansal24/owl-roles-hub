import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Retry wrapper for Supabase queries to handle transient SSL/network failures
async function queryWithRetry<T>(
  queryFn: () => Promise<{ data: T | null; error: any }>,
  maxRetries = 3,
  delayMs = 1000
): Promise<{ data: T | null; error: any }> {
  let lastError: any = null;
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      const result = await queryFn();
      // Check if error message contains HTML (Cloudflare error page)
      if (result.error && typeof result.error?.message === "string" && result.error.message.includes("<!DOCTYPE")) {
        console.warn(`Attempt ${attempt + 1}/${maxRetries}: Got Cloudflare error page, retrying...`);
        lastError = result.error;
        if (attempt < maxRetries - 1) {
          await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
          continue;
        }
        return { data: null, error: { message: "Database temporarily unavailable. Please try again in a moment." } };
      }
      return result;
    } catch (e) {
      console.warn(`Attempt ${attempt + 1}/${maxRetries}: Query threw error:`, e);
      lastError = e;
      if (attempt < maxRetries - 1) {
        await new Promise(r => setTimeout(r, delayMs * (attempt + 1)));
      }
    }
  }
  return { data: null, error: lastError || { message: "Database query failed after retries" } };
}

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

function formatSalary(amount: number | null): string {
  if (!amount || amount <= 0) return "Not specified";
  return `₹${(amount / 100000).toFixed(1)} LPA`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message, showMore, previousCandidateIds, conversationHistory } = await req.json();
    
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

The recruiter may speak in Hindi (e.g., "mujhe HR ka manager chahiye", "xyz ka email do", "poonam ki salary kitni hai") or English. Understand both languages and extract the intent.

There are 5 types of queries:

1. CANDIDATE SEARCH - Looking for candidates by role/skills/department/experience/location
   Respond: {"query_type": "search", "role": "...", "department": "...", "skills": [...], "experience_years": null or number, "location": "..."}

2. CANDIDATE INFO - Asking about specific details of a named candidate such as salary, experience, skills, location, education, role, etc.
   Examples: "What's Poonam's salary?", "poonam ki current salary kitni hai?", "tell me about John's experience"
   Respond: {"query_type": "candidate_info", "candidate_name": "the name", "info_requested": ["salary", "experience", "skills", "location", "education", "role", "all"]}

3. ADVISORY - Asking for opinions, advice, or analysis about a candidate. The recruiter is asking a QUESTION that needs a thoughtful answer, not just data.
   Examples: "kya lgta hai agar mein poonam ko 15 LPA offer kru toh join kregi?", "should I hire John?", "is Poonam a good fit for manager role?", "will she accept 10 LPA?", "what do you think about this candidate?"
   Respond: {"query_type": "advisory", "candidate_name": "the name", "original_question": "the full original question as-is"}

4. EMAIL QUERY - ONLY when specifically asking for email or contact details
   Examples: "get me email of John", "xyz ka email do", "contact details of abc"
   Respond: {"query_type": "email", "candidate_name": "the name they mentioned"}

5. GREETING/OTHER - Not a search or info query
   Respond: {"query_type": "greeting", "greeting_response": "your friendly response in the SAME LANGUAGE the user spoke"}

IMPORTANT RULES:
- If the user asks a QUESTION or seeks ADVICE about a candidate (will they join? should I hire? is this a good offer?) → use "advisory"
- If the user refers to someone from previous conversation (e.g. "uski salary kitni hai", "what about her experience", "tell me more") → use context from the conversation history to identify the candidate name
- If user asks about salary, experience, skills, or any profile detail of a specific person → use "candidate_info", NOT "email"
- Only use "email" when they explicitly ask for email/contact
- Always respond in JSON only
- For greetings, respond in the same language the user used`
          },
          ...(conversationHistory || []).slice(-6).map((msg: any) => ({ role: msg.role, content: msg.content })),
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
      if (extractionResponse.status === 402) {
        return new Response(
          JSON.stringify({ type: "text", message: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
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
          message: "I'm here to help you find candidates! Try saying something like 'I need a Manager for Human Resources' or Hindi mein 'mujhe HR ka manager chahiye'. You can also ask about a candidate's details like 'Poonam ki salary kitni hai?'",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle greeting
    if (parsed.query_type === "greeting" || (!parsed.query_type && !parsed.is_search)) {
      return new Response(
        JSON.stringify({
          type: "text",
          message: parsed.greeting_response || "Hello! I'm here to help you find candidates. You can speak in Hindi or English! 👋\n\nTry:\n• 'Find me a manager for HR'\n• 'Poonam ki salary kitni hai?'\n• 'Get email of John'",
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Handle CANDIDATE INFO QUERY
    if (parsed.query_type === "candidate_info" && parsed.candidate_name) {
      const searchName = parsed.candidate_name.toLowerCase();
      const { data: candidates, error } = await queryWithRetry(() =>
        supabase
          .from("profiles")
          .select("id, full_name, email, role, headline, avatar_url, location, years_experience, current_salary, expected_salary, skills, university, professional_summary, experience, education, user_type")
          .eq("user_type", "candidate")
          .order("updated_at", { ascending: false })
      );

      if (error) {
        console.error("Database error:", error);
        throw new Error(error.message || "Failed to search candidates");
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

      const infoRequested = parsed.info_requested || ["all"];
      const isAll = infoRequested.includes("all");

      const infoResults = matched.map((c: any) => {
        const lines: string[] = [`👤 **${c.full_name}**`];
        
        if (isAll || infoRequested.includes("role")) {
          lines.push(`💼 Role: ${c.role || c.headline || "Not specified"}`);
        }
        if (isAll || infoRequested.includes("salary")) {
          lines.push(`💰 Current Salary: ${formatSalary(c.current_salary)}`);
          lines.push(`📈 Expected Salary: ${formatSalary(c.expected_salary)}`);
        }
        if (isAll || infoRequested.includes("experience")) {
          lines.push(`📅 Experience: ${c.years_experience ?? 0} years`);
        }
        if (isAll || infoRequested.includes("location")) {
          lines.push(`📍 Location: ${c.location || "Not specified"}`);
        }
        if (isAll || infoRequested.includes("education")) {
          lines.push(`🎓 University: ${c.university || "Not specified"}`);
        }
        if (isAll || infoRequested.includes("skills")) {
          const skills = c.skills && c.skills.length > 0 ? c.skills.slice(0, 8).join(", ") : "Not specified";
          lines.push(`🛠️ Skills: ${skills}`);
        }
        if (isAll) {
          if (c.email) lines.push(`📧 Email: ${c.email}`);
          if (c.professional_summary) {
            const summary = c.professional_summary.length > 150 
              ? c.professional_summary.substring(0, 150) + "..." 
              : c.professional_summary;
            lines.push(`📝 Summary: ${summary}`);
          }
        }

        return lines.join("\n");
      });

      return new Response(
        JSON.stringify({
          type: "text",
          message: `Here are the details for "${parsed.candidate_name}":\n\n${infoResults.join("\n\n---\n\n")}`,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle ADVISORY QUERY - AI-powered contextual advice about a candidate
    if (parsed.query_type === "advisory" && parsed.candidate_name) {
      const searchName = parsed.candidate_name.toLowerCase();
      const { data: candidates, error: advError } = await queryWithRetry(() =>
        supabase
          .from("profiles")
          .select("id, full_name, role, headline, location, years_experience, current_salary, expected_salary, skills, university, professional_summary, user_type")
          .eq("user_type", "candidate")
          .order("updated_at", { ascending: false })
      );

      if (advError) {
        console.error("Database error:", advError);
        throw new Error(advError.message || "Failed to search candidates");
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

      const candidate = matched[0];
      const candidateContext = `
Name: ${candidate.full_name}
Role: ${candidate.role || candidate.headline || "Not specified"}
Location: ${candidate.location || "Not specified"}
Experience: ${candidate.years_experience ?? 0} years
Current Salary: ${formatSalary(candidate.current_salary)}
Expected Salary: ${formatSalary(candidate.expected_salary)}
University: ${candidate.university || "Not specified"}
Skills: ${(candidate.skills || []).join(", ") || "Not specified"}
Summary: ${candidate.professional_summary || "Not specified"}`.trim();

      const advisoryResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
              content: `You are a smart, friendly recruitment advisor chatbot. A recruiter is asking you a question about a candidate. Use the candidate's profile data to give a thoughtful, practical answer. 

Respond in the SAME LANGUAGE the recruiter used (Hindi, English, or Hinglish). Keep the response concise (3-5 sentences). Use relevant data points to support your answer. Be honest and balanced — mention both positives and concerns.

Candidate Profile:
${candidateContext}`
            },
            { role: "user", content: parsed.original_question || message }
          ],
          temperature: 0.5,
        }),
      });

      if (!advisoryResponse.ok) {
        throw new Error("Failed to generate advisory response");
      }

      const advisoryData = await advisoryResponse.json();
      const advisoryText = advisoryData.choices?.[0]?.message?.content || "Sorry, I couldn't generate advice at this time.";

      return new Response(
        JSON.stringify({
          type: "text",
          message: advisoryText,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Handle EMAIL QUERY
    if (parsed.query_type === "email" && parsed.candidate_name) {
      const searchName = parsed.candidate_name.toLowerCase();
      const { data: candidates, error } = await queryWithRetry(() =>
        supabase
          .from("candidate_directory")
          .select("id, full_name, email, role, headline, avatar_url, location")
          .order("updated_at", { ascending: false })
      );

      if (error) {
        console.error("Database error:", error);
        throw new Error(error.message || "Failed to search candidates");
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

    const { data: allCandidates, error } = await queryWithRetry(() =>
      supabase
        .from("candidate_directory")
        .select("*")
        .order("updated_at", { ascending: false })
    );

    if (error) {
      console.error("Database error:", error);
      throw new Error(error.message || "Failed to search candidates");
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
    const isTransient = errorMessage.includes("temporarily unavailable") || errorMessage.includes("SSL") || errorMessage.includes("handshake");
    return new Response(
      JSON.stringify({ 
        type: "error",
        error: errorMessage,
        message: isTransient 
          ? "The database is temporarily unavailable due to a network issue. Please try again in a few seconds." 
          : "Sorry, I encountered an error. Please try again."
      }),
      { status: isTransient ? 503 : 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
