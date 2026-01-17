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

    console.log("Calling AI for salary suggestion...");

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

    // Parse the JSON response from the AI
    let salaryData;
    try {
      // Extract JSON from the response (handle potential markdown code blocks)
      const jsonMatch = aiResult.content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        salaryData = JSON.parse(jsonMatch[0]);
      } else {
        throw new Error("No JSON found in response");
      }
    } catch (parseError) {
      console.error("Failed to parse AI response:", aiResult.content);
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
