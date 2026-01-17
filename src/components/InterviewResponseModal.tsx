import { useState } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Video,
  Phone,
  MapPin,
  CalendarCheck,
  CalendarX,
  Loader2,
  ExternalLink,
  Clock,
  CheckCircle2,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
}

interface InterviewResponseModalProps {
  interview: Interview | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onResponded?: () => void;
}

const InterviewResponseModal = ({
  interview,
  open,
  onOpenChange,
  onResponded,
}: InterviewResponseModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [declineReason, setDeclineReason] = useState("");
  const [responding, setResponding] = useState(false);
  const [showDeclineForm, setShowDeclineForm] = useState(false);

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
        return "Video Interview";
      case "phone":
        return "Phone Interview";
      case "in_person":
        return "In-Person Interview";
      default:
        return "Interview";
    }
  };

  const handleConfirm = async () => {
    if (!user || !selectedTime) {
      toast({
        title: "Select a time",
        description: "Please select one of the proposed time slots.",
        variant: "destructive",
      });
      return;
    }

    setResponding(true);

    try {
      const { error } = await supabase
        .from("interviews")
        .update({
          status: "confirmed",
          confirmed_time: selectedTime,
        })
        .eq("id", interview.id);

      if (error) throw error;

      toast({
        title: "Interview confirmed!",
        description: "The recruiter has been notified of your confirmed time.",
      });

      onOpenChange(false);
      onResponded?.();
    } catch (error: any) {
      console.error("Error confirming interview:", error);
      toast({
        title: "Failed to confirm",
        description: error.message || "Could not confirm the interview.",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  const handleDecline = async () => {
    if (!user) return;

    setResponding(true);

    try {
      const { error } = await supabase
        .from("interviews")
        .update({
          status: "declined",
          notes: declineReason
            ? `${interview.notes || ""}\n\nCandidate declined: ${declineReason}`
            : interview.notes,
        })
        .eq("id", interview.id);

      if (error) throw error;

      toast({
        title: "Interview declined",
        description: "The recruiter has been notified.",
      });

      onOpenChange(false);
      onResponded?.();
    } catch (error: any) {
      console.error("Error declining interview:", error);
      toast({
        title: "Failed to decline",
        description: error.message || "Could not decline the interview.",
        variant: "destructive",
      });
    } finally {
      setResponding(false);
    }
  };

  const isConfirmed = interview.status === "confirmed";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl flex items-center gap-2">
            {getTypeIcon()}
            {getTypeLabel()}
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Job Info */}
          <div className="p-4 rounded-lg bg-secondary/50 border">
            <p className="font-medium text-foreground">
              {interview.job_title || "Job Interview"}
            </p>
            <p className="text-sm text-muted-foreground">
              {interview.institute}
            </p>
            <div className="mt-2">
              <Badge
                variant="outline"
                className={cn(
                  interview.status === "confirmed" &&
                    "bg-green-500/10 text-green-600 border-green-500/30",
                  interview.status === "pending" &&
                    "bg-amber-500/10 text-amber-600 border-amber-500/30",
                  interview.status === "declined" &&
                    "bg-red-500/10 text-red-600 border-red-500/30"
                )}
              >
                {interview.status.charAt(0).toUpperCase() +
                  interview.status.slice(1)}
              </Badge>
            </div>
          </div>

          {/* Meeting Details */}
          {interview.meeting_link && (
            <div className="space-y-2">
              <Label>Meeting Link</Label>
              <a
                href={interview.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:underline text-sm"
              >
                <ExternalLink className="h-4 w-4" />
                {interview.meeting_link}
              </a>
            </div>
          )}

          {interview.location && (
            <div className="space-y-2">
              <Label>Location</Label>
              <p className="text-sm text-foreground flex items-center gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                {interview.location}
              </p>
            </div>
          )}

          {/* Recruiter Notes */}
          {interview.notes && (
            <div className="space-y-2">
              <Label>Notes from Recruiter</Label>
              <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">
                {interview.notes}
              </p>
            </div>
          )}

          {/* Time Selection (for pending interviews) */}
          {interview.status === "pending" && !showDeclineForm && (
            <div className="space-y-3">
              <Label>Select a Time Slot</Label>
              <div className="space-y-2">
                {proposedTimes.map((time, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedTime(time.datetime)}
                    className={cn(
                      "w-full p-3 rounded-lg border text-left transition-all",
                      "hover:border-primary/50 hover:bg-primary/5",
                      selectedTime === time.datetime
                        ? "border-primary bg-primary/10 ring-1 ring-primary"
                        : "border-border"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium text-foreground">
                        {time.formatted}
                      </span>
                      {selectedTime === time.datetime && (
                        <CheckCircle2 className="h-4 w-4 text-primary ml-auto" />
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Confirmed Time Display */}
          {isConfirmed && interview.confirmed_time && (
            <div className="p-4 rounded-lg bg-green-500/10 border border-green-500/30">
              <div className="flex items-center gap-2 text-green-600">
                <CalendarCheck className="h-5 w-5" />
                <span className="font-medium">Confirmed Interview</span>
              </div>
              <p className="mt-2 text-foreground">
                {format(
                  parseISO(interview.confirmed_time),
                  "EEEE, MMMM d, yyyy 'at' h:mm a"
                )}
              </p>
            </div>
          )}

          {/* Decline Form */}
          {showDeclineForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="space-y-3"
            >
              <Label htmlFor="declineReason">
                Reason for Declining (Optional)
              </Label>
              <Textarea
                id="declineReason"
                value={declineReason}
                onChange={(e) => setDeclineReason(e.target.value)}
                placeholder="Let the recruiter know why you can't attend..."
                rows={3}
              />
            </motion.div>
          )}

          {/* Actions */}
          {interview.status === "pending" && (
            <div className="flex gap-3">
              {showDeclineForm ? (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeclineForm(false)}
                    className="flex-1"
                  >
                    Back
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={handleDecline}
                    disabled={responding}
                    className="flex-1 gap-2"
                  >
                    {responding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarX className="h-4 w-4" />
                    )}
                    Confirm Decline
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeclineForm(true)}
                    className="flex-1 gap-2"
                  >
                    <CalendarX className="h-4 w-4" />
                    Decline
                  </Button>
                  <Button
                    onClick={handleConfirm}
                    disabled={responding || !selectedTime}
                    className="flex-1 gap-2"
                  >
                    {responding ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <CalendarCheck className="h-4 w-4" />
                    )}
                    Confirm
                  </Button>
                </>
              )}
            </div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewResponseModal;
