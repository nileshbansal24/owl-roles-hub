import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface AdminStats {
  // Institutions
  totalInstitutions: number;
  verifiedInstitutions: number;
  pendingVerifications: number;
  rejectedVerifications: number;
  
  // Candidates
  totalCandidates: number;
  activeCandidates: number; // candidates who applied in last 30 days
  
  // Jobs
  totalJobs: number;
  jobsThisMonth: number;
  
  // Applications
  totalApplications: number;
  pendingApplications: number;
  acceptedApplications: number;
  rejectedApplications: number;
  
  // Interviews
  totalInterviews: number;
  scheduledInterviews: number;
  completedInterviews: number;
  
  // Activity
  recentSignups: number; // last 7 days
  recentJobs: number; // last 7 days
}

export interface InstitutionData {
  id: string;
  full_name: string | null;
  email: string | null;
  university: string | null;
  created_at: string;
  verification_status: string | null;
  jobs_count: number;
}

export interface CandidateData {
  id: string;
  full_name: string | null;
  email: string | null;
  university: string | null;
  location: string | null;
  created_at: string;
  applications_count: number;
  last_active: string | null;
}

export interface JobData {
  id: string;
  title: string;
  institute: string;
  location: string;
  job_type: string | null;
  created_at: string;
  applications_count: number;
  recruiter_name: string | null;
  recruiter_email: string | null;
}

export interface EmailData {
  id: string;
  email: string | null;
  full_name: string | null;
  user_type: string | null;
  created_at: string;
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [institutions, setInstitutions] = useState<InstitutionData[]>([]);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [emails, setEmails] = useState<EmailData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

      // Fetch all profiles
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, user_type, created_at");

      const recruiters = profiles?.filter(p => p.user_type === "recruiter") || [];
      const candidatesData = profiles?.filter(p => p.user_type === "candidate") || [];

      // Fetch verifications
      const { data: verifications } = await supabase
        .from("institution_verifications")
        .select("recruiter_id, status");

      const verified = verifications?.filter(v => v.status === "verified").length || 0;
      const pending = verifications?.filter(v => v.status === "pending").length || 0;
      const rejected = verifications?.filter(v => v.status === "rejected").length || 0;

      // Fetch jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, created_at");

      const jobsThisMonth = jobsData?.filter(j => j.created_at >= startOfMonth).length || 0;
      const recentJobs = jobsData?.filter(j => j.created_at >= sevenDaysAgo).length || 0;

      // Fetch applications
      const { data: applications } = await supabase
        .from("job_applications")
        .select("id, status, applicant_id, created_at");

      const pendingApps = applications?.filter(a => a.status === "pending").length || 0;
      const acceptedApps = applications?.filter(a => a.status === "accepted" || a.status === "shortlisted").length || 0;
      const rejectedApps = applications?.filter(a => a.status === "rejected").length || 0;

      // Active candidates (applied in last 30 days)
      const activeApplicants = new Set(
        applications?.filter(a => a.created_at >= thirtyDaysAgo).map(a => a.applicant_id)
      );

      // Fetch interviews
      const { data: interviews } = await supabase
        .from("interviews")
        .select("id, status");

      const scheduledInt = interviews?.filter(i => i.status === "confirmed" || i.status === "pending").length || 0;
      const completedInt = interviews?.filter(i => i.status === "completed").length || 0;

      // Recent signups
      const recentSignups = profiles?.filter(p => p.created_at >= sevenDaysAgo).length || 0;

