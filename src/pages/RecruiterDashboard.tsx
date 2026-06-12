import { useState, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";
import { format } from "date-fns";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { transformExperienceToDisplay, type DBExperience } from "@/lib/profileUtils";

// Layout and existing components
import RecruiterLayout from "@/components/recruiter/RecruiterLayout";
import RecruiterOnboarding from "@/components/recruiter/RecruiterOnboarding";
import CandidateMessageModal from "@/components/recruiter/CandidateMessageModal";
import MessageHistoryTab from "@/components/recruiter/MessageHistoryTab";
import ApplicantDetailModal from "@/components/ApplicantDetailModal";
import CandidateComparisonModal from "@/components/CandidateComparisonModal";
import InterviewScheduleModal from "@/components/InterviewScheduleModal";
import InterviewDetailsModal from "@/components/InterviewDetailsModal";
import RecruiterChatbot from "@/components/recruiter/RecruiterChatbot";

// Dashboard components
import {
  FindCandidatesTab,
  SavedCandidatesTab,
  EventsTab,
  BlockchainCredentialsTab,
  ManageJobsTab,
  AnalyticsTab,
  WelcomeHeader,
} from "@/components/recruiter/dashboard";

// Hooks and types
import { useRecruiterDashboard } from "@/hooks/useRecruiterDashboard";
import type { Profile, Application, EnrichedInterview, MessageRecipient } from "@/types/recruiter";

const RecruiterDashboard = () => {
  const {
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
    updateApplicationStatus,
    handleSaveCandidate,
    handleSaveCandidateToFolder,
    savedCandidateFolders,
    handleSetCandidateStatus,
    handleDownloadResume,
    refreshInterviews,
    markCandidateReviewed,
    completeOnboarding,
    setApplications,
    toast,
    pendingVerificationCount,
  } = useRecruiterDashboard();

  // Modal states
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Profile | null>(null);
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [showScheduleModal, setShowScheduleModal] = useState(false);
  const [schedulingApplication, setSchedulingApplication] = useState<Application | null>(null);
  const [selectedInterview, setSelectedInterview] = useState<EnrichedInterview | null>(null);
  const [showInterviewDetailsModal, setShowInterviewDetailsModal] = useState(false);
  const [sendingReminderId, setSendingReminderId] = useState<string | null>(null);
  const [showComparisonModal, setShowComparisonModal] = useState(false);
  const [comparisonAppIds, setComparisonAppIds] = useState<Set<string>>(new Set());
  const [showMessageModal, setShowMessageModal] = useState(false);
  const [messageRecipient, setMessageRecipient] = useState<MessageRecipient | null>(null);

  // Handle viewing a candidate from Search tab
  const handleViewCandidate = useCallback(async (candidate: Profile) => {
    markCandidateReviewed();
    
    // Try fetching full profile - may fail due to RLS if candidate hasn't applied to recruiter's jobs
    const { data: fullProfile, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, university, role, bio, years_experience, location, headline, skills, user_type, resume_url, email, experience, education, research_papers, achievements, subjects, teaching_philosophy, professional_summary, orcid_id, scopus_link, scopus_metrics, manual_h_index")
      .eq("id", candidate.id)
      .maybeSingle();
    
    if (error || !fullProfile) {
      // Fallback: use candidate_directory data (limited fields but still useful)
      if (error) console.error("Error fetching full profile:", error);
      setSelectedCandidate(candidate);
    } else {
      const normalizedProfile = {
        ...fullProfile,
        experience:
          Array.isArray((fullProfile as any).experience)
            ? transformExperienceToDisplay((fullProfile as any).experience as DBExperience[])
            : (fullProfile as any).experience,
      };
      setSelectedCandidate(normalizedProfile as unknown as Profile);
    }
    setShowCandidateModal(true);
  }, [markCandidateReviewed]);

  // Handle sending a message to a candidate
  const handleSendMessage = useCallback((candidate: Profile, jobId?: string, jobTitle?: string, instituteName?: string) => {
    setMessageRecipient({
      id: candidate.id,
      name: candidate.full_name || "Candidate",
      email: candidate.email || "",
      jobId,
      jobTitle,
      instituteName,
    });
    setShowMessageModal(true);
  }, []);

  // Handle scheduling interview
  const handleScheduleInterview = useCallback((application: Application) => {
    setSchedulingApplication(application);
    setShowScheduleModal(true);
  }, []);

  // Handle viewing applicant
  const handleViewApplicant = useCallback((app: Application) => {
    setSelectedApplication(app);
    setShowApplicantModal(true);
  }, []);

  // Handle modal status update
  const handleModalStatusUpdate = useCallback((appId: string, status: string) => {
    updateApplicationStatus(appId, status);
    setShowApplicantModal(false);
  }, [updateApplicationStatus]);

  // Handle interview scheduled
  const handleInterviewScheduled = useCallback(async () => {
    await refreshInterviews();
    setShowScheduleModal(false);
  }, [refreshInterviews]);

  // Send interview reminder email
  const handleSendInterviewReminder = useCallback(async (interview: EnrichedInterview) => {
    try {
      setSendingReminderId(interview.id);
      
      const app = applications.find(a => a.id === interview.application_id);
      if (!app?.applicant_email) {
        toast({
          title: "Email not available",
          description: "Cannot send reminder - candidate email not found.",
          variant: "destructive",
        });
        return;
      }

      const confirmedTime = interview.confirmed_time 
        ? format(new Date(interview.confirmed_time), "EEEE, MMMM d, yyyy 'at' h:mm a")
        : "Please check your dashboard";

      const { error } = await supabase.functions.invoke("send-status-notification", {
        body: {
          newStatus: "interview_reminder",
          jobTitle: interview.job_title || app?.jobs?.title || "Position",
          instituteName: interview.institute || app?.jobs?.institute || "Company",
          interviewId: interview.id,
          confirmedTime,
          interviewType: interview.interview_type,
          meetingLink: interview.meeting_link,
          location: interview.location,
          notes: interview.notes,
        },
      });

      if (error) {
        throw error;
      }

      toast({
        title: "Reminder sent!",
        description: `Interview reminder email sent to ${app.profiles?.full_name || "candidate"}.`,
      });
    } catch (err) {
      console.error("Failed to send reminder:", err);
      toast({
        title: "Failed to send reminder",
        description: "There was an error sending the email. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSendingReminderId(null);
    }
  }, [applications, toast]);

  // Handle save note
  const handleSaveNote = useCallback(async (candidateId: string, note: string) => {
    if (!user) return;
    
    const { error } = await supabase
      .from("saved_candidates")
      .update({ notes: note.trim() || null })
      .eq("recruiter_id", user.id)
      .eq("candidate_id", candidateId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } else {
      setSavedCandidateNotes(prev => ({
        ...prev,
        [candidateId]: note.trim(),
      }));
      toast({
        title: "Note saved",
        description: "Your private note has been saved",
      });
    }
  }, [user, toast, setSavedCandidateNotes]);

  // Handle open comparison
  const handleOpenComparison = useCallback((appIds: Set<string>) => {
    setComparisonAppIds(appIds);
    setShowComparisonModal(true);
  }, []);

  // Handle view job applications
  const handleViewJobApplications = useCallback((jobId: string) => {
    handleTabChange("manage");
    const sp = new URLSearchParams(window.location.search);
    sp.set("tab", "manage");
    sp.set("view", "applications");
    window.history.replaceState({}, "", `${window.location.pathname}?${sp.toString()}`);
  }, [handleTabChange]);

  // ---------- Manage Jobs unified view ----------
  const [searchParams, setSearchParams] = useSearchParams();
  // Treat legacy tab values as the unified "manage" tab and remember sub-view
  const unifiedTab = useMemo(() => {
    if (["jobs", "applications", "interviews", "manage"].includes(activeTab)) return "manage";
    return activeTab;
  }, [activeTab]);

  const manageView = useMemo(() => {
    const explicit = searchParams.get("view");
    if (explicit && ["jobs", "applications", "interviews"].includes(explicit)) return explicit;
    if (["jobs", "applications", "interviews"].includes(activeTab)) return activeTab;
    return "jobs";
  }, [searchParams, activeTab]);

  const handleManageViewChange = useCallback((view: string) => {
    const sp = new URLSearchParams(searchParams);
    sp.set("tab", "manage");
    sp.set("view", view);
    setSearchParams(sp, { replace: true });
  }, [searchParams, setSearchParams]);


  if (loading) {
    return (
      <RecruiterLayout hasJobs={false} title="Loading...">
        <div className="flex items-center justify-center h-full">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
        </div>
      </RecruiterLayout>
    );
  }

  return (
    <RecruiterLayout hasJobs={jobs.length > 0} title="Dashboard" pendingVerificationCount={pendingVerificationCount}>
      <div className="p-4 sm:p-6 lg:p-8 space-y-5 max-w-[1600px] mx-auto">
        {/* Welcome */}
        <WelcomeHeader name={recruiterName} />

        {/* Tabs - TabsList is hidden since navigation is handled by sidebar */}
        <Tabs value={unifiedTab} onValueChange={handleTabChange} className="space-y-4">
          <TabsList className="sr-only">
            <TabsTrigger value="resdex">Find Candidates</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
            <TabsTrigger value="events">Events</TabsTrigger>
            <TabsTrigger value="manage">Manage Jobs</TabsTrigger>
            <TabsTrigger value="analytics">Analytics</TabsTrigger>
            <TabsTrigger value="messages">Messages</TabsTrigger>
            <TabsTrigger value="blockchain">Blockchain</TabsTrigger>
          </TabsList>

          {/* Analytics Tab */}
          <TabsContent value="analytics">
            <AnalyticsTab
              jobs={jobs}
              applications={applications}
              candidates={candidates}
              interviews={interviews}
              savedCount={savedCandidateIds.size}
            />
          </TabsContent>

          {/* Find Candidates Tab */}
          <TabsContent value="resdex">
            <FindCandidatesTab
              candidates={candidates}
              savedCandidateIds={savedCandidateIds}
              savedCandidateNotes={savedCandidateNotes}
              savedCandidateStatuses={savedCandidateStatuses}
              savedCandidateFolders={savedCandidateFolders}
              onViewCandidate={handleViewCandidate}
              onSaveCandidate={handleSaveCandidate}
              onSaveCandidateToFolder={handleSaveCandidateToFolder}
              onMessageCandidate={(candidate) => handleSendMessage(candidate)}
              onSaveNote={handleSaveNote}
              onSetStatus={handleSetCandidateStatus}
              isLoading={loading}
              recruiterLocation={recruiterLocation}
            />
          </TabsContent>

          {/* Saved Candidates Tab */}
          <TabsContent value="saved">
            <SavedCandidatesTab
              candidates={candidates}
              savedCandidateIds={savedCandidateIds}
              savedCandidateNotes={savedCandidateNotes}
              savedCandidateStatuses={savedCandidateStatuses}
              savedCandidateFolders={savedCandidateFolders}
              onViewCandidate={handleViewCandidate}
              onSaveCandidate={handleSaveCandidate}
              onSaveCandidateToFolder={handleSaveCandidateToFolder}
              onMessageCandidate={(candidate) => handleSendMessage(candidate)}
              onSaveNote={handleSaveNote}
              onSetStatus={handleSetCandidateStatus}
              isLoading={loading}
            />
          </TabsContent>

          {/* Events Tab */}
          <TabsContent value="events">
            <EventsTab jobs={jobs} />
          </TabsContent>

          {/* Manage Jobs (unified: My Jobs + Applications + Interviews) */}
          <TabsContent value="manage">
            <ManageJobsTab
              view={manageView}
              onViewChange={handleManageViewChange}
              jobs={jobs}
              applications={applications}
              interviews={interviews}
              isLoading={loading}
              sendingReminderId={sendingReminderId}
              onViewApplicant={handleViewApplicant}
              onUpdateStatus={updateApplicationStatus}
              onScheduleInterview={handleScheduleInterview}
              onDownloadResume={handleDownloadResume}
              onOpenComparison={handleOpenComparison}
              setApplications={setApplications}
              onViewJobApplications={handleViewJobApplications}
              onViewInterviewDetails={(interview) => {
                setSelectedInterview(interview);
                setShowInterviewDetailsModal(true);
              }}
              onSendInterviewReminder={handleSendInterviewReminder}
            />
          </TabsContent>

          {/* Messages Tab */}
          <TabsContent value="messages">
            <MessageHistoryTab />
          </TabsContent>

          {/* Blockchain Credentials Tab */}
          <TabsContent value="blockchain">
            <BlockchainCredentialsTab
              candidates={candidates}
              isLoading={loading}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* Applicant Detail Modal */}
      <ApplicantDetailModal
        application={selectedApplication}
        open={showApplicantModal}
        onOpenChange={setShowApplicantModal}
        onStatusUpdate={handleModalStatusUpdate}
        onScheduleInterview={handleScheduleInterview}
      />

      {/* Interview Schedule Modal */}
      <InterviewScheduleModal
        application={schedulingApplication}
        open={showScheduleModal}
        onOpenChange={setShowScheduleModal}
        onScheduled={handleInterviewScheduled}
      />

      {/* Candidate Detail Modal (for Search tab) */}
      <ApplicantDetailModal
        application={selectedCandidate ? {
          id: `search-${selectedCandidate.id}`,
          job_id: "",
          applicant_id: selectedCandidate.id,
          cover_letter: null,
          status: "viewing",
          created_at: new Date().toISOString(),
          jobs: {
            title: "Profile View",
            institute: "Search Results",
          },
          profiles: selectedCandidate,
        } as Application : null}
        open={showCandidateModal}
        onOpenChange={setShowCandidateModal}
        onStatusUpdate={() => {}}
      />

      {/* Interview Details Modal */}
      <InterviewDetailsModal
        interview={selectedInterview}
        open={showInterviewDetailsModal}
        onClose={() => {
          setShowInterviewDetailsModal(false);
          setSelectedInterview(null);
        }}
      />

      {/* Candidate Comparison Modal */}
      <CandidateComparisonModal
        applications={applications.filter(app => comparisonAppIds.has(app.id))}
        open={showComparisonModal}
        onOpenChange={setShowComparisonModal}
        onRemoveCandidate={(appId) => {
          const newSelected = new Set(comparisonAppIds);
          newSelected.delete(appId);
          setComparisonAppIds(newSelected);
          if (newSelected.size < 2) {
            setShowComparisonModal(false);
          }
        }}
      />

      {/* Recruiter Onboarding Modal */}
      <RecruiterOnboarding
        open={showOnboarding}
        onOpenChange={setShowOnboarding}
        recruiterName={recruiterName}
        onComplete={completeOnboarding}
        onDismiss={completeOnboarding}
      />

      {/* Candidate Message Modal */}
      {messageRecipient && user && (
        <CandidateMessageModal
          open={showMessageModal}
          onOpenChange={setShowMessageModal}
          candidateName={messageRecipient.name}
          candidateEmail={messageRecipient.email}
          candidateId={messageRecipient.id}
          recruiterId={user.id}
          jobId={messageRecipient.jobId}
          jobTitle={messageRecipient.jobTitle}
          instituteName={messageRecipient.instituteName}
        />
      )}

      {/* AI Chatbot */}
      <RecruiterChatbot
        onViewCandidate={handleViewCandidate}
        onMessageCandidate={(candidate) => handleSendMessage(candidate)}
      />
    </RecruiterLayout>
  );
};

export default RecruiterDashboard;
