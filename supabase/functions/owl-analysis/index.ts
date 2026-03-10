import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const { profile, jobTitle, institute } = await req.json();

    const profileSummary = `
Candidate: ${profile.full_name || "Unknown"}
Role/Title: ${profile.role || "N/A"}
Headline: ${profile.headline || "N/A"}
University: ${profile.university || "N/A"}
Location: ${profile.location || "N/A"}
Years of Experience: ${profile.years_experience ?? "N/A"}
Skills: ${(profile.skills || []).join(", ") || "N/A"}
Professional Summary: ${profile.professional_summary || "N/A"}
Teaching Philosophy: ${profile.teaching_philosophy || "N/A"}
Achievements: ${(profile.achievements || []).join(", ") || "N/A"}
Subjects: ${(profile.subjects || []).join(", ") || "N/A"}
H-Index: ${profile.scopus_metrics?.h_index ?? profile.manual_h_index ?? "N/A"}
Publications: ${profile.scopus_metrics?.document_count ?? (profile.research_papers?.length || 0)}
Citations: ${profile.scopus_metrics?.citation_count ?? "N/A"}
ORCID: ${profile.orcid_id || "N/A"}
Experience Details: ${JSON.stringify(profile.experience || [])}
Education Details: ${JSON.stringify(profile.education || [])}
Applied For: ${jobTitle || "N/A"} at ${institute || "N/A"}
    `.trim();

    const systemPrompt = `You are "Owl Analyst", an expert academic recruitment advisor. Analyze candidate profiles and provide concise, actionable insights for recruiters. 

Your analysis MUST follow this exact structure with these emoji headers:

🦉 **Owl Analysis Summary**

📊 **Category & Experience**
- State the candidate's tier (Gold/Silver/Bronze/Fresher) and why
- Summarize total experience and career trajectory

🎯 **Strengths**
- 3-4 bullet points of key strengths

⚠️ **Concerns**
- 2-3 potential concerns or gaps

✅ **Verdict**
- One clear line: "Strong Hire", "Good Fit", "Average", or "Not Recommended" with brief reasoning

💡 **Advice to Recruiter**
- 2-3 actionable next steps or interview focus areas

Keep the entire analysis under 300 words. Be direct and professional.`;

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
          { role: "user", content: `Analyze this candidate profile:\n\n${profileSummary}` },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    const analysis = data.choices?.[0]?.message?.content || "Unable to generate analysis.";

    return new Response(JSON.stringify({ analysis }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("owl-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
