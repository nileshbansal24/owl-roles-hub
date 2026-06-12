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
  const [savedCandidateStatuses, setSavedCandidateStatuses] = useState<Record<string, string>>({});
  const [savedCandidateFolders, setSavedCandidateFolders] = useState<Record<string, string>>({});
  const [pendingVerificationCount, setPendingVerificationCount] = useState(0);
  
  // Onboarding state
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [recruiterName, setRecruiterName] = useState<string | undefined>(undefined);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [hasCompletedProfile, setHasCompletedProfile] = useState(false);
  const [hasReviewedCandidate, setHasReviewedCandidate] = useState(false);

  // Tab state - derive from URL, use state only as fallback for initial render
  const urlTab = searchParams.get("tab");
  const activeTab = urlTab || "resdex";
  
  const handleTabChange = useCallback((value: string) => {
    if (value === "resdex") {
      setSearchParams({}, { replace: true });
    } else {
      setSearchParams({ tab: value }, { replace: true });
    }
  }, [setSearchParams]);

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
      
      if (newStatus === "shortlisted" && user) {
        const candidateName = app?.profiles?.full_name || "Candidate";
        toast({
          title: "🔔 Credential Verification Pending",
          description: `${candidateName} has been shortlisted. Please verify their credentials in the OR Verification tab.`,
        });
        setPendingVerificationCount(prev => prev + 1);
        
        // Persist notification to database
        await supabase.from("recruiter_notifications").insert({
          recruiter_id: user.id,
          type: "shortlisted",
          title: "Candidate Shortlisted",
          message: `${candidateName} has been shortlisted for ${app?.jobs?.title || "a position"}. Credential verification is pending.`,
          related_candidate_id: app?.applicant_id || null,
          related_candidate_name: candidateName,
        });
      }
      
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
        setSavedCandidateStatuses(prev => {
          const next = { ...prev };
          delete next[candidateId];
          return next;
        });
        setSavedCandidateFolders(prev => {
          const next = { ...prev };
          delete next[candidateId];
          return next;
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
        setSavedCandidateStatuses(prev => ({ ...prev, [candidateId]: "saved" }));
        toast({
          title: "Saved",
          description: "Candidate added to your saved list",
        });
      }
    }
  }, [user, savedCandidateIds, toast]);

  /**
   * Save a candidate into a specific folder (creating an implicit folder by name).
   * If the candidate is already saved, this just updates the folder label.
   */
  const handleSaveCandidateToFolder = useCallback(async (candidateId: string, folder: string) => {
    if (!user) return;
    const trimmed = (folder || "").trim();
    const folderValue = trimmed.length ? trimmed : null;

    const existing = savedCandidateIds.has(candidateId);
    if (existing) {
      const { error } = await supabase
        .from("saved_candidates")
        .update({ folder: folderValue } as any)
        .eq("recruiter_id", user.id)
        .eq("candidate_id", candidateId);
      if (error) {
        toast({ title: "Error", description: "Failed to move to folder", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("saved_candidates")
        .insert({ recruiter_id: user.id, candidate_id: candidateId, folder: folderValue } as any);
      if (error) {
        toast({ title: "Error", description: "Failed to save candidate", variant: "destructive" });
        return;
      }
      setSavedCandidateIds(prev => new Set([...prev, candidateId]));
      setSavedCandidateStatuses(prev => ({ ...prev, [candidateId]: "saved" }));
    }

    setSavedCandidateFolders(prev => {
      const next = { ...prev };
      if (folderValue) next[candidateId] = folderValue;
      else delete next[candidateId];
      return next;
    });

    toast({
      title: folderValue ? `Saved to "${folderValue}"` : "Saved",
      description: folderValue ? "Candidate added to that folder." : "Candidate added to your saved list.",
    });
  }, [user, savedCandidateIds, toast]);

  /**
   * Set / change the recruiter's private status on a candidate.
   * Statuses: 'saved' | 'shortlisted' | 'maybe' | 'rejected'.
   * Upserts the saved_candidates row — also adds the candidate to the
   * saved set if they weren't there yet.
   */
  const handleSetCandidateStatus = useCallback(async (candidateId: string, status: string) => {
    if (!user) return;
    const allowed = ["saved", "shortlisted", "maybe", "rejected"];
    if (!allowed.includes(status)) return;

    const existing = savedCandidateIds.has(candidateId);
    if (existing) {
      const { error } = await supabase
        .from("saved_candidates")
        .update({ status } as any)
        .eq("recruiter_id", user.id)
        .eq("candidate_id", candidateId);
      if (error) {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        return;
      }
    } else {
      const { error } = await supabase
        .from("saved_candidates")
        .insert({ recruiter_id: user.id, candidate_id: candidateId, status } as any);
      if (error) {
        toast({ title: "Error", description: "Failed to update status", variant: "destructive" });
        return;
      }
      setSavedCandidateIds(prev => new Set([...prev, candidateId]));
    }

    setSavedCandidateStatuses(prev => ({ ...prev, [candidateId]: status }));
    const labels: Record<string, string> = {
      saved: "Saved",
      shortlisted: "Shortlisted",
      maybe: "Marked as Maybe",
      rejected: "Rejected",
    };
    toast({ title: labels[status], description: "Candidate status updated" });
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

  const completeOnboarding = useCallback(async () => {
    if (user) {
      // Save to database
      await supabase
        .from("profiles")
        .update({ recruiter_onboarding_completed: true })
        .eq("id", user.id);
      setHasCompletedOnboarding(true);
    }
  }, [user]);

  // Refetch applications helper for realtime updates
  const refetchApplications = useCallback(async () => {
    if (!user) return;
    
    const { data: appsData, error: appsError } = await supabase
      .from("job_applications")
      .select(`
        *,
        jobs(title, institute, created_by)
      `)
      .order("created_at", { ascending: false });


    if (appsError) {
      console.error("Error refetching applications:", appsError);
      return;
    }

    const applicantIds = Array.from(
      new Set((appsData ?? []).map((a: any) => a.applicant_id).filter(Boolean)),
    );

    let profileMap = new Map<string, any>();
    if (applicantIds.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, university, role, bio, years_experience, location, headline, skills, user_type, resume_url, experience, education, research_papers, achievements, subjects, teaching_philosophy, professional_summary, orcid_id, scopus_link, scopus_metrics, manual_h_index")
        .in("id", applicantIds);
      profileMap = new Map(
        (profs ?? []).map((p: any) => [
          p.id,
          {
            ...p,
            experience: Array.isArray(p.experience)
              ? transformExperienceToDisplay(p.experience as DBExperience[])
              : p.experience,
          },
        ]),
      );
    }

    const applicationsWithProfiles: Application[] = (appsData ?? []).map(
      (app: any) =>
        ({
          ...app,
          profiles: profileMap.get(app.applicant_id) ?? null,
        }) as unknown as Application,
    );

    setApplications(applicationsWithProfiles);

  }, [user?.id]);

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
  }, [user?.id, refetchApplications]);

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
        .select("full_name, bio, university, location, headline, recruiter_onboarding_completed")
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
      const completedOnboarding = localStorage.getItem(onboardingKey) === "true" || (profileData as any)?.recruiter_onboarding_completed;
      
      const reviewedKey = `recruiter_reviewed_${user.id}`;
      const hasReviewed = localStorage.getItem(reviewedKey);
      setHasReviewedCandidate(!!hasReviewed);
      
      // Fetch recruiter's jobs (owned + collaborated)
      const { data: collabRows } = await supabase
        .from("job_collaborators")
        .select("job_id")
        .eq("recruiter_id", user.id);
      const collabJobIds = (collabRows ?? []).map((r: any) => r.job_id as string);

      let jobsQuery = supabase
        .from("jobs")
        .select("*, job_collaborators(recruiter_id, added_by)")
        .order("created_at", { ascending: false });

      if (collabJobIds.length > 0) {
        jobsQuery = jobsQuery.or(
          `created_by.eq.${user.id},id.in.(${collabJobIds.join(",")})`,
        );
      } else {
        jobsQuery = jobsQuery.eq("created_by", user.id);
      }

      const { data: jobsData } = await jobsQuery;

      // Enrich with owner names for shared (non-owned) jobs
      const ownerIdsNeeded = Array.from(
        new Set(
          (jobsData ?? [])
            .filter((j: any) => j.created_by !== user.id)
            .map((j: any) => j.created_by as string),
        ),
      );
      let ownerNameMap = new Map<string, string>();
      if (ownerIdsNeeded.length) {
        const { data: ownerProfiles } = await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", ownerIdsNeeded);
        ownerNameMap = new Map(
          (ownerProfiles ?? []).map((p: any) => [p.id, p.full_name ?? ""]),
        );
      }

      const enrichedJobs = (jobsData ?? []).map((j: any) => ({
        ...j,
        is_owner: j.created_by === user.id,
        owner_name: j.created_by === user.id ? null : ownerNameMap.get(j.created_by) ?? null,
        collaborators: j.job_collaborators ?? [],
      }));

      setJobs(enrichedJobs as any);

      if (!completedOnboarding && enrichedJobs.length === 0) {
        setShowOnboarding(true);
      } else {
        setHasCompletedOnboarding(true);
      }

      // Fetch applications (RLS automatically includes collaborated jobs)
      const accessibleJobIds = enrichedJobs.map((j: any) => j.id);
      const { data: appsData, error: appsError } = accessibleJobIds.length
        ? await supabase
            .from("job_applications")
            .select(`*, jobs(title, institute, created_by)`)
            .in("job_id", accessibleJobIds)
            .order("created_at", { ascending: false })
        : { data: [], error: null };


      if (appsError) {
        console.error("Error fetching applications:", appsError);
      }

      const applicantIds = Array.from(
        new Set((appsData ?? []).map((a: any) => a.applicant_id).filter(Boolean)),
      );

      let profileMap = new Map<string, any>();
      if (applicantIds.length) {
        const { data: profs } = await supabase
          .from("profiles")
          .select("id, full_name, avatar_url, university, role, bio, years_experience, location, headline, skills, user_type, resume_url, experience, education, research_papers, achievements, subjects, teaching_philosophy, professional_summary, orcid_id, scopus_link, scopus_metrics, manual_h_index")
          .in("id", applicantIds);
        profileMap = new Map(
          (profs ?? []).map((p: any) => [
            p.id,
            {
              ...p,
              experience: Array.isArray(p.experience)
                ? transformExperienceToDisplay(p.experience as DBExperience[])
                : p.experience,
            },
          ]),
        );
      }

      const applicationsWithProfiles: Application[] = (appsData ?? []).map(
        (app: any) =>
          ({
            ...app,
            profiles: profileMap.get(app.applicant_id) ?? null,
          }) as unknown as Application,
      );

      setApplications(applicationsWithProfiles);


      // Dashboard is now interactive — heavy data (candidates, interviews, verifications)
      // continues loading in the background and renders progressively.
      setLoading(false);

      // Fetch admin user ids so we can exclude them from the Talent Pool
      const { data: adminIdsData } = await supabase.rpc("get_admin_user_ids");
      const adminIds: string[] = ((adminIdsData ?? []) as any[])
        .map((r: any) => (typeof r === "string" ? r : r?.get_admin_user_ids ?? r?.user_id))
        .filter(Boolean);

      // Fetch all candidate profiles with full data for ratings (admins excluded)
      let candidatesQuery = supabase
        .from("profiles")
        .select("id, full_name, avatar_url, university, role, bio, years_experience, location, headline, skills, user_type, resume_url, email, experience, education, research_papers, achievements, subjects, teaching_philosophy, professional_summary, orcid_id, scopus_link, scopus_metrics, manual_h_index, current_salary, expected_salary, updated_at")
        .eq("user_type", "candidate")
        .order("updated_at", { ascending: false });

      if (adminIds.length > 0) {
        candidatesQuery = candidatesQuery.not("id", "in", `(${adminIds.join(",")})`);
      }

      const { data: candidatesData, error: candidatesError } = await candidatesQuery;

      console.log("Fetched candidates from profiles:", candidatesData?.length, candidatesError);
      setCandidates((candidatesData as unknown as Profile[]) || []);

      // Fetch saved candidates
      const { data: savedData } = await supabase
        .from("saved_candidates")
        .select("candidate_id, notes, status, folder")
        .eq("recruiter_id", user.id);

      if (savedData) {
        setSavedCandidateIds(new Set(savedData.map((s: any) => s.candidate_id)));
        const notesMap: Record<string, string> = {};
        const statusMap: Record<string, string> = {};
        const folderMap: Record<string, string> = {};
        savedData.forEach((s: any) => {
          if (s.notes) notesMap[s.candidate_id] = s.notes;
          statusMap[s.candidate_id] = s.status || "saved";
          if (s.folder) folderMap[s.candidate_id] = s.folder;
        });
        setSavedCandidateNotes(notesMap);
        setSavedCandidateStatuses(statusMap);
        setSavedCandidateFolders(folderMap);
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

      // Calculate pending verification count
      const shortlistedIds = applicationsWithProfiles
        .filter(a => a.status === "shortlisted")
        .map(a => a.applicant_id);
      
      if (shortlistedIds.length > 0) {
        const uniqueIds = [...new Set(shortlistedIds)];
        const { data: verifiedData } = await supabase
          .from("credential_verifications")
          .select("candidate_id, status")
          .eq("recruiter_id", user.id)
          .in("candidate_id", uniqueIds)
          .eq("status", "verified");
        
        const verifiedCandidateIds = new Set((verifiedData || []).map(v => v.candidate_id));
        const pendingCount = uniqueIds.filter(id => !verifiedCandidateIds.has(id)).length;
        setPendingVerificationCount(pendingCount);
      } else {
        setPendingVerificationCount(0);
      }

    };


    fetchData();
    // Only refetch when the user identity changes, not on every auth object reference change.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

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
    savedCandidateStatuses,
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
    handleSetCandidateStatus,
    handleDownloadResume,
    refreshInterviews,
    markCandidateReviewed,
    completeOnboarding,
    setApplications,
    toast,
    pendingVerificationCount,
  };
};
