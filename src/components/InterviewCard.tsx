import { motion } from "framer-motion";
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
}

const InterviewCard = ({
  interview,
  variant = "candidate",
  onRespond,
  onViewDetails,
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
      completed: "bg-blue-500/10 text-blue-600 border-blue-500/30",
    };

    return (
      <Badge
        variant="outline"
        className={cn(
          statusStyles[interview.status as keyof typeof statusStyles] ||
            statusStyles.pending
        )}
      >
        {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
      </Badge>
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
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="group"
    >
      <Card className="hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              {/* Header */}
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                  {getTypeIcon()}
                </div>
                <span className="text-sm font-medium text-foreground">
                  {getTypeLabel()}
                </span>
                {getStatusBadge()}
              </div>

              {/* Job/Candidate Info */}
              <div className="mb-3">
                {variant === "candidate" ? (
                  <>
                    <p className="font-medium text-foreground truncate">
                      {interview.job_title || "Interview"}
                    </p>
                    <p className="text-sm text-muted-foreground flex items-center gap-1">
                      <Building2 className="h-3 w-3" />
                      {interview.institute}
                    </p>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-foreground truncate">
                      {interview.candidate_name || "Candidate"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {interview.job_title} at {interview.institute}
                    </p>
                  </>
                )}
              </div>

              {/* Time Info */}
              <div className="space-y-1">
                {interview.confirmed_time ? (
                  <div className="flex items-center gap-2 text-sm">
                    <CalendarCheck className="h-4 w-4 text-green-600" />
                    <span className="text-foreground">
                      {format(
                        parseISO(interview.confirmed_time),
                        "EEE, MMM d 'at' h:mm a"
                      )}
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>
                      {proposedTimes.length} time slot
                      {proposedTimes.length !== 1 ? "s" : ""} proposed
                    </span>
                  </div>
                )}

                {interview.meeting_link && interview.status === "confirmed" && (
                  <a
                    href={interview.meeting_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 text-sm text-primary hover:underline"
                  >
                    <ExternalLink className="h-3 w-3" />
                    Join Meeting
                  </a>
                )}

                {interview.location && interview.status === "confirmed" && (
                  <p className="text-sm text-muted-foreground flex items-center gap-1">
                    <MapPin className="h-3 w-3" />
                    {interview.location}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2">
              {interview.status === "pending" && variant === "candidate" && (
                <Button size="sm" onClick={onRespond}>
                  Respond
                </Button>
              )}
              {(interview.status !== "pending" || variant === "recruiter") && (
                <Button size="sm" variant="outline" onClick={onViewDetails}>
                  Details
                </Button>
              )}
            </div>
          </div>

          {/* Created timestamp */}
          <p className="text-xs text-muted-foreground mt-3 pt-3 border-t">
            Scheduled{" "}
            {formatDistanceToNow(parseISO(interview.created_at), {
              addSuffix: true,
            })}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
};

export default InterviewCard;