      setStats({
        totalInstitutions: recruiters.length,
        verifiedInstitutions: verified,
        pendingVerifications: pending,
        rejectedVerifications: rejected,
        totalCandidates: candidatesData.length,
        activeCandidates: activeApplicants.size,
        totalJobs: jobsData?.length || 0,
        jobsThisMonth,
        totalApplications: applications?.length || 0,
        pendingApplications: pendingApps,
        acceptedApplications: acceptedApps,
        rejectedApplications: rejectedApps,
        totalInterviews: interviews?.length || 0,
        scheduledInterviews: scheduledInt,
        completedInterviews: completedInt,
        recentSignups,
        recentJobs,
      });
    } catch (error) {
      console.error("Error fetching admin stats:", error);
    }
  };

  const fetchInstitutions = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, university, created_at")
        .eq("user_type", "recruiter")
        .order("created_at", { ascending: false });

      const { data: verifications } = await supabase
        .from("institution_verifications")
        .select("recruiter_id, status");

      const { data: jobs } = await supabase
        .from("jobs")
        .select("id, created_by");

      const verificationMap = new Map(verifications?.map(v => [v.recruiter_id, v.status]));
      const jobCounts = new Map<string, number>();
      jobs?.forEach(j => {
        jobCounts.set(j.created_by, (jobCounts.get(j.created_by) || 0) + 1);
      });

      const institutionsData: InstitutionData[] = (profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        university: p.university,
        created_at: p.created_at,
        verification_status: verificationMap.get(p.id) || null,
        jobs_count: jobCounts.get(p.id) || 0,
      }));

      setInstitutions(institutionsData);
    } catch (error) {
      console.error("Error fetching institutions:", error);
    }
  };

  const fetchCandidates = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email, university, location, created_at, updated_at")
        .eq("user_type", "candidate")
        .order("created_at", { ascending: false });

      const { data: applications } = await supabase
        .from("job_applications")
        .select("applicant_id, created_at");

      const appCounts = new Map<string, number>();
      const lastActive = new Map<string, string>();
      
      applications?.forEach(a => {
        appCounts.set(a.applicant_id, (appCounts.get(a.applicant_id) || 0) + 1);
        const current = lastActive.get(a.applicant_id);
        if (!current || a.created_at > current) {
          lastActive.set(a.applicant_id, a.created_at);
        }
      });

      const candidatesData: CandidateData[] = (profiles || []).map(p => ({
        id: p.id,
        full_name: p.full_name,
        email: p.email,
        university: p.university,
        location: p.location,
        created_at: p.created_at,
        applications_count: appCounts.get(p.id) || 0,
        last_active: lastActive.get(p.id) || p.updated_at,
      }));

      setCandidates(candidatesData);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  const fetchJobs = async () => {
    try {
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("id, title, institute, location, job_type, created_at, created_by")
        .order("created_at", { ascending: false });

      const { data: applications } = await supabase
        .from("job_applications")
        .select("job_id");

      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .eq("user_type", "recruiter");

      const appCounts = new Map<string, number>();
      applications?.forEach(a => {
        appCounts.set(a.job_id, (appCounts.get(a.job_id) || 0) + 1);
      });

      const profileMap = new Map(profiles?.map(p => [p.id, { name: p.full_name, email: p.email }]));

      const jobsList: JobData[] = (jobsData || []).map(j => ({
        id: j.id,
        title: j.title,
        institute: j.institute,
        location: j.location,
        job_type: j.job_type,
        created_at: j.created_at,
        applications_count: appCounts.get(j.id) || 0,
        recruiter_name: profileMap.get(j.created_by)?.name || null,
        recruiter_email: profileMap.get(j.created_by)?.email || null,
      }));

      setJobs(jobsList);
    } catch (error) {
      console.error("Error fetching jobs:", error);
    }
  };

  const fetchEmails = async () => {
    try {
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, email, full_name, user_type, created_at")
        .order("created_at", { ascending: false });

      const emailsList: EmailData[] = (profiles || []).map(p => ({
        id: p.id,
        email: p.email,
        full_name: p.full_name,
        user_type: p.user_type,
        created_at: p.created_at,
      }));

      setEmails(emailsList);
    } catch (error) {
      console.error("Error fetching emails:", error);
    }
  };

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      await Promise.all([fetchStats(), fetchInstitutions(), fetchCandidates(), fetchJobs(), fetchEmails()]);
      setLoading(false);
    };
    fetchAll();
  }, []);

  const refetch = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchInstitutions(), fetchCandidates(), fetchJobs(), fetchEmails()]);
    setLoading(false);
  };

  return { stats, institutions, candidates, jobs, emails, loading, refetch };
};
