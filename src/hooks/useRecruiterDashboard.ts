import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { transformExperienceToDisplay, type DBExperience } from "@/lib/profileUtils";
import type { Profile, Job, Application, EnrichedInterview } from "@/types/recruiter";

export const useRecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  
  const [loading, setLoading] = useState(true);
  const [recruiterLocation, setRecruiterLocation] = useState<string | null>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [interviews, setInterviews] = useState<EnrichedInterview[]>([]);
  const [savedCandidateIds, setSavedCandidateIds] = useState<Set<string>>(new Set());
  const [savedCandidateNotes, setSavedCandidateNotes] = useState<Record<string, string>>({});
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [recruiterName, setRecruiterName] = useState<string | undefined>(undefined);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [hasReviewedCandidate, setHasReviewedCandidate] = useState(false);

  // Tab state
  const urlTab = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState(urlTab || "resdex");
  
  const handleTabChange = useCallback((value: string) => {
    setActiveTab(value);
    if (value === "resdex") {
      setSearchParams({});
    } else {
      setSearchParams({ tab: value });
    }
  }, [setSearchParams]);
  
  // Sync state when URL changes
  useEffect(() => {
    const tabFromUrl = searchParams.get("tab");
    if (tabFromUrl && tabFromUrl !== activeTab) {
      setActiveTab(tabFromUrl);
    } else if (!tabFromUrl && activeTab !== "resdex") {
      setActiveTab("resdex");
    }
  }, [searchParams, activeTab]);

  const sendStatusNotification = useCallback(async (
    applicationId: string, 
    newStatus: string, 
    jobTitle: string, 
    instituteName: string
  ) => {
    try {
      const { error } = await supabase.functions.invoke("send-status-notification", {
        body: { applicationId, newStatus, jobTitle, instituteName },
      });
      if (error) {
        console.error("Failed to send notification:", error);
      }
    } catch (err) {
      console.error("Email notification error:", err);
    }
  }, []);

  const updateApplicationStatus = useCallback(async (appId: string, newStatus: string) => {
    const app = applications.find((a) => a.id === appId);
    
    const { error } = await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setApplications((prev) =>
        prev.map((a) =>
          a.id === appId ? { ...a, status: newStatus } : a
        )
      );
      toast({
        title: "Status updated",
        description: `Application marked as ${newStatus}`,
      });
      
      if (app) {
        sendStatusNotification(appId, newStatus, app.jobs.title, app.jobs.institute);
      }
    }
  }, [applications, toast, sendStatusNotification]);

  const handleSaveCandidate = useCallback(async (candidateId: string) => {
    if (!user) return;
    
    const isSaved = savedCandidateIds.has(candidateId);
    
    if (isSaved) {
      const { error } = await supabase
        .from("saved_candidates")
        .delete()
        .eq("recruiter_id", user.id)
        .eq("candidate_id", candidateId);
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to remove candidate from saved list",
          variant: "destructive",
        });
      } else {
        setSavedCandidateIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(candidateId);
          return newSet;
        });
        toast({
          title: "Removed",
          description: "Candidate removed from saved list",
        });
      }
    } else {
      const { error } = await supabase
        .from("saved_candidates")
        .insert({
          recruiter_id: user.id,
          candidate_id: candidateId,
        });
      
      if (error) {
        toast({
          title: "Error",
          description: "Failed to save candidate",
          variant: "destructive",
        });
      } else {
        setSavedCandidateIds(prev => new Set([...prev, candidateId]));
        toast({
          title: "Saved",
          description: "Candidate added to your saved list",
        });
      }
    }
  }, [user, savedCandidateIds, toast]);

  const handleDownloadResume = useCallback(async (resumePath: string, applicantName: string) => {
    const { data, error } = await supabase.storage
      .from("resumes")
      .createSignedUrl(resumePath, 3600);
    
    if (error || !data?.signedUrl) {
      toast({
        title: "Error",
        description: "Failed to generate resume download link",
        variant: "destructive",
      });
      return;
    }
    
    window.open(data.signedUrl, "_blank");
    toast({
      title: "Opening resume",
      description: `Opening resume for ${applicantName}`,
    });
  }, [toast]);

  const refreshInterviews = useCallback(async () => {
    if (!user) return;
    const { data } = await supabase
      .from("interviews")
      .select("*")
      .eq("recruiter_id", user.id)
      .order("created_at", { ascending: false });
    if (data) {
      const enriched = data.map((interview) => {
        const app = applications.find(a => a.id === interview.application_id);
        return {
          ...interview,
          job_title: app?.jobs?.title || "Unknown Job",
          institute: app?.jobs?.institute || "",
          candidate_name: app?.profiles?.full_name || "Candidate",
          candidate_email: app?.applicant_email || app?.profiles?.email || "",
          candidate_avatar: app?.profiles?.avatar_url || "",
          candidate_role: app?.profiles?.role || app?.profiles?.headline || "",
        };
      });
      setInterviews(enriched as EnrichedInterview[]);
    }
  }, [user, applications]);

  const markCandidateReviewed = useCallback(() => {
    if (user) {
      localStorage.setItem(`recruiter_reviewed_${user.id}`, "true");
      setHasReviewedCandidate(true);
    }
  }, [user]);

  const completeOnboarding = useCallback(() => {
    if (user) {
      localStorage.setItem(`recruiter_onboarding_${user.id}`, "true");
    }
    setHasCompletedOnboarding(true);
  }, [user]);

  // Refetch applications helper for realtime updates
  const refetchApplications = useCallback(async () => {
    if (!user) return;
    
    const { data: appsData, error: appsError } = await supabase
      .from("job_applications")
      .select(`
        *,
        jobs!inner(title, institute, created_by)
      `)
      .eq("jobs.created_by", user.id)
      .order("created_at", { ascending: false });

    if (appsError) {
      console.error("Error refetching applications:", appsError);
      return;
    }

    const applicationsWithProfiles: Application[] = [];
    if (appsData) {
      for (const app of appsData) {
        const { data: appProfileData } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, university, role, bio, years_experience, location, headline, skills, user_type, resume_url, experience, education, research_papers, achievements, subjects, teaching_philosophy, professional_summary, orcid_id, scopus_link, scopus_metrics, manual_h_index")
          .eq("id", app.applicant_id)
          .maybeSingle();

        const normalizedProfile = appProfileData
          ? {
              ...appProfileData,
              experience:
                Array.isArray((appProfileData as any).experience)
                  ? transformExperienceToDisplay(
                      (appProfileData as any).experience as DBExperience[]
                    )
                  : (appProfileData as any).experience,
            }
          : appProfileData;
        
        applicationsWithProfiles.push({
          ...app,
          profiles: normalizedProfile as any,
        } as unknown as Application);
      }
    }

    setApplications(applicationsWithProfiles);
  }, [user]);

  // Realtime subscription for job_applications
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel('job_applications_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'job_applications',
        },
        (payload) => {
          console.log('Realtime application update:', payload);
          // Refetch to get enriched data with profiles
          refetchApplications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetchApplications]);

  // Initial data fetch
  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      // Fetch recruiter's profile for name and check completeness
      const { data: profileData } = await supabase
        .from("profiles")
        .select("full_name, bio, university, location, headline")
        .eq("id", user.id)
        .maybeSingle();

      if (profileData?.full_name) {
        setRecruiterName(profileData.full_name);
      }
      if (profileData?.location) {
        setRecruiterLocation(profileData.location);
      }
      
      const profileFields = [
        profileData?.full_name,
        profileData?.bio || profileData?.headline,
        profileData?.university,
        profileData?.location,
      ];
      const completedFields = profileFields.filter(Boolean).length;
      setHasCompletedProfile(completedFields >= 3);

      const onboardingKey = `recruiter_onboarding_${user.id}`;
      const completedOnboarding = localStorage.getItem(onboardingKey);
      
      const reviewedKey = `recruiter_reviewed_${user.id}`;
      const hasReviewed = localStorage.getItem(reviewedKey);
      setHasReviewedCandidate(!!hasReviewed);
      
      // Fetch recruiter's jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      setJobs(jobsData || []);
      
      if (!completedOnboarding && (!jobsData || jobsData.length === 0)) {
        setShowOnboarding(true);
      } else {
        setHasCompletedOnboarding(true);
      }

      // Fetch applications
      const { data: appsData, error: appsError } = await supabase
        .from("job_applications")
        .select(`
          *,
          jobs!inner(title, institute, created_by)
        `)
        .eq("jobs.created_by", user.id)
        .order("created_at", { ascending: false });

      if (appsError) {
        console.error("Error fetching applications:", appsError);
      }

      const applicationsWithProfiles: Application[] = [];
      if (appsData) {
        for (const app of appsData) {
          const { data: appProfileData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, university, role, bio, years_experience, location, headline, skills, user_type, resume_url, experience, education, research_papers, achievements, subjects, teaching_philosophy, professional_summary, orcid_id, scopus_link, scopus_metrics, manual_h_index")
            .eq("id", app.applicant_id)
            .maybeSingle();

          const normalizedProfile = appProfileData
            ? {
                ...appProfileData,
                experience:
                  Array.isArray((appProfileData as any).experience)
                    ? transformExperienceToDisplay(
                        (appProfileData as any).experience as DBExperience[]
                      )
                    : (appProfileData as any).experience,
              }
            : appProfileData;
          
          applicationsWithProfiles.push({
            ...app,
            profiles: normalizedProfile as any,
          } as unknown as Application);
        }
      }

      setApplications(applicationsWithProfiles);

      // Fetch all candidate profiles from candidate_directory (has proper RLS for recruiters)
      const { data: candidatesData, error: candidatesError } = await supabase
        .from("candidate_directory")
        .select("*")
        .order("updated_at", { ascending: false });

      console.log("Fetched candidates from candidate_directory:", candidatesData?.length, candidatesError);
      setCandidates((candidatesData as unknown as Profile[]) || []);

      // Fetch saved candidates
      const { data: savedData } = await supabase
        .from("saved_candidates")
        .select("candidate_id, notes")
        .eq("recruiter_id", user.id);

      if (savedData) {
        setSavedCandidateIds(new Set(savedData.map(s => s.candidate_id)));
        const notesMap: Record<string, string> = {};
        savedData.forEach(s => {
          if (s.notes) {
            notesMap[s.candidate_id] = s.notes;
          }
        });
        setSavedCandidateNotes(notesMap);
      }

      // Fetch scheduled interviews
      const { data: interviewsData } = await supabase
        .from("interviews")
        .select("*")
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });

      if (interviewsData) {
        const enrichedInterviews = await Promise.all(
          interviewsData.map(async (interview) => {
            const app = applicationsWithProfiles.find(a => a.id === interview.application_id);
            return {
              ...interview,
              job_title: app?.jobs?.title || "Unknown Job",
              institute: app?.jobs?.institute || "",
              candidate_name: app?.profiles?.full_name || "Candidate",
              candidate_email: app?.applicant_email || app?.profiles?.email || "",
              candidate_avatar: app?.profiles?.avatar_url || "",
              candidate_role: app?.profiles?.role || app?.profiles?.headline || "",
            };
          })
        );
        setInterviews(enrichedInterviews as EnrichedInterview[]);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, navigate]);

  return {
    user,
    loading,
    jobs,
    applications,
    candidates,
    recruiterLocation,
    interviews,
    savedCandidateIds,
    savedCandidateNotes,
    setSavedCandidateNotes,
    activeTab,
    handleTabChange,
    showOnboarding,
    setShowOnboarding,
    recruiterName,
    hasCompletedOnboarding,
    hasCompletedProfile,
    hasReviewedCandidate,
    updateApplicationStatus,
    handleSaveCandidate,
    handleDownloadResume,
    refreshInterviews,
    markCandidateReviewed,
    completeOnboarding,
    setApplications,
    toast,
  };
};
