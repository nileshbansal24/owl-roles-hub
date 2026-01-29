import { motion } from "framer-motion";
import { CalendarDays, Video } from "lucide-react";
import InterviewCard from "@/components/InterviewCard";
import { containerVariants, itemVariants } from "@/types/recruiter";
import type { EnrichedInterview } from "@/types/recruiter";

interface InterviewsTabProps {
  interviews: EnrichedInterview[];
  sendingReminderId: string | null;
  onViewDetails: (interview: EnrichedInterview) => void;
  onSendReminder: (interview: EnrichedInterview) => void;
}

const InterviewsTab = ({
  interviews,
  sendingReminderId,
  onViewDetails,
  onSendReminder,
}: InterviewsTabProps) => {
  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="card-elevated p-6">
        <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          Scheduled Interviews ({interviews.length})
        </h3>
        {interviews.length === 0 ? (
          <div className="text-center py-8">
            <Video className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No interviews scheduled yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Schedule interviews from the Applications tab.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {interviews.map((interview) => (
              <InterviewCard
                key={interview.id}
                interview={interview}
                variant="recruiter"
                onViewDetails={() => onViewDetails(interview)}
                onSendReminder={() => onSendReminder(interview)}
                sendingReminder={sendingReminderId === interview.id}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default InterviewsTab;
