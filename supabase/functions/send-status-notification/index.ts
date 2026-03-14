import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface StatusNotificationRequest {
  applicationId?: string;
  newStatus: string;
  jobTitle: string;
  instituteName: string;
  interviewId?: string;
  candidateName?: string;
  confirmedTime?: string;
  declineReason?: string;
  recruiterEmail?: string;
  interviewType?: string;
  candidateEmail?: string;
  meetingLink?: string;
  location?: string;
  notes?: string;
}

const escapeHtml = (str: string): string =>
  str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const getStatusEmailContent = (status: string, jobTitle: string, instituteName: string, extras?: { candidateName?: string; confirmedTime?: string; declineReason?: string; interviewType?: string; meetingLink?: string; location?: string; notes?: string }) => {
  // Sanitize all dynamic values
  const safeJobTitle = escapeHtml(jobTitle);
  const safeInstitute = escapeHtml(instituteName);
  const safeCandidateName = extras?.candidateName ? escapeHtml(extras.candidateName) : 'The candidate';
  const safeConfirmedTime = extras?.confirmedTime ? escapeHtml(extras.confirmedTime) : 'Time to be confirmed';
  const safeDeclineReason = extras?.declineReason ? escapeHtml(extras.declineReason) : '';
  const safeInterviewType = extras?.interviewType ? escapeHtml(extras.interviewType) : '';
  const safeLocation = extras?.location ? escapeHtml(extras.location) : '';
  const safeNotes = extras?.notes ? escapeHtml(extras.notes) : '';
  // Validate meetingLink is https
  const safeMeetingLink = extras?.meetingLink && extras.meetingLink.startsWith('https://') ? escapeHtml(extras.meetingLink) : '';

  const statusMessages: Record<string, { subject: string; heading: string; body: string; color: string }> = {
    reviewed: {
      subject: `Your application for ${safeJobTitle} is under review`,
      heading: "Application Under Review",
      body: `Great news! Your application for the <strong>${safeJobTitle}</strong> position at <strong>${safeInstitute}</strong> has been reviewed by the hiring team. They are currently evaluating your profile and will get back to you soon.`,
      color: "#3b82f6",
    },
    shortlisted: {
      subject: `Congratulations! You've been shortlisted for ${safeJobTitle}`,
      heading: "You've Been Shortlisted! 🎉",
      body: `Excellent news! We're pleased to inform you that you have been <strong>shortlisted</strong> for the <strong>${safeJobTitle}</strong> position at <strong>${safeInstitute}</strong>. The hiring team was impressed with your profile and would like to move forward with your application.`,
      color: "#22c55e",
    },
    rejected: {
      subject: `Update on your application for ${safeJobTitle}`,
      heading: "Application Update",
      body: `Thank you for your interest in the <strong>${safeJobTitle}</strong> position at <strong>${safeInstitute}</strong>. After careful consideration, we have decided to move forward with other candidates whose experience more closely matches our current needs. We encourage you to apply for future opportunities that match your qualifications.`,
      color: "#6b7280",
    },
    pending: {
      subject: `Application received for ${safeJobTitle}`,
      heading: "Application Received",
      body: `Your application for the <strong>${safeJobTitle}</strong> position at <strong>${safeInstitute}</strong> has been received. The hiring team will review your profile shortly.`,
      color: "#f59e0b",
    },
    interview_confirmed: {
      subject: `✅ Interview Confirmed: ${safeCandidateName} for ${safeJobTitle}`,
      heading: "Interview Confirmed! 🎉",
      body: `Great news! <strong>${safeCandidateName}</strong> has confirmed the interview for the <strong>${safeJobTitle}</strong> position at <strong>${safeInstitute}</strong>.
      
      <div style="background-color: #dcfce7; border: 1px solid #86efac; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; color: #166534; font-weight: 600;">📅 Confirmed Time</p>
        <p style="margin: 0; color: #15803d; font-size: 16px;">${safeConfirmedTime}</p>
        ${safeInterviewType ? `<p style="margin: 8px 0 0; color: #166534; font-size: 14px;">Interview Type: ${safeInterviewType}</p>` : ''}
      </div>
      
      Please ensure you're prepared for the scheduled interview. You can view all interview details in your recruiter dashboard.`,
      color: "#22c55e",
    },
    interview_declined: {
      subject: `❌ Interview Declined: ${safeCandidateName} for ${safeJobTitle}`,
      heading: "Interview Declined",
      body: `<strong>${safeCandidateName}</strong> has declined the interview for the <strong>${safeJobTitle}</strong> position at <strong>${safeInstitute}</strong>.
      
      ${safeDeclineReason ? `
      <div style="background-color: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; color: #991b1b; font-weight: 600;">Reason provided:</p>
        <p style="margin: 0; color: #b91c1c; font-size: 14px;">${safeDeclineReason}</p>
      </div>
      ` : ''}
      
      You may want to reach out to the candidate to reschedule or consider other candidates for this position.`,
      color: "#ef4444",
    },
    interview_scheduled: {
      subject: `Interview scheduled for ${safeJobTitle}`,
      heading: "Interview Scheduled 📅",
      body: `An interview has been scheduled for your application to the <strong>${safeJobTitle}</strong> position at <strong>${safeInstitute}</strong>. Please check your dashboard to review the proposed time slots and confirm your availability.`,
      color: "#8b5cf6",
    },
    interview_reminder: {
      subject: `📅 Interview Reminder: ${safeJobTitle} at ${safeInstitute}`,
      heading: "Interview Reminder 📅",
      body: `This is a reminder about your upcoming interview for the <strong>${safeJobTitle}</strong> position at <strong>${safeInstitute}</strong>.
      
      <div style="background-color: #dbeafe; border: 1px solid #93c5fd; border-radius: 8px; padding: 16px; margin: 16px 0;">
        <p style="margin: 0 0 8px; color: #1e40af; font-weight: 600;">📅 Interview Details</p>
        <p style="margin: 0 0 8px; color: #1e3a8a; font-size: 16px;"><strong>Date & Time:</strong> ${safeConfirmedTime || 'Please check your dashboard'}</p>
        <p style="margin: 0 0 8px; color: #1e3a8a; font-size: 14px;"><strong>Type:</strong> ${safeInterviewType === 'video' ? 'Video Call' : safeInterviewType === 'phone' ? 'Phone Call' : safeInterviewType === 'in_person' ? 'In-Person' : 'Interview'}</p>
        ${safeMeetingLink ? `<p style="margin: 0 0 8px; color: #1e3a8a; font-size: 14px;"><strong>Meeting Link:</strong> <a href="${safeMeetingLink}" style="color: #2563eb;">${safeMeetingLink}</a></p>` : ''}
        ${safeLocation ? `<p style="margin: 0 0 8px; color: #1e3a8a; font-size: 14px;"><strong>Location:</strong> ${safeLocation}</p>` : ''}
        ${safeNotes ? `<p style="margin: 8px 0 0; color: #1e3a8a; font-size: 14px;"><strong>Notes:</strong> ${safeNotes}</p>` : ''}
      </div>
      
      Please make sure to be prepared and on time for your interview. Best of luck!`,
      color: "#2563eb",
    },
  };

  return statusMessages[status] || statusMessages.pending;
};

