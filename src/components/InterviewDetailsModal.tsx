import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import {
  Video,
  Phone,
  MapPin,
  Clock,
  CalendarCheck,
  ExternalLink,
  Building2,
  User,
  FileText,
  Mail,
  Briefcase,
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
  candidate_email?: string;
  candidate_avatar?: string;
  candidate_role?: string;
}

interface InterviewDetailsModalProps {
  interview: Interview | null;
  open: boolean;
  onClose: () => void;
}

const InterviewDetailsModal = ({
  interview,
  open,
  onClose,
}: InterviewDetailsModalProps) => {
  if (!interview) return null;

  const proposedTimes = interview.proposed_times as ProposedTime[];

  const getTypeIcon = () => {
    switch (interview.interview_type) {
      case "video":
        return <Video className="h-5 w-5" />;
      case "phone":
        return <Phone className="h-5 w-5" />;
      case "in_person":
        return <MapPin className="h-5 w-5" />;
      default:
        return <Video className="h-5 w-5" />;
    }
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

  const getStatusStyles = () => {
    const statusStyles = {
      pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
      confirmed: "bg-green-500/10 text-green-600 border-green-500/30",
      declined: "bg-red-500/10 text-red-600 border-red-500/30",
      cancelled: "bg-muted text-muted-foreground border-muted",
      completed: "bg-primary/10 text-primary border-primary/30",
    };
    return statusStyles[interview.status as keyof typeof statusStyles] || statusStyles.pending;
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-heading">
            <CalendarCheck className="h-5 w-5 text-primary" />
            Interview Details
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6 mt-4"
        >
          {/* Candidate Info */}
          <div className="flex items-start gap-4 p-4 rounded-lg bg-secondary/30 border border-border/50">
            <Avatar className="h-14 w-14 shrink-0">
              <AvatarImage src={interview.candidate_avatar || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-heading font-bold">
                {interview.candidate_name?.slice(0, 2).toUpperCase() || "C"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-lg text-foreground">
                {interview.candidate_name || "Candidate"}
              </h3>
              {interview.candidate_role && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Briefcase className="h-3.5 w-3.5" />
                  {interview.candidate_role}
                </p>
              )}
              {interview.candidate_email && (
                <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Mail className="h-3.5 w-3.5" />
                  {interview.candidate_email}
                </p>
              )}
            </div>
          </div>

          {/* Job Info */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Position
            </h4>
            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <p className="font-heading font-semibold text-foreground">
                {interview.job_title || "Position"}
              </p>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Building2 className="h-3.5 w-3.5" />
                {interview.institute}
              </p>
            </div>
          </div>

          <Separator />

          {/* Interview Type & Status */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Type
              </h4>
              <div className="flex items-center gap-2 p-3 rounded-lg bg-secondary/50">
                <div className="p-2 rounded-lg bg-primary/10 text-primary">
                  {getTypeIcon()}
                </div>
                <span className="font-medium text-foreground">{getTypeLabel()}</span>
              </div>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Status
              </h4>
              <div className="p-3 rounded-lg bg-secondary/50 flex items-center">
                <Badge variant="outline" className={cn("text-sm", getStatusStyles())}>
                  {interview.status.charAt(0).toUpperCase() + interview.status.slice(1)}
                </Badge>
              </div>
            </div>
          </div>

          {/* Time Information */}
          <div className="space-y-2">
            <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
              Schedule
            </h4>
            {interview.confirmed_time ? (
              <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
                <div className="flex items-center gap-2 text-green-700">
                  <CalendarCheck className="h-5 w-5" />
                  <span className="font-semibold">Confirmed</span>
                </div>
                <p className="text-lg font-medium text-foreground mt-2">
                  {format(parseISO(interview.confirmed_time), "EEEE, MMMM d, yyyy")}
                </p>
                <p className="text-muted-foreground">
                  {format(parseISO(interview.confirmed_time), "h:mm a")}
                </p>
              </div>
            ) : (
              <div className="p-4 rounded-lg bg-amber-500/10 border border-amber-500/30">
                <div className="flex items-center gap-2 text-amber-700 mb-3">
                  <Clock className="h-5 w-5" />
                  <span className="font-semibold">Proposed Times</span>
                </div>
                <div className="space-y-2">
                  {proposedTimes.map((time, index) => (
                    <div key={index} className="p-2 rounded bg-background/50 text-sm">
                      {time.formatted || format(parseISO(time.datetime), "EEE, MMM d 'at' h:mm a")}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Meeting Link */}
          {interview.meeting_link && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Meeting Link
              </h4>
              <a
                href={interview.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-3 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="font-medium truncate">{interview.meeting_link}</span>
              </a>
            </div>
          )}

          {/* Location */}
          {interview.location && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Location
              </h4>
              <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary/50">
                <MapPin className="h-4 w-4 mt-0.5 text-muted-foreground" />
                <span className="text-foreground">{interview.location}</span>
              </div>
            </div>
          )}

          {/* Notes */}
          {interview.notes && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                Notes
              </h4>
              <div className="p-4 rounded-lg bg-secondary/50 border border-border/50">
                <div className="flex items-start gap-2">
                  <FileText className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {interview.notes}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Scheduled Timestamp */}
          <p className="text-xs text-muted-foreground text-center pt-2">
            Scheduled {formatDistanceToNow(parseISO(interview.created_at), { addSuffix: true })}
          </p>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
            {interview.meeting_link && interview.status === "confirmed" && (
              <Button asChild>
                <a href={interview.meeting_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  Join Meeting
                </a>
              </Button>
            )}
          </div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewDetailsModal;