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

interface UploadResult {
  filename: string;
  success: boolean;
  email?: string;
  error?: string;
  userId?: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
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
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const serviceClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify admin role
    const { data: { user }, error: authError } = await serviceClient.auth.getUser(
      authHeader.replace("Bearer ", "")
    );

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if user is admin
    const { data: adminRole } = await serviceClient
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: "Admin access required" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const formData = await req.formData();
    const files = formData.getAll("resumes") as File[];

    if (!files || files.length === 0) {
      return new Response(
        JSON.stringify({ error: "No resume files provided" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Processing ${files.length} resume files`);

    const results: UploadResult[] = [];

    for (const file of files) {
      const filename = file.name;
      console.log(`Processing: ${filename}`);

      try {
        // Convert file to base64
        const arrayBuffer = await file.arrayBuffer();
        const base64Content = btoa(
          new Uint8Array(arrayBuffer).reduce((data, byte) => data + String.fromCharCode(byte), "")
        );

        const fileExt = filename.split(".").pop()?.toLowerCase();
        const mimeType = fileExt === "pdf" 
          ? "application/pdf" 
          : fileExt === "docx" 
            ? "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            : "application/msword";

        // Parse resume with AI
        const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
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
                content: `You are an expert resume parser. Extract structured information including the email address. The email is CRITICAL for account creation.`
              },
              {
                role: "user",
                content: [
                  {
                    type: "text",
                    text: "Parse this resume and extract the profile information using the extract_resume_data function. Make sure to extract the email address."
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
            tools: [
              {
                type: "function",
                function: {
                  name: "extract_resume_data",
                  description: "Extract structured profile data from a resume",
                  parameters: {
                    type: "object",
                    properties: {
                      full_name: { type: "string", description: "Person's full name" },
                      role: { type: "string", description: "Current job title or position" },
                      headline: { type: "string", description: "Brief professional headline" },
                      professional_summary: { type: "string", description: "Professional summary" },
                      location: { type: "string", description: "City, State/Country" },
                      phone: { type: "string", description: "Phone number" },
                      email: { type: "string", description: "Email address - CRITICAL" },
                      skills: { type: "array", items: { type: "string" } },
                      experience: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            company: { type: "string" },
                            location: { type: "string" },
                            start_date: { type: "string" },
                            end_date: { type: "string" },
                            description: { type: "string" },
                            current: { type: "boolean" }
                          },
                          required: ["title", "company"]
                        }
                      },
                      education: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            degree: { type: "string" },
                            institution: { type: "string" },
                            field: { type: "string" },
                            start_year: { type: "string" },
                            end_year: { type: "string" }
                          },
                          required: ["degree", "institution"]
                        }
                      },
                      achievements: { type: "array", items: { type: "string" } },
                      research_papers: {
                        type: "array",
                        items: {
                          type: "object",
                          properties: {
                            title: { type: "string" },
                            journal: { type: "string" },
                            year: { type: "string" },
                            doi: { type: "string" },
                            authors: { type: "string" }
                          },
                          required: ["title"]
                        }
                      }
                    },
                    required: ["full_name", "email"]
                  }
                }
              }
            ],
            tool_choice: { type: "function", function: { name: "extract_resume_data" } },
            temperature: 0.1,
            max_tokens: 8000,
          }),
        });

        if (!aiResponse.ok) {
          const errorText = await aiResponse.text();
          console.error(`AI error for ${filename}:`, errorText);
          results.push({ filename, success: false, error: "Failed to parse resume" });
          continue;
        }

        const aiResult = await aiResponse.json();
        let parsedResume: ParsedResume;

        try {
          const toolCall = aiResult.choices?.[0]?.message?.tool_calls?.[0];
          if (toolCall?.function?.arguments) {
            parsedResume = JSON.parse(toolCall.function.arguments);
          } else {
            results.push({ filename, success: false, error: "Failed to extract data from resume" });
            continue;
          }
        } catch (parseError) {
          console.error(`Parse error for ${filename}:`, parseError);
          results.push({ filename, success: false, error: "Failed to parse AI response" });
          continue;
        }

        // Check if email was extracted
        if (!parsedResume.email) {
          results.push({ filename, success: false, error: "No email found in resume" });
          continue;
        }

        const email = parsedResume.email.toLowerCase().trim();
        console.log(`Creating user for: ${email}`);

        // Check if user already exists
        const { data: existingUsers } = await serviceClient.auth.admin.listUsers();
        const existingUser = existingUsers?.users?.find(u => u.email === email);

        if (existingUser) {
          results.push({ filename, success: false, email, error: "User already exists" });
          continue;
        }

        // Create user with default password
        const { data: newUser, error: createError } = await serviceClient.auth.admin.createUser({
          email: email,
          password: "123456",
          email_confirm: true,
          user_metadata: {
            full_name: parsedResume.full_name || email.split("@")[0],
            user_type: "candidate"
          }
        });

        if (createError || !newUser.user) {
          console.error(`User creation error for ${email}:`, createError);
          results.push({ filename, success: false, email, error: createError?.message || "Failed to create user" });
          continue;
        }

        // Upload resume to storage
        const resumePath = `${newUser.user.id}/${Date.now()}_${filename}`;
        const { error: uploadError } = await serviceClient.storage
          .from("resumes")
          .upload(resumePath, file, {
            contentType: mimeType,
            upsert: false
          });

        if (uploadError) {
          console.error(`Resume upload error for ${email}:`, uploadError);
        }

        // Update profile with parsed data
        const profileData: Record<string, unknown> = {
          full_name: parsedResume.full_name,
          email: email,
          role: parsedResume.role,
          headline: parsedResume.headline,
          professional_summary: parsedResume.professional_summary,
          location: parsedResume.location,
          phone: parsedResume.phone,
          skills: parsedResume.skills || [],
          experience: parsedResume.experience || [],
          education: parsedResume.education || [],
          achievements: parsedResume.achievements || [],
          research_papers: parsedResume.research_papers || [],
          user_type: "candidate",
          resume_url: uploadError ? null : resumePath
        };

        // Remove undefined values
        Object.keys(profileData).forEach(key => {
          if (profileData[key] === undefined) {
            delete profileData[key];
          }
        });

        const { error: profileError } = await serviceClient
          .from("profiles")
          .update(profileData)
          .eq("id", newUser.user.id);

        if (profileError) {
          console.error(`Profile update error for ${email}:`, profileError);
        }

        results.push({ 
          filename, 
          success: true, 
          email, 
          userId: newUser.user.id 
        });

        console.log(`Successfully created user: ${email}`);

      } catch (fileError) {
        console.error(`Error processing ${filename}:`, fileError);
        results.push({ 
          filename, 
          success: false, 
          error: fileError instanceof Error ? fileError.message : "Unknown error" 
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const failCount = results.filter(r => !r.success).length;

    return new Response(
      JSON.stringify({ 
        success: true,
        message: `Processed ${files.length} resumes: ${successCount} succeeded, ${failCount} failed`,
        results 
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