const handler = async (req: Request): Promise<Response> => {
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
      interviewType,
      interviewId,
      meetingLink,
      location,
      notes,
    } = requestData;

    // Validate JWT - get authenticated user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authorization required" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } }
    );

    // Validate the JWT by getting the user
    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(
        JSON.stringify({ error: "Invalid token" }),
        { status: 401, headers: { "Content-Type": "application/json", ...corsHeaders } }
      );
    }

    const userId = claimsData.claims.sub as string;

    // Service client for verified lookups
    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    let recipientEmail: string | null = null;

    // For interview responses (confirmed/declined), look up the recruiter email from the interview record
    if (newStatus === "interview_confirmed" || newStatus === "interview_declined") {
      if (!interviewId) {
        return new Response(
          JSON.stringify({ error: "interviewId is required for interview notifications" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify the caller is the candidate on this interview
      const { data: interview, error: intError } = await serviceClient
        .from("interviews")
        .select("candidate_id, recruiter_id")
        .eq("id", interviewId)
        .single();

      if (intError || !interview) {
        return new Response(
          JSON.stringify({ error: "Interview not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (interview.candidate_id !== userId) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get recruiter email from profiles (not from request body)
      const { data: recruiterProfile } = await serviceClient
        .from("profiles")
        .select("email")
        .eq("id", interview.recruiter_id)
        .single();

      recipientEmail = recruiterProfile?.email || null;
    } else if (newStatus === "interview_reminder") {
      if (!interviewId) {
        return new Response(
          JSON.stringify({ error: "interviewId is required for interview reminders" }),
          { status: 400, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify the caller is the recruiter on this interview
      const { data: interview, error: intError } = await serviceClient
        .from("interviews")
        .select("candidate_id, recruiter_id")
        .eq("id", interviewId)
        .single();

      if (intError || !interview) {
        return new Response(
          JSON.stringify({ error: "Interview not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      if (interview.recruiter_id !== userId) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Get candidate email from profiles (not from request body)
      const { data: candidateProfile } = await serviceClient
        .from("profiles")
        .select("email")
        .eq("id", interview.candidate_id)
        .single();

      recipientEmail = candidateProfile?.email || null;
    } else if (applicationId) {
      // For application status updates, verify caller owns the job
      const { data: application, error: appError } = await serviceClient
        .from("job_applications")
        .select("applicant_email, applicant_id, job_id")
        .eq("id", applicationId)
        .single();

      if (appError || !application) {
        return new Response(
          JSON.stringify({ error: "Application not found" }),
          { status: 404, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      // Verify the caller is the job owner (recruiter)
      const { data: job } = await serviceClient
        .from("jobs")
        .select("created_by")
        .eq("id", application.job_id)
        .single();

      if (!job || job.created_by !== userId) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { "Content-Type": "application/json", ...corsHeaders } }
        );
      }

      recipientEmail = application.applicant_email;
    }

    if (!recipientEmail) {
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
      meetingLink,
      location,
      notes,
    });

    const safeJobTitle = escapeHtml(jobTitle);
    const safeInstitute = escapeHtml(instituteName);

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
                  <p style="margin: 0; color: #1e293b; font-size: 18px; font-weight: 600;">${safeJobTitle}</p>
                  <p style="margin: 4px 0 0; color: #64748b; font-size: 14px;">${safeInstitute}</p>
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

    console.log("Email sent successfully to verified recipient");

    return new Response(
      JSON.stringify({ success: true }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  } catch (error: any) {
    console.error("Error in send-status-notification function:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send notification" }),
      { status: 500, headers: { "Content-Type": "application/json", ...corsHeaders } }
    );
  }
};

serve(handler);
