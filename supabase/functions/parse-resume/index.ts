import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface ParsedResume {
  full_name?: string;
  role?: string;
  headline?: string;
  professional_summary?: string;
  location?: string;
  phone?: string;
  email?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
    current?: boolean;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    field?: string;
    year?: string;
    start_year?: string;
    end_year?: string;
  }>;
  achievements?: string[];
  research_papers?: Array<{
    title: string;
    journal?: string;
    year?: string;
    doi?: string;
    authors?: string;
  }>;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const lovableApiKey = Deno.env.get("LOVABLE_API_KEY");

    if (!lovableApiKey) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create Supabase client with user's auth
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Verify user
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      console.error("Auth error:", authError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { resumePath } = await req.json();

    if (!resumePath) {
      return new Response(
        JSON.stringify({ error: "Resume path is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Parsing resume for user ${user.id}: ${resumePath}`);

    // Download the resume file using service role client
    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: fileData, error: downloadError } = await serviceClient.storage
      .from("resumes")
      .download(resumePath);

    if (downloadError || !fileData) {
      console.error("Download error:", downloadError);
      return new Response(
        JSON.stringify({ error: "Failed to download resume" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Convert file to base64 for AI processing
    const arrayBuffer = await fileData.arrayBuffer();
    const base64Content = btoa(
      new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
    );

    // Determine file type
    const fileExt = resumePath.split(".").pop()?.toLowerCase();
    const mimeType = fileExt === "pdf" 
      ? "application/pdf" 
      : fileExt === "docx" 
        ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        : "application/msword";

    console.log(`File type: ${mimeType}, size: ${arrayBuffer.byteLength} bytes`);

    // Call Lovable AI to parse the resume
    const aiResponse = await fetch("https://ai-gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${lovableApiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an expert resume parser for academic and professional profiles. Extract structured information from the resume and return ONLY valid JSON.

Extract the following fields:
- full_name: The person's full name
- role: Their current job title or academic position
- headline: A brief professional headline (1 line)
- professional_summary: A professional summary (2-4 sentences)
- location: City, State/Country
- phone: Phone number if visible
- email: Email address if visible
- skills: Array of skills/competencies
- experience: Array of work experiences with {title, company, location, start_date, end_date, description, current}
- education: Array of education with {degree, institution, field, start_year, end_year}
- achievements: Array of notable achievements, awards, certifications
- research_papers: Array of publications with {title, journal, year, doi, authors} if applicable

Return ONLY valid JSON with these fields. Omit fields that cannot be determined from the resume. Dates should be in "Month Year" or "Year" format.`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Parse this resume and extract the profile information. Return only valid JSON."
              },
              {
                type: "file",
                file: {
                  filename: `resume.${fileExt}`,
                  file_data: `data:${mimeType};base64,${base64Content}`
                }
              }
            ]
          }
        ],
        temperature: 0.1,
        max_tokens: 4000,
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("AI API error:", aiResponse.status, errorText);
      
      if (aiResponse.status === 429) {
        return new Response(
          JSON.stringify({ error: "AI service is busy. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (aiResponse.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please try again later." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      
      return new Response(
        JSON.stringify({ error: "Failed to parse resume with AI" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;

    if (!content) {
      console.error("No content in AI response:", aiResult);
      return new Response(
        JSON.stringify({ error: "AI returned empty response" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("AI response content:", content.substring(0, 500));

    // Parse the JSON from AI response
    let parsedResume: ParsedResume;
    try {
      // Extract JSON from response (handle markdown code blocks)
      let jsonStr = content;
      const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (jsonMatch) {
        jsonStr = jsonMatch[1].trim();
      }
      parsedResume = JSON.parse(jsonStr);
    } catch (parseError) {
      console.error("Failed to parse AI JSON:", parseError, content);
      return new Response(
        JSON.stringify({ error: "Failed to parse AI response as JSON" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Parsed resume data:", JSON.stringify(parsedResume, null, 2).substring(0, 1000));

    // Update the user's profile with parsed data
    const updateData: Record<string, unknown> = {};

    if (parsedResume.full_name) updateData.full_name = parsedResume.full_name;
    if (parsedResume.role) updateData.role = parsedResume.role;
    if (parsedResume.headline) updateData.headline = parsedResume.headline;
    if (parsedResume.professional_summary) updateData.professional_summary = parsedResume.professional_summary;
    if (parsedResume.location) updateData.location = parsedResume.location;
    if (parsedResume.phone) updateData.phone = parsedResume.phone;
    if (parsedResume.email) updateData.email = parsedResume.email;
    if (parsedResume.skills && parsedResume.skills.length > 0) updateData.skills = parsedResume.skills;
    if (parsedResume.experience && parsedResume.experience.length > 0) updateData.experience = parsedResume.experience;
    if (parsedResume.education && parsedResume.education.length > 0) updateData.education = parsedResume.education;
    if (parsedResume.achievements && parsedResume.achievements.length > 0) updateData.achievements = parsedResume.achievements;
    if (parsedResume.research_papers && parsedResume.research_papers.length > 0) updateData.research_papers = parsedResume.research_papers;

    if (Object.keys(updateData).length > 0) {
      const { error: updateError } = await serviceClient
        .from("profiles")
        .update(updateData)
        .eq("id", user.id);

      if (updateError) {
        console.error("Profile update error:", updateError);
        return new Response(
          JSON.stringify({ error: "Failed to update profile" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      console.log(`Updated profile for user ${user.id} with ${Object.keys(updateData).length} fields`);
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        parsed: parsedResume,
        updated_fields: Object.keys(updateData)
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error: unknown) {
    console.error("Unexpected error:", error);
    const message = error instanceof Error ? error.message : "Internal server error";
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
