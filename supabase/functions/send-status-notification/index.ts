import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface StatusNotificationRequest {
  applicationId?: string;
  newStatus: string;
  jobTitle: string;
  instituteName: string;
  // Interview-specific fields
  interviewId?: string;
  candidateName?: string;
  confirmedTime?: string;
  declineReason?: string;
  recruiterEmail?: string;
  interviewType?: string;
}

const getStatusEmailContent = (status: string, jobTitle: string, instituteName: string, extras?: { candidateName?: string; confirmedTime?: string; declineReason?: string; interviewType?: string }) => {
  const statusMessages: Record<string, { subject: string; heading: string; body: string; color: string }> = {
    reviewed: {
      subject: `Your application for ${jobTitle} is under review`,
      heading: "Application Under Review",
      body: `Great news! Your application for the <strong>${jobTitle}</strong> position at <strong>${instituteName}</strong> has been reviewed by the hiring team. They are currently evaluating your profile and will get back to you soon.`,
      color: "#3b82f6",
    },
    shortlisted: {
      subject: `Congratulations! You've been shortlisted for ${jobTitle}`,
      heading: "You've Been Shortlisted! 🎉",
      body: `Excellent news! We're pleased to inform you that you have been <strong>shortlisted</strong> for the <strong>${jobTitle}</strong> position at <strong>${instituteName}</strong>. The hiring team was impressed with your profile and would like to move forward with your application.`,
      color: "#22c55e",
    },
    rejected: {
      subject: `Update on your application for ${jobTitle}`,
      heading: "Application Update",
      body: `Thank you for your interest in the <strong>${jobTitle}</strong> position at <strong>${instituteName}</strong>. After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs. We encourage you to apply for future opportunities that match your qualifications.`,
      color: "#6b7280",
    },
    pending: {
      subject: `Application received for ${jobTitle}`,
      heading: "Application Received",
      body: `Your application for the <strong>${jobTitle}</strong> position at <strong>${instituteName}</strong> has been received. The hiring team will review your profile shortly.`,
      color: "#f59e0b",
    },
    interview_confirmed: {
      subject: `✅ Interview Confirmed: ${extras?.candidateName || 'Candidate'} for ${jobTitle}`,
      heading: "Interview Confirmed! 🎉",
      body: `Great news! <strong>${extras?.candidateName || 'The candidate'}</strong> has confirmed the interview for the <strong>${jobTitle}</strong> position at <strong>${instituteName}</strong>.
      
      <div style="background-color: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; color: #166534; font-weight: 600;">📅 Confirmed Time</p>
        <p style="margin: 0; color: #15803d; font-size: 16px;">${extras?.confirmedTime || 'Time to be confirmed'}</p>
        ${extras?.interviewType ? `<p style="margin: 8px 0 0; color: #166534; font-size: 14px;">Interview Type: ${extras.interviewType}</p>` : ''}
      </div>
      
      Please ensure you're prepared for the scheduled interview. You can view all interview details in your recruiter dashboard.`,
      color: "#22c55e",
    },
    interview_declined: {
      subject: `❌ Interview Declined: ${extras?.candidateName || 'Candidate'} for ${jobTitle}`,
      heading: "Interview Declined",
      body: `<strong>${extras?.candidateName || 'The candidate'}</strong> has declined the interview for the <strong>${jobTitle}</strong> position at <strong>${instituteName}</strong>.
      
      ${extras?.declineReason ? `
      <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; color: #991b1b; font-weight: 600;">Reason provided:</p>
        <p style="margin: 0; color: #b91c1c; font-size: 14px;">${extras.declineReason}</p>
      </div>
      ` : ''}
      
      You may want to reach out to the candidate to reschedule or consider other candidates for this position.`,
      color: "#ef4444",
    },
    interview_scheduled: {
      subject: `Interview scheduled for ${jobTitle}`,
      heading: "Interview Scheduled 📅",
      body: `An interview has been scheduled for your application to the <strong>${jobTitle}</strong> position at <strong>${instituteName}</strong>. Please check your dashboard to review the proposed time slots and confirm your availability.`,
      color: "#8b5cf6",
    },
  };

  return statusMessages[status] || statusMessages.pending;
};

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const requestData: StatusNotificationRequest = await req.json();
    const { 
      applicationId, 
      newStatus, 
      jobTitle, 
      instituteName,
      candidateName,
      confirmedTime,
      declineReason,
      recruiterEmail,
      interviewType,
    } = requestData;

    console.log("Sending status notification:", requestData);

    // Get authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header");
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    // Initialize Supabase client with user's token
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    let recipientEmail: string | null = null;

    // For interview responses, send to recruiter
    if (newStatus === "interview_confirmed" || newStatus === "interview_declined") {
      recipientEmail = recruiterEmail || null;
      
      if (!recipientEmail) {
        console.log("No recruiter email provided for interview notification");
        return new Response(
          JSON.stringify({ success: true, message: "No recruiter email to notify" }),
          { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }
    } else if (applicationId) {
      // For application status updates, send to applicant
      const { data: application, error: appError } = await supabase
        .from("job_applications")
        .select("applicant_email, applicant_id")
        .eq("id", applicationId)
        .single();

      if (appError || !application) {
        console.error("Failed to fetch application:", appError);
        return new Response(
          JSON.stringify({ error: "Application not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      recipientEmail = application.applicant_email;
    }

    if (!recipientEmail) {
      console.log("No email found for recipient, skipping notification");
      return new Response(
        JSON.stringify({ success: true, message: "No email to notify" }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const content = getStatusEmailContent(newStatus, jobTitle, instituteName, {
      candidateName,
      confirmedTime,
      declineReason,
      interviewType,
    });

    const emailResponse = await resend.emails.send({
      from: "OWL ROLES <onboarding@resend.dev>",
      to: [recipientEmail],
      subject: content.subject,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f8fafc;">
          <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 600px; margin: 0 auto; background-color: #ffffff;">
            <tr>
              <td style="padding: 40px 30px; text-align: center; background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);">
                <h1 style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">OWL ROLES</h1>
                <p style="margin: 8px 0 0; color: rgba(255,255,255,0.9); font-size: 14px;">Academic Career Platform</p>
              </td>
            </tr>
            <tr>
              <td style="padding: 40px 30px;">
                <div style="width: 60px; height: 4px; background-color: ${content.color}; margin-bottom: 24px; border-radius: 2px;"></div>
                <h2 style="margin: 0 0 20px; color: #1e293b; font-size: 24px; font-weight: 600;">${content.heading}</h2>
                <div style="margin: 0 0 24px; color: #475569; font-size: 16px; line-height: 1.6;">${content.body}</div>
                <div style="background-color: #f1f5f9; border-radius: 8px; padding: 20px; margin: 24px 0;">
                  <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Position</p>
                  <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600;">${jobTitle}</p>
                  <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">${instituteName}</p>
                </div>
                <p style="margin: 24px 0 0; color: #64748b; font-size: 14px; line-height: 1.5;">
                  Visit your dashboard to view more details and take action.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #e2e8f0;">
                <p style="margin: 0; color: #94a3b8; font-size: 12px; text-align: center;">
                  This is an automated message from OWL ROLES. Please do not reply to this email.
                </p>
              </td>
            </tr>
          </table>
        </body>
        </html>
      `,
    });

    console.log("Email sent successfully:", emailResponse);

    return new Response(
      JSON.stringify({ success: true, emailResponse }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);