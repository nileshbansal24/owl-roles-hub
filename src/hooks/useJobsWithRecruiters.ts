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

interface PublicLandingDataResponse {
  jobs?: JobWithRecruiter[];
}

export const useJobsWithRecruiters = () => {
  const [jobs, setJobs] = useState<JobWithRecruiter[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchJobsWithRecruiters = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!session?.user) {
          const { data, error } = await supabase.functions.invoke("public-landing-data");

          if (error) throw error;

          if (isActive) {
            setJobs((data as PublicLandingDataResponse | null)?.jobs || []);
          }

          return;
        }

        const { data: jobsData, error: jobsError } = await supabase
          .from("jobs_public")
          .select("*")
          .order("created_at", { ascending: false });

        if (jobsError) {
          throw jobsError;
        }

        const { data: fullJobsData, error: fullJobsError } = await supabase
          .from("jobs")
          .select("id, created_by")
          .order("created_at", { ascending: false });

        if (fullJobsError) {
          throw fullJobsError;
        }

        const recruiterIds = fullJobsData
          ?.filter((job) => job.created_by)
          .map((job) => job.created_by) || [];

        const { data: profilesData, error: profilesError } = recruiterIds.length > 0
          ? await supabase
              .from("profiles_public")
              .select("id, avatar_url, full_name")
              .in("id", recruiterIds)
          : { data: [], error: null };

        if (profilesError) {
          throw profilesError;
        }

        const { data: verificationsData, error: verificationsError } = recruiterIds.length > 0
          ? await supabase
              .from("institution_verifications")
              .select("recruiter_id, status")
              .in("recruiter_id", recruiterIds)
              .eq("status", "verified")
          : { data: [], error: null };

        if (verificationsError) {
          throw verificationsError;
        }

        const jobCreatorMap = new Map<string, string>(
          fullJobsData?.map((job) => [job.id, job.created_by] as [string, string]) || []
        );

        interface ProfileData {
          id: string;
          avatar_url: string | null;
          full_name: string | null;
        }

        const profileMap = new Map<string, ProfileData>(
          (profilesData as ProfileData[] | null)?.map((profile) => [profile.id, profile] as [string, ProfileData]) || []
        );

        const verificationMap = new Set<string>(
          verificationsData?.map((verification) => verification.recruiter_id) || []
        );

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

        if (isActive) {
          setJobs(enrichedJobs);
        }
      } catch (error) {
        console.error("Error in useJobsWithRecruiters:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchJobsWithRecruiters();

    return () => {
      isActive = false;
    };
  }, []);

  return { jobs, loading };
};
