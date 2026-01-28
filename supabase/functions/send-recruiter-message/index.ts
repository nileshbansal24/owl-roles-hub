import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface MessageRequest {
  to: string;
  subject: string;
  message: string;
  candidateName: string;
  candidateId: string;
  recruiterId: string;
  jobId?: string;
  jobTitle?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { to, subject, message, candidateName, candidateId, recruiterId, jobId, jobTitle }: MessageRequest = await req.json();

    // Validate required fields
    if (!to || !subject || !message || !candidateId || !recruiterId) {
      console.error("Missing required fields:", { to: !!to, subject: !!subject, message: !!message, candidateId: !!candidateId, recruiterId: !!recruiterId });
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(to)) {
      console.error("Invalid email format:", to);
      return new Response(
        JSON.stringify({ error: "Invalid email format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Create Supabase client to save message
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Create message record first to get the ID for tracking
    const { data: messageRecord, error: insertError } = await supabase
      .from("recruiter_messages")
      .insert({
        recruiter_id: recruiterId,
        candidate_id: candidateId,
        candidate_email: to,
        candidate_name: candidateName || "Candidate",
        subject,
        message,
        job_id: jobId || null,
        job_title: jobTitle || null,
        status: "sent",
      })
      .select()
      .single();

    if (insertError) {
      console.error("Error saving message:", insertError);
      // Continue sending email even if save fails
    }

    const messageId = messageRecord?.id;
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const trackingPixelUrl = messageId 
      ? `${supabaseUrl}/functions/v1/track-email-event?id=${messageId}&event=open`
      : null;

    console.log(`Sending message to ${candidateName} at ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Message ID for tracking: ${messageId}`);

    // Convert plain text message to HTML with proper formatting
    const htmlMessage = message
      .split("\n")
      .map((line: string) => line.trim() === "" ? "<br>" : `<p style="margin: 0 0 10px 0;">${line}</p>`)
      .join("");

    const emailResponse = await resend.emails.send({
      from: "OWL ROLES <noreply@resend.dev>", // Use verified domain in production
      to: [to],
      subject: subject,
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); padding: 20px; border-radius: 12px 12px 0 0;">
              <h1 style="color: white; margin: 0; font-size: 24px;">OWL ROLES</h1>
              <p style="color: rgba(255,255,255,0.9); margin: 5px 0 0 0; font-size: 14px;">Academic Career Platform</p>
            </div>
            <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
              <p style="margin: 0 0 20px 0; color: #6b7280; font-size: 14px;">
                You have received a message from a recruiter on OWL ROLES:
              </p>
              <div style="background: #f9fafb; border-radius: 8px; padding: 20px; margin-bottom: 20px;">
                ${htmlMessage}
              </div>
              <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
              <p style="color: #9ca3af; font-size: 12px; margin: 0;">
                This message was sent via OWL ROLES. To manage your notifications or update your profile, visit our platform.
              </p>
            </div>
            ${trackingPixelUrl ? `<img src="${trackingPixelUrl}" width="1" height="1" style="display:none;" alt="" />` : ""}
          </body>
        </html>
      `,
    });

    console.log("Message sent successfully:", emailResponse);

    return new Response(JSON.stringify({ success: true, data: emailResponse, messageId }), {
      status: 200,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  } catch (error: any) {
    console.error("Error sending recruiter message:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Failed to send message" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
