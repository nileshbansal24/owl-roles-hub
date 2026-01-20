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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  CalendarDays,
  Clock,
  Video,
  Phone,
  MapPin,
  Plus,
  X,
  Loader2,
  Send,
  Sparkles,
  User,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

interface ProposedTime {
  date: Date;
  time: string;
}

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  applicant_email: string | null;
  jobs: {
    title: string;
    institute: string;
  };
  profiles: {
    full_name: string | null;
    email?: string | null;
  } | null;
}

interface InterviewScheduleModalProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled?: () => void;
}

const InterviewScheduleModal = ({
  application,
  open,
  onOpenChange,
  onScheduled,
}: InterviewScheduleModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [proposedTimes, setProposedTimes] = useState<ProposedTime[]>([
    { date: new Date(), time: "10:00" },
  ]);
  const [interviewType, setInterviewType] = useState<string>("video");
  const [meetingLink, setMeetingLink] = useState("");
  const [location, setLocation] = useState("");
  const [notes, setNotes] = useState("");
  const [scheduling, setScheduling] = useState(false);

  if (!application) return null;

  const addTimeSlot = () => {
    if (proposedTimes.length < 5) {
      setProposedTimes([...proposedTimes, { date: new Date(), time: "10:00" }]);
    }
  };

  const removeTimeSlot = (index: number) => {
    if (proposedTimes.length > 1) {
      setProposedTimes(proposedTimes.filter((_, i) => i !== index));
    }
  };

  const updateTimeSlot = (
    index: number,
    field: "date" | "time",
    value: Date | string
  ) => {
    const updated = [...proposedTimes];
    if (field === "date" && value instanceof Date) {
      updated[index].date = value;
    } else if (field === "time" && typeof value === "string") {
      updated[index].time = value;
    }
    setProposedTimes(updated);
  };

  const handleSchedule = async () => {
    if (!user || !application) return;

    if (proposedTimes.length === 0) {
      toast({
        title: "No times proposed",
        description: "Please add at least one interview time slot.",
        variant: "destructive",
      });
      return;
    }

    if (interviewType === "video" && !meetingLink) {
      toast({
        title: "Meeting link required",
        description: "Please provide a video meeting link.",
        variant: "destructive",
      });
      return;
    }

    if (interviewType === "in_person" && !location) {
      toast({
        title: "Location required",
        description: "Please provide the interview location.",
        variant: "destructive",
      });
      return;
    }

    setScheduling(true);

    try {
      // Format proposed times for storage
      const formattedTimes = proposedTimes.map((pt) => ({
        datetime: new Date(
          pt.date.getFullYear(),
          pt.date.getMonth(),
          pt.date.getDate(),
          parseInt(pt.time.split(":")[0]),
          parseInt(pt.time.split(":")[1])
        ).toISOString(),
        formatted: `${format(pt.date, "EEEE, MMMM d, yyyy")} at ${pt.time}`,
      }));

      const { error } = await supabase.from("interviews").insert({
        application_id: application.id,
        recruiter_id: user.id,
        candidate_id: application.applicant_id,
        job_id: application.job_id,
        proposed_times: formattedTimes,
        interview_type: interviewType,
        meeting_link: interviewType === "video" ? meetingLink : null,
        location: interviewType === "in_person" ? location : null,
        notes: notes || null,
        status: "pending",
      });

      if (error) throw error;

      // Send notification email
      await supabase.functions.invoke("send-status-notification", {
        body: {
          applicationId: application.id,
          newStatus: "interview_scheduled",
          jobTitle: application.jobs.title,
          instituteName: application.jobs.institute,
          interviewDetails: {
            type: interviewType,
            proposedTimes: formattedTimes,
            meetingLink: interviewType === "video" ? meetingLink : null,
            location: interviewType === "in_person" ? location : null,
          },
        },
      });

      toast({
        title: "Interview scheduled!",
        description: "The candidate has been notified to confirm a time slot.",
      });

      onOpenChange(false);
      onScheduled?.();

      // Reset form
      setProposedTimes([{ date: new Date(), time: "10:00" }]);
      setInterviewType("video");
      setMeetingLink("");
      setLocation("");
      setNotes("");
    } catch (error: any) {
      console.error("Error scheduling interview:", error);
      toast({
        title: "Failed to schedule",
        description: error.message || "Could not schedule the interview.",
        variant: "destructive",
      });
    } finally {
      setScheduling(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto p-0">
        <div className="sticky top-0 z-10 bg-background/95 backdrop-blur-sm border-b px-6 py-4">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl flex items-center gap-2">
              <motion.div
                initial={{ rotate: -20, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", stiffness: 200 }}
              >
                <CalendarDays className="h-5 w-5 text-primary" />
              </motion.div>
              Schedule Interview
            </DialogTitle>
          </DialogHeader>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-6 px-6 py-4 pb-6"
        >
          {/* Candidate Info */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-4 rounded-xl bg-gradient-to-br from-secondary/50 to-secondary/30 border border-border/50 backdrop-blur-sm"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">Scheduling for</p>
                <p className="font-heading font-semibold text-foreground">
                  {application.profiles?.full_name || "Candidate"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {application.jobs.title} at {application.jobs.institute}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Interview Type */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="space-y-2"
          >
            <Label className="text-sm font-medium">Interview Type</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger className="h-11 transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video" className="cursor-pointer">
                  <div className="flex items-center gap-2 py-1">
                    <div className="p-1.5 rounded-md bg-primary/10 text-primary">
                      <Video className="h-4 w-4" />
                    </div>
                    <span>Video Call</span>
                  </div>
                </SelectItem>
                <SelectItem value="phone" className="cursor-pointer">
                  <div className="flex items-center gap-2 py-1">
                    <div className="p-1.5 rounded-md bg-accent text-accent-foreground">
                      <Phone className="h-4 w-4" />
                    </div>
                    <span>Phone Call</span>
                  </div>
                </SelectItem>
                <SelectItem value="in_person" className="cursor-pointer">
                  <div className="flex items-center gap-2 py-1">
                    <div className="p-1.5 rounded-md bg-secondary text-secondary-foreground">
                      <MapPin className="h-4 w-4" />
                    </div>
                    <span>In Person</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </motion.div>

          {/* Meeting Link / Location */}
          <AnimatePresence mode="wait">
            {interviewType === "video" && (
              <motion.div
                key="video-link"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Label htmlFor="meetingLink" className="text-sm font-medium">Meeting Link</Label>
                <div className="relative">
                  <Video className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="meetingLink"
                    value={meetingLink}
                    onChange={(e) => setMeetingLink(e.target.value)}
                    placeholder="https://zoom.us/j/... or Google Meet link"
                    className="pl-10 h-11 transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </motion.div>
            )}

            {interviewType === "in_person" && (
              <motion.div
                key="location"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-2 overflow-hidden"
              >
                <Label htmlFor="location" className="text-sm font-medium">Location</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="location"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Office address or room number"
                    className="pl-10 h-11 transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Proposed Times */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Proposed Time Slots</Label>
              {proposedTimes.length < 5 && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addTimeSlot}
                    className="h-8 gap-1.5 text-xs hover:border-primary/50 hover:bg-primary/5"
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Add Slot
                  </Button>
                </motion.div>
              )}
            </div>

            <div className="space-y-2">
              <AnimatePresence mode="popLayout">
                {proposedTimes.map((slot, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, x: -20, height: 0 }}
                    animate={{ opacity: 1, x: 0, height: "auto" }}
                    exit={{ opacity: 0, x: 20, height: 0 }}
                    layout
                    className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 p-3 rounded-lg bg-muted/30 border border-border/50"
                  >
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "flex-1 justify-start text-left font-normal h-10 transition-all hover:border-primary/50",
                            !slot.date && "text-muted-foreground"
                          )}
                        >
                          <CalendarDays className="mr-2 h-4 w-4 text-primary" />
                          {slot.date ? format(slot.date, "PP") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={slot.date}
                          onSelect={(date) =>
                            date && updateTimeSlot(index, "date", date)
                          }
                          disabled={(date) => date < new Date()}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>

                    <div className="relative flex-shrink-0">
                      <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        type="time"
                        value={slot.time}
                        onChange={(e) =>
                          updateTimeSlot(index, "time", e.target.value)
                        }
                        className="pl-10 w-full sm:w-32 h-10 transition-all hover:border-primary/50"
                      />
                    </div>

                    {proposedTimes.length > 1 && (
                      <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeTimeSlot(index)}
                          className="h-10 w-10 shrink-0 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </motion.div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles className="h-3 w-3" />
              Provide up to 5 time slots for the candidate to choose from.
            </p>
          </motion.div>

          {/* Notes */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="space-y-2"
          >
            <Label htmlFor="notes" className="text-sm font-medium">Notes for Candidate (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any preparation tips or agenda for the interview..."
              rows={3}
              className="resize-none transition-all hover:border-primary/50 focus:ring-2 focus:ring-primary/20"
            />
          </motion.div>

          {/* Submit */}
          <motion.div 
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <motion.div whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.99 }}>
              <Button
                onClick={handleSchedule}
                disabled={scheduling}
                className="w-full h-12 gap-2 text-base font-medium shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all"
              >
                {scheduling ? (
                  <>
                    <Loader2 className="h-5 w-5 animate-spin" />
                    Scheduling...
                  </>
                ) : (
                  <>
                    <Send className="h-5 w-5" />
                    Send Interview Request
                  </>
                )}
              </Button>
            </motion.div>
          </motion.div>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewScheduleModal;