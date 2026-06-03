import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Briefcase, FileText, Calendar } from "lucide-react";
import MyJobsTab from "./MyJobsTab";
import ApplicationsTab from "./ApplicationsTab";
import InterviewsTab from "./InterviewsTab";
import type {
  Job,
  Application,
  EnrichedInterview,
} from "@/types/recruiter";

interface ManageJobsTabProps {
  view: string;
  onViewChange: (view: string) => void;
  jobs: Job[];
  applications: Application[];
  interviews: EnrichedInterview[];
  isLoading: boolean;
  sendingReminderId: string | null;
  onViewApplicant: (app: Application) => void;
  onUpdateStatus: (appId: string, status: string) => void;
  onScheduleInterview: (app: Application) => void;
  onDownloadResume: (url: string, name: string) => void;
  onOpenComparison: (ids: Set<string>) => void;
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
  onViewJobApplications: (jobId: string) => void;
  onViewInterviewDetails: (interview: EnrichedInterview) => void;
  onSendInterviewReminder: (interview: EnrichedInterview) => void;
}

const ManageJobsTab = ({
  view,
  onViewChange,
  jobs,
  applications,
  interviews,
  isLoading,
  sendingReminderId,
  onViewApplicant,
  onUpdateStatus,
  onScheduleInterview,
  onDownloadResume,
  onOpenComparison,
  setApplications,
  onViewJobApplications,
  onViewInterviewDetails,
  onSendInterviewReminder,
}: ManageJobsTabProps) => {
  const pendingCount = applications.filter((a) => a.status === "pending").length;
  const upcomingInterviews = interviews.filter(
    (i) => i.confirmed_time && new Date(i.confirmed_time) >= new Date(),
  ).length;

  const subTabs = [
    { value: "jobs", label: "My Jobs", icon: Briefcase, count: jobs.length },
    {
      value: "applications",
      label: "Applications",
      icon: FileText,
      count: applications.length,
      badge: pendingCount,
    },
    {
      value: "interviews",
      label: "Interviews",
      icon: Calendar,
      count: interviews.length,
      badge: upcomingInterviews,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h1 className="font-heading font-bold text-2xl text-foreground tracking-tight">
            Manage Jobs
          </h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Postings, applications, and interviews — all in one place.
          </p>
        </div>
      </div>

      <Tabs value={view} onValueChange={onViewChange} className="space-y-4">
        <TabsList className="h-auto p-1 bg-muted/60 rounded-xl flex flex-wrap gap-1 w-full sm:w-auto">
          {subTabs.map((t) => (
            <TabsTrigger
              key={t.value}
              value={t.value}
              className="data-[state=active]:bg-background data-[state=active]:shadow-sm rounded-lg px-3 sm:px-4 h-9 gap-2 text-[13px] font-medium"
            >
              <t.icon className="h-3.5 w-3.5" />
              <span>{t.label}</span>
              <span className="text-[11px] font-semibold text-muted-foreground tabular-nums">
                {t.count}
              </span>
              {t.badge && t.badge > 0 ? (
                <span className="inline-flex items-center justify-center h-4 min-w-4 px-1 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
                  {t.badge}
                </span>
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="jobs" className="mt-0">
          <MyJobsTab
            jobs={jobs}
            applications={applications}
            onViewJobApplications={onViewJobApplications}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="applications" className="mt-0">
          <ApplicationsTab
            jobs={jobs}
            applications={applications}
            onViewApplicant={onViewApplicant}
            onUpdateStatus={onUpdateStatus}
            onScheduleInterview={onScheduleInterview}
            onDownloadResume={onDownloadResume}
            onOpenComparison={onOpenComparison}
            setApplications={setApplications}
          />
        </TabsContent>

        <TabsContent value="interviews" className="mt-0">
          <InterviewsTab
            interviews={interviews}
            sendingReminderId={sendingReminderId}
            onViewDetails={onViewInterviewDetails}
            onSendReminder={onSendInterviewReminder}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ManageJobsTab;
