import { motion } from "framer-motion";
import { CalendarDays, Video, Calendar, Clock } from "lucide-react";
import InterviewCard from "@/components/InterviewCard";
import { EmptyState } from "@/components/ui/empty-state";
import { CardGridSkeleton } from "@/components/ui/loading-skeleton";
import { staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import type { EnrichedInterview } from "@/types/recruiter";

interface InterviewsTabProps {
  interviews: EnrichedInterview[];
  sendingReminderId: string | null;
  onViewDetails: (interview: EnrichedInterview) => void;
  onSendReminder: (interview: EnrichedInterview) => void;
  isLoading?: boolean;
}

const InterviewsTab = ({
  interviews,
  sendingReminderId,
  onViewDetails,
  onSendReminder,
  isLoading = false,
}: InterviewsTabProps) => {
  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardGridSkeleton count={4} />
      </div>
    );
  }

  // Separate upcoming and past interviews
  const now = new Date();
  const upcomingInterviews = interviews.filter(i => 
    i.confirmed_time && new Date(i.confirmed_time) >= now
  );
  const pendingInterviews = interviews.filter(i => !i.confirmed_time && i.status !== 'completed');

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Upcoming Interviews */}
      <motion.div variants={staggerItemVariants} className="card-elevated p-6">
        <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Upcoming Interviews
          {upcomingInterviews.length > 0 && (
            <span className="ml-2 bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full">
              {upcomingInterviews.length}
            </span>
          )}
        </h3>
        {upcomingInterviews.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title="No upcoming interviews"
            description="You don't have any confirmed interviews scheduled. Once candidates confirm their interview times, they'll appear here."
            className="py-8"
          >
            <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
              <Clock className="h-4 w-4" />
              <span>Schedule interviews from the Applications tab</span>
            </div>
          </EmptyState>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {upcomingInterviews.map((interview) => (
              <motion.div
                key={interview.id}
                whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.1)" }}
                transition={{ duration: 0.2 }}
              >
                <InterviewCard
                  interview={interview}
                  variant="recruiter"
                  onViewDetails={() => onViewDetails(interview)}
                  onSendReminder={() => onSendReminder(interview)}
                  sendingReminder={sendingReminderId === interview.id}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {/* Pending Confirmation */}
      {pendingInterviews.length > 0 && (
        <motion.div variants={staggerItemVariants} className="card-elevated p-6 border-amber-200 dark:border-amber-900/50">
          <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
            <Clock className="h-5 w-5 text-amber-500" />
            Pending Confirmation
            <span className="ml-2 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 text-sm px-2 py-0.5 rounded-full">
              {pendingInterviews.length}
            </span>
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            These interviews are waiting for candidates to select a time slot.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {pendingInterviews.map((interview) => (
              <motion.div
                key={interview.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <InterviewCard
                  interview={interview}
                  variant="recruiter"
                  onViewDetails={() => onViewDetails(interview)}
                  onSendReminder={() => onSendReminder(interview)}
                  sendingReminder={sendingReminderId === interview.id}
                />
              </motion.div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Total empty state */}
      {interviews.length === 0 && (
        <EmptyState
          icon={Video}
          title="No interviews scheduled"
          description="You haven't scheduled any interviews yet. Start by reviewing applications and scheduling interviews with promising candidates."
        />
      )}
    </motion.div>
  );
};

export default InterviewsTab;
