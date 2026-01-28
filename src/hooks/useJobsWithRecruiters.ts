import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface JobWithRecruiter {
  id: string;
  title: string;
  institute: string;
  location: string;
  salary_range: string | null;
  job_type: string | null;
  tags: string[] | null;
  created_at: string;
  description?: string | null;
  recruiter?: {
    avatar_url: string | null;
    full_name: string | null;
    isVerified: boolean;
  } | null;
}

export const useJobsWithRecruiters = () => {
  const [jobs, setJobs] = useState<JobWithRecruiter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchJobsWithRecruiters = async () => {
      try {
        // First fetch jobs from public view
        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs_public")
          .select("*")
          .order("created_at", { ascending: false });

        if (jobsError) {
          console.error("Error fetching jobs:", jobsError);
          setLoading(false);
          return;
        }

        // Try to fetch full job data with created_by (requires auth)
        const { data: fullJobsData } = await supabase
          .from("jobs")
          .select("id, created_by")
          .order("created_at", { ascending: false });

        // Get recruiter IDs
        const recruiterIds = fullJobsData
          ?.filter((j) => j.created_by)
          .map((j) => j.created_by) || [];

        // Fetch recruiter profiles
        const { data: profilesData } = recruiterIds.length > 0
          ? await supabase
              .from("profiles_public")
              .select("id, avatar_url, full_name")
              .in("id", recruiterIds)
          : { data: [] };

        // Fetch verification statuses
        const { data: verificationsData } = recruiterIds.length > 0
          ? await supabase
              .from("institution_verifications")
              .select("recruiter_id, status")
              .in("recruiter_id", recruiterIds)
              .eq("status", "verified")
          : { data: [] };

        // Create lookup maps
        const jobCreatorMap = new Map<string, string>(
          fullJobsData?.map((j) => [j.id, j.created_by] as [string, string]) || []
        );
        
        interface ProfileData {
          id: string;
          avatar_url: string | null;
          full_name: string | null;
        }
        
        const profileMap = new Map<string, ProfileData>(
          (profilesData as ProfileData[] | null)?.map((p) => [p.id, p] as [string, ProfileData]) || []
        );
        const verificationMap = new Set<string>(
          verificationsData?.map((v) => v.recruiter_id) || []
        );

        // Merge data
        const enrichedJobs: JobWithRecruiter[] = (jobsData || []).map((job) => {
          const creatorId = jobCreatorMap.get(job.id!);
          const profile = creatorId ? profileMap.get(creatorId) : null;
          
          return {
            id: job.id!,
            title: job.title!,
            institute: job.institute!,
            location: job.location!,
            salary_range: job.salary_range,
            job_type: job.job_type,
            tags: job.tags,
            created_at: job.created_at!,
            description: job.description,
            recruiter: profile
              ? {
                  avatar_url: profile.avatar_url,
                  full_name: profile.full_name,
                  isVerified: verificationMap.has(creatorId!),
                }
              : null,
          };
        });

        setJobs(enrichedJobs);
      } catch (error) {
        console.error("Error in useJobsWithRecruiters:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchJobsWithRecruiters();
  }, []);

  return { jobs, loading };
};
