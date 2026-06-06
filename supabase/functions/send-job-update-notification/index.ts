import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { Resend } from "https://esm.sh/resend@2.0.0";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const resend = new Resend(Deno.env.get("RESEND_API_KEY"));

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const escapeHtml = (str: string): string =>
  str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

interface UpdateRequest {
  jobId: string;
  changes?: string[]; // human-readable list of changed fields
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { jobId, changes = [] }: UpdateRequest = await req.json();
    if (!jobId) {
      return new Response(JSON.stringify({ error: "jobId required" }), {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization required" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_ANON_KEY") ?? "",
      { global: { headers: { Authorization: authHeader } } },
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }
    const userId = claimsData.claims.sub as string;

    const serviceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    // Authorize: caller must be owner or collaborator
    const { data: job, error: jobErr } = await serviceClient
      .from("jobs")
      .select("id, title, institute, location, created_by")
      .eq("id", jobId)
      .single();
    if (jobErr || !job) {
      return new Response(JSON.stringify({ error: "Job not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    let allowed = job.created_by === userId;
    if (!allowed) {
      const { data: collab } = await serviceClient
        .from("job_collaborators")
        .select("recruiter_id")
        .eq("job_id", jobId)
        .eq("recruiter_id", userId)
        .maybeSingle();
      allowed = !!collab;
    }
    if (!allowed) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      });
    }

    // Fetch applicants
    const { data: apps } = await serviceClient
      .from("job_applications")
      .select("applicant_email, applicant_id")
      .eq("job_id", jobId);

    const emails = Array.from(
      new Set((apps ?? []).map((a: any) => a.applicant_email).filter(Boolean)),
    );

    if (emails.length === 0) {
      return new Response(
        JSON.stringify({ success: true, notified: 0 }),
        { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
      );
    }

    const safeTitle = escapeHtml(job.title);
    const safeInstitute = escapeHtml(job.institute);
    const safeLocation = escapeHtml(job.location ?? "");
    const changeList = changes.length
      ? `<ul style="margin: 0 0 16px; padding-left: 20px; color:#475569;">${changes
          .map((c) => `<li style="margin-bottom:4px;">${escapeHtml(c)}</li>`)
          .join("")}</ul>`
      : `<p style="color:#475569; margin:0 0 16px;">The recruiter has updated the job posting. Please review the latest details.</p>`;

    const html = `
      <!DOCTYPE html><html><head><meta charset="utf-8"></head>
      <body style="margin:0;padding:0;font-family:'Segoe UI',Tahoma,sans-serif;background:#f8fafc;">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;margin:0 auto;background:#fff;">
          <tr><td style="padding:32px 28px;background:linear-gradient(135deg,#2563eb,#1d4ed8);text-align:center;">
            <h1 style="margin:0;color:#fff;font-size:24px;">OWL ROLES</h1>
            <p style="margin:6px 0 0;color:rgba(255,255,255,.9);font-size:13px;">Job Update Notification</p>
          </td></tr>
          <tr><td style="padding:32px 28px;">
            <div style="width:60px;height:4px;background:#f59e0b;border-radius:2px;margin-bottom:20px;"></div>
            <h2 style="margin:0 0 16px;color:#1e293b;font-size:22px;">A job you applied to was updated</h2>
            <p style="color:#475569;margin:0 0 16px;font-size:15px;line-height:1.6;">
              The recruiter has made changes to <strong>${safeTitle}</strong> at <strong>${safeInstitute}</strong>${safeLocation ? ` (${safeLocation})` : ""}.
            </p>
            ${changeList}
            <div style="background:#f1f5f9;border-radius:8px;padding:16px;margin:16px 0;">
              <p style="margin:0 0 4px;color:#64748b;font-size:12px;text-transform:uppercase;letter-spacing:.5px;">Position</p>
              <p style="margin:0;color:#1e293b;font-size:16px;font-weight:600;">${safeTitle}</p>
              <p style="margin:4px 0 0;color:#64748b;font-size:13px;">${safeInstitute}</p>
            </div>
            <p style="color:#64748b;font-size:13px;margin:20px 0 0;">Sign in to your dashboard to review the latest job description.</p>
          </td></tr>
          <tr><td style="padding:24px;background:#f8fafc;border-top:1px solid #e2e8f0;">
            <p style="margin:0;color:#94a3b8;font-size:12px;text-align:center;">Automated message from OWL ROLES. Please do not reply.</p>
          </td></tr>
        </table>
      </body></html>`;

    // Send individually so a single bad address doesn't break the batch
    let sent = 0;
    await Promise.all(
      emails.map(async (to) => {
        try {
          await resend.emails.send({
            from: "OWL ROLES <onboarding@resend.dev>",
            to: [to as string],
            subject: `Update on ${job.title} — ${job.institute}`,
            html,
          });
          sent++;
        } catch (e) {
          console.error("Failed to email applicant", e);
        }
      }),
    );

    return new Response(
      JSON.stringify({ success: true, notified: sent }),
      { status: 200, headers: { "Content-Type": "application/json", ...corsHeaders } },
    );
  } catch (e: any) {
    console.error("send-job-update-notification error:", e);
    return new Response(JSON.stringify({ error: "Failed to send notifications" }), {
      status: 500,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }
};

serve(handler);
