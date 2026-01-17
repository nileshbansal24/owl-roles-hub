import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { profile } = await req.json() as { profile: ProfileData };
    
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      throw new Error("LOVABLE_API_KEY is not configured");
    }

    // Build profile context for AI
    const profileContext = [
      profile.role ? `Role/Position: ${profile.role}` : null,
      profile.headline ? `Professional Headline: ${profile.headline}` : null,
      profile.yearsExperience !== null && profile.yearsExperience !== undefined 
        ? `Years of Experience: ${profile.yearsExperience} years` : null,
      profile.location ? `Location: ${profile.location}` : null,
      profile.skills && profile.skills.length > 0 
        ? `Skills: ${profile.skills.join(", ")}` : null,
      profile.university ? `University/Institution: ${profile.university}` : null,
    ].filter(Boolean).join("\n");

    const systemPrompt = `You are an expert salary analyst for the Indian academic and professional job market. 
Your task is to suggest a realistic annual salary range based on the candidate's profile.

Consider these factors:
1. Role/designation (Professor, Assistant Professor, Lecturer, HOD, Dean, etc.)
2. Years of experience
3. Location (metro cities like Delhi, Mumbai, Bangalore pay higher)
4. Skills and specializations
5. Institution type (IIT/IIM/NIT command premium salaries)

Indian academic salary guidelines:
- Fresher/Lecturer: ₹3L - ₹8L p.a.
- Assistant Professor (3-5 years): ₹6L - ₹15L p.a.
- Associate Professor (5-10 years): ₹12L - ₹25L p.a.
- Professor (10+ years): ₹20L - ₹40L p.a.
- HOD/Dean/Director: ₹30L - ₹60L p.a.
- IIT/IIM/NIT roles typically pay 20-40% more

Respond ONLY with a JSON object in this exact format, no other text:
{
  "minSalary": number (in lakhs, e.g., 8 for ₹8L),
  "maxSalary": number (in lakhs, e.g., 15 for ₹15L),
  "confidence": "low" | "medium" | "high",
  "factors": string[] (2-3 key factors that influenced this estimate)
}`;

    const userPrompt = profileContext.length > 0 
      ? `Based on this profile, suggest an appropriate salary range:\n\n${profileContext}`
      : `The profile is incomplete. Provide a general entry-level academic salary range for India.`;

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

    // Parse the JSON response from the AI
    let salaryData;
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        salaryData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", content);
      // Fallback to default values
      salaryData = {
        minSalary: 8,
        maxSalary: 15,
        confidence: "low",
        factors: ["Unable to analyze profile - using default range"]
      };
    }

    return new Response(
      JSON.stringify({
        minSalary: salaryData.minSalary,
        maxSalary: salaryData.maxSalary,
        confidence: salaryData.confidence,
        factors: salaryData.factors,
        salaryRange: `₹${salaryData.minSalary}L - ₹${salaryData.maxSalary}L p.a.`,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Salary suggestion error:", error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : "Failed to generate salary suggestion" 
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
