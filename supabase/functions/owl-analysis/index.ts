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

    const { summary, role, headline, experience, skills } = await req.json();

    if (!summary || summary.trim().length < 10) {
      return new Response(JSON.stringify({ insights: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const prompt = `You are a recruitment analyst. Read the following candidate profile summary and extract 2-4 concise, professional insight bullet points for a recruiter. Each point should highlight a specific capability, domain expertise, or notable trait that the recruiter should know about. Do NOT use emojis, stars, or markdown formatting. Return ONLY a JSON array of strings, nothing else.

Role: ${role || "Not specified"}
Headline: ${headline || "Not specified"}  
Experience: ${experience || 0} years
Skills: ${(skills || []).join(", ") || "Not listed"}

Professional Summary:
${summary}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: "You return only valid JSON arrays of strings. No markdown, no explanation." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      throw new Error("AI analysis failed");
    }

    const data = await response.json();
    let content = data.choices?.[0]?.message?.content || "[]";
    
    // Clean markdown fencing if present
    content = content.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    
    let insights: string[] = [];
    try {
      insights = JSON.parse(content);
      if (!Array.isArray(insights)) insights = [];
    } catch {
      insights = [];
    }

    return new Response(JSON.stringify({ insights }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("owl-analysis error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
