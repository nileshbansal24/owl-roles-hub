import { motion, AnimatePresence } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Video,
  Phone,
  MapPin,
  Clock,
  CalendarCheck,
  ExternalLink,
  Building2,
  Sparkles,
} from "lucide-react";
import { format, parseISO, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

interface ProposedTime {
  datetime: string;
  formatted: string;
}

interface Interview {
  id: string;
  application_id: string;
  job_id: string;
  recruiter_id?: string;
  proposed_times: ProposedTime[];
  confirmed_time: string | null;
  status: string;
  interview_type: string;
  meeting_link: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  job_title?: string;
  institute?: string;
  candidate_name?: string;
}

interface InterviewCardProps {
  interview: Interview;
  variant?: "candidate" | "recruiter";
  onRespond?: () => void;
  onViewDetails?: () => void;
  index?: number;
}

const InterviewCard = ({
  interview,
  variant = "candidate",
  onRespond,
  onViewDetails,
  index = 0,
}: InterviewCardProps) => {
  const proposedTimes = interview.proposed_times as ProposedTime[];

  const getTypeIcon = () => {
    switch (interview.interview_type) {
      case "video":
        return <Video className="h-4 w-4" />;
      case "phone":
        return <Phone className="h-4 w-4" />;
      case "in_person":
        return <MapPin className="h-4 w-4" />;
      default:
        return <Video className="h-4 w-4" />;
    }
  };

  const getStatusBadge = () => {
    const statusStyles = {
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      confirmed: "bg-green-500/10 text-green-600 border-green-500/30",
      declined: "bg-red-500/10 text-red-600 border-red-500/30",
      cancelled: "bg-muted text-muted-foreground border-muted",
      completed: "bg-primary/10 text-primary border-primary/30",
    };

    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
      >
        <Badge
          variant="outline"
          className={cn(
            "transition-all duration-200",
            statusStyles[interview.status as keyof typeof statusStyles] ||
              statusStyles.pending
          )}
        >
          {interview.status === "pending" && (
            <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
          )}
          {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
        </Badge>
      </motion.div>
    );
  };

  const getTypeLabel = () => {
    switch (interview.interview_type) {
      case "video":
        return "Video Call";
      case "phone":
        return "Phone Call";
      case "in_person":
        return "In-Person";
      default:
        return "Interview";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.1, duration: 0.4 }}
      whileHover={{ y: -4 }}
      className="group"
    >
      <Card className="overflow-hidden border-border/50 bg-card/80 backdrop-blur-sm hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300">
        <CardContent className="p-4 sm:p-5">
          <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
            <div className="flex-1 min-w-0 w-full">
              {/* Header */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <motion.div 
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="p-2 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 text-primary shadow-sm"
                >
                  {getTypeIcon()}
                </motion.div>
                <span className="text-sm font-medium text-foreground">
                  {getTypeLabel()}
                </span>
                {getStatusBadge()}
              </div>

              {/* Job/Candidate Info */}
              <motion.div 
                className="mb-3"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                {variant === "candidate" ? (
                  <>
                    <p className="font-heading font-semibold text-foreground truncate text-base sm:text-lg">
                      {interview.job_title || "Interview"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                      <Building2 className="h-3.5 w-3.5" />
                      {interview.institute}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-heading font-semibold text-foreground truncate text-base sm:text-lg">
                      {interview.candidate_name || "Candidate"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {interview.job_title} at {interview.institute}
                    </p>
                  </>
                )}
              </motion.div>

              {/* Time Info */}
              <motion.div 
                className="space-y-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
              >
                {interview.confirmed_time ? (
                  <div className="flex items-center gap-2 text-sm p-2 rounded-lg bg-green-500/5 border border-green-500/20">
                    <CalendarCheck className="h-4 w-4 text-green-600 flex-shrink-0" />
                    <span className="text-foreground font-medium">
                      {format(
                        parseISO(interview.confirmed_time),
                        "EEE, MMM d 'at' h:mm a"
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground p-2 rounded-lg bg-muted/30">
                    <Clock className="h-4 w-4 animate-pulse" />
                    <span>
                      {proposedTimes.length} time slot
                      {proposedTimes.length !== 1 ? "s" : ""} proposed
                    </span>
                  </div>
                )}

                {interview.meeting_link && interview.status === "confirmed" && (
                  <motion.a
                    href={interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-primary hover:text-primary/80 font-medium transition-colors"
                    whileHover={{ x: 3 }}
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Join Meeting
                  </motion.a>
                )}

                {interview.location && interview.status === "confirmed" && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5" />
                    {interview.location}
                  </p>
                )}
              </motion.div>
            </div>

            {/* Actions */}
            <motion.div 
              className="flex flex-row sm:flex-col gap-2 w-full sm:w-auto"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.3 }}
            >
              {interview.status === "pending" && variant === "candidate" && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 sm:flex-none"
                >
                  <Button 
                    size="sm" 
                    onClick={onRespond}
                    className="w-full sm:w-auto gap-1.5 shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Sparkles className="h-3.5 w-3.5" />
                    Respond
                  </Button>
                </motion.div>
              )}
              {(interview.status !== "pending" || variant === "recruiter") && (
                <motion.div 
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-1 sm:flex-none"
                >
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={onViewDetails}
                    className="w-full sm:w-auto hover:bg-accent transition-colors"
                  >
                    Details
                  </Button>
                </motion.div>
              )}
            </motion.div>
          </div>

          {/* Created timestamp */}
          <motion.p 
            className="text-xs text-muted-foreground mt-4 pt-3 border-t border-border/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Scheduled{" "}
            {formatDistanceToNow(parseISO(interview.created_at), {
              addSuffix: true,
            })}
          </motion.p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InterviewCard;