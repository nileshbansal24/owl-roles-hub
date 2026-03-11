import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface VerificationNotificationRequest {
  recruiterEmail: string;
  recruiterName: string;
  institutionName: string;
  status: "verified" | "rejected";
  notes?: string;
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { recruiterEmail, recruiterName, institutionName, status, notes } =
      (await req.json()) as VerificationNotificationRequest;

    if (!recruiterEmail || !status) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const isApproved = status === "verified";
    const subject = isApproved
      ? `✅ Your institution has been verified – ${institutionName}`
      : `❌ Verification update for ${institutionName}`;

    const heading = isApproved
      ? "Institution Verified!"
      : "Verification Not Approved";

    const body = isApproved
      ? `<p>Great news, <strong>${recruiterName || "Recruiter"}</strong>!</p>
         <p>Your institution <strong>${institutionName}</strong> has been verified by our admin team. A verification badge will now appear on your profile and job listings, helping candidates trust your postings.</p>
         <p>You can continue posting jobs with full verified status.</p>`
      : `<p>Hello <strong>${recruiterName || "Recruiter"}</strong>,</p>
         <p>Unfortunately, your verification request for <strong>${institutionName}</strong> was not approved at this time.</p>
         ${notes ? `<p><strong>Reason:</strong> ${notes}</p>` : ""}
         <p>Please review your submitted documents and re-apply with valid proof of affiliation. If you believe this is an error, please contact our support team.</p>`;

    const color = isApproved ? "#10b981" : "#ef4444";

    const html = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f9fafb; padding: 40px 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="background: ${color}; padding: 24px; text-align: center;">
            <h1 style="color: #ffffff; margin: 0; font-size: 22px;">${heading}</h1>
          </div>
          <div style="padding: 32px 24px;">
            ${body}
          </div>
          <div style="padding: 16px 24px; background: #f3f4f6; text-align: center; font-size: 12px; color: #6b7280;">
            <p>This is an automated message from OWL Roles Hub.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "OWL Roles Hub <onboarding@resend.dev>",
        to: [recruiterEmail],
        subject,
        html,
      }),
    });

    const emailData = await emailResponse.json();

    if (!emailResponse.ok) {
      console.error("Resend error:", emailData);
      return new Response(
        JSON.stringify({ error: "Failed to send email", details: emailData }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
