import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  Sparkles,
  Building2,
  ArrowLeft,
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
  recruiter_id: string;
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

  const getTypeColor = () => {
    switch (interview.interview_type) {
      case "video":
        return "bg-primary/10 text-primary";
      case "phone":
        return "bg-accent text-accent-foreground";
      case "in_person":
        return "bg-secondary text-secondary-foreground";
      default:
        return "bg-primary/10 text-primary";
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

      // Fetch recruiter email and candidate name for notification
      const { data: recruiterProfile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", interview.recruiter_id)
        .single();

      const { data: candidateProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Send notification to recruiter
      const selectedTimeData = proposedTimes.find(t => t.datetime === selectedTime);
      await supabase.functions.invoke("send-status-notification", {
        body: {
          newStatus: "interview_confirmed",
          jobTitle: interview.job_title || "Position",
          instituteName: interview.institute || "Institution",
          candidateName: candidateProfile?.full_name || user.email,
          confirmedTime: selectedTimeData?.formatted || format(parseISO(selectedTime), "EEEE, MMMM d, yyyy 'at' h:mm a"),
          recruiterEmail: recruiterProfile?.email,
          interviewType: getTypeLabel(),
        },
      });

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

      // Fetch recruiter email and candidate name for notification
      const { data: recruiterProfile } = await supabase
        .from("profiles")
        .select("email")
        .eq("id", interview.recruiter_id)
        .single();

      const { data: candidateProfile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", user.id)
        .single();

      // Send notification to recruiter
      await supabase.functions.invoke("send-status-notification", {
        body: {
          newStatus: "interview_declined",
          jobTitle: interview.job_title || "Position",
          instituteName: interview.institute || "Institution",
          candidateName: candidateProfile?.full_name || user.email,
          declineReason: declineReason || undefined,
          recruiterEmail: recruiterProfile?.email,
        },
      });

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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-3">
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
                className={cn("p-2 rounded-lg", getTypeColor())}
              >
                {getTypeIcon()}
              </motion.div>
              {getTypeLabel()}
            </DialogTitle>
          </DialogHeader>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ staggerChildren: 0.06, delayChildren: 0.1 }}
          className="space-y-5 px-6 py-4 pb-6"
        >
          {/* Job Info */}
          <motion.div 
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/50"
          >
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-heading font-semibold text-foreground truncate">
                  {interview.job_title || "Job Interview"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {interview.institute}
                </p>
                <motion.div 
                  className="mt-2"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  <Badge
                    variant="outline"
                    className={cn(
                      "transition-all",
                      interview.status === "confirmed" &&
                        "bg-green-500/10 text-green-600 border-green-500/30",
                      interview.status === "pending" &&
                        "bg-amber-500/10 text-amber-600 border-amber-500/30",
                      interview.status === "declined" &&
                        "bg-red-500/10 text-red-600 border-red-500/30"
                    )}
                  >
                    {interview.status === "pending" && (
                      <Sparkles className="h-3 w-3 mr-1 animate-pulse" />
                    )}
                    {interview.status.charAt(0).toUpperCase() +
                      interview.status.slice(1)}
                  </Badge>
                </motion.div>
              </div>
            </div>
          </motion.div>

          {/* Meeting Details */}
          {interview.meeting_link && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="space-y-2"
            >
              <Label className="text-sm font-medium">Meeting Link</Label>
              <motion.a
                href={interview.meeting_link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary hover:text-primary/80 text-sm p-3 rounded-lg bg-primary/5 border border-primary/20 transition-colors"
                whileHover={{ x: 3 }}
              >
                <ExternalLink className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{interview.meeting_link}</span>
              </motion.a>
            </motion.div>
          )}

          {interview.location && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="space-y-2"
            >
              <Label className="text-sm font-medium">Location</Label>
              <p className="text-sm text-foreground flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                <MapPin className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                {interview.location}
              </p>
            </motion.div>
          )}

          {/* Recruiter Notes */}
          {interview.notes && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
              className="space-y-2"
            >
              <Label className="text-sm font-medium">Notes from Recruiter</Label>
              <div className="text-sm text-muted-foreground bg-muted/30 p-4 rounded-xl border border-border/50">
                {interview.notes}
              </div>
            </motion.div>
          )}

          {/* Time Selection (for pending interviews) */}
          {interview.status === "pending" && !showDeclineForm && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="space-y-3"
            >
              <Label className="text-sm font-medium flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                Select a Time Slot
              </Label>
              <div className="space-y-2">
                {proposedTimes.map((time, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.35 + index * 0.05 }}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    onClick={() => setSelectedTime(time.datetime)}
                    className={cn(
                      "w-full p-4 rounded-xl border text-left transition-all",
                      "hover:border-primary/50 hover:bg-primary/5",
                      selectedTime === time.datetime
                        ? "border-primary bg-primary/10 ring-2 ring-primary/20 shadow-sm"
                        : "border-border bg-card/50"
                    )}
                  >
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "p-2 rounded-lg transition-colors",
                        selectedTime === time.datetime 
                          ? "bg-primary/20 text-primary" 
                          : "bg-muted text-muted-foreground"
                      )}>
                        <Clock className="h-4 w-4" />
                      </div>
                      <span className="font-medium text-foreground flex-1">
                        {time.formatted}
                      </span>
                      <AnimatePresence>
                        {selectedTime === time.datetime && (
                          <motion.div
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0, opacity: 0 }}
                            transition={{ type: "spring", stiffness: 300 }}
                          >
                            <CheckCircle2 className="h-5 w-5 text-primary" />
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Confirmed Time Display */}
          {isConfirmed && interview.confirmed_time && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="p-4 rounded-xl bg-gradient-to-br from-green-500/10 to-green-500/5 border border-green-500/30"
            >
              <div className="flex items-center gap-3">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  className="p-2 rounded-full bg-green-500/20"
                >
                  <CalendarCheck className="h-5 w-5 text-green-600" />
                </motion.div>
                <div>
                  <span className="font-medium text-green-600">Confirmed Interview</span>
                  <p className="text-foreground mt-1">
                    {format(
                      parseISO(interview.confirmed_time),
                      "EEEE, MMMM d, yyyy 'at' h:mm a"
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Decline Form */}
          <AnimatePresence mode="wait">
            {showDeclineForm && (
              <motion.div
                key="decline-form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-3 overflow-hidden"
              >
                <Label htmlFor="declineReason" className="text-sm font-medium">
                  Reason for Declining (Optional)
                </Label>
                <Textarea
                  id="declineReason"
                  value={declineReason}
                  onChange={(e) => setDeclineReason(e.target.value)}
                  placeholder="Let the recruiter know why you can't attend..."
                  rows={3}
                  className="resize-none transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          {interview.status === "pending" && (
            <motion.div 
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-3 pt-2"
            >
              {showDeclineForm ? (
                <>
                  <motion.div 
                    className="flex-1" 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setShowDeclineForm(false)}
                      className="w-full h-11 gap-2"
                    >
                      <ArrowLeft className="h-4 w-4" />
                      Back
                    </Button>
                  </motion.div>
                  <motion.div 
                    className="flex-1" 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      variant="destructive"
                      onClick={handleDecline}
                      disabled={responding}
                      className="w-full h-11 gap-2 shadow-lg"
                    >
                      {responding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CalendarX className="h-4 w-4" />
                      )}
                      Confirm Decline
                    </Button>
                  </motion.div>
                </>
              ) : (
                <>
                  <motion.div 
                    className="flex-1" 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      variant="outline"
                      onClick={() => setShowDeclineForm(true)}
                      className="w-full h-11 gap-2 hover:border-destructive/50 hover:text-destructive hover:bg-destructive/5"
                    >
                      <CalendarX className="h-4 w-4" />
                      Decline
                    </Button>
                  </motion.div>
                  <motion.div 
                    className="flex-1" 
                    whileHover={{ scale: 1.01 }} 
                    whileTap={{ scale: 0.99 }}
                  >
                    <Button
                      onClick={handleConfirm}
                      disabled={responding || !selectedTime}
                      className="w-full h-11 gap-2 shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
                    >
                      {responding ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <CalendarCheck className="h-4 w-4" />
                      )}
                      Confirm Time
                    </Button>
                  </motion.div>
                </>
              )}
            </motion.div>
          )}
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewResponseModal;