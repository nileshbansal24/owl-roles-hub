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
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">
            Schedule Interview
          </DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Candidate Info */}
          <div className="p-4 rounded-lg bg-secondary/50 border">
            <p className="text-sm text-muted-foreground">Scheduling for</p>
            <p className="font-medium text-foreground">
              {application.profiles?.full_name || "Candidate"}
            </p>
            <p className="text-sm text-muted-foreground">
              {application.jobs.title} at {application.jobs.institute}
            </p>
          </div>

          {/* Interview Type */}
          <div className="space-y-2">
            <Label>Interview Type</Label>
            <Select value={interviewType} onValueChange={setInterviewType}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="video">
                  <div className="flex items-center gap-2">
                    <Video className="h-4 w-4" />
                    Video Call
                  </div>
                </SelectItem>
                <SelectItem value="phone">
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4" />
                    Phone Call
                  </div>
                </SelectItem>
                <SelectItem value="in_person">
                  <div className="flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    In Person
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Meeting Link / Location */}
          {interviewType === "video" && (
            <div className="space-y-2">
              <Label htmlFor="meetingLink">Meeting Link</Label>
              <Input
                id="meetingLink"
                value={meetingLink}
                onChange={(e) => setMeetingLink(e.target.value)}
                placeholder="https://zoom.us/j/... or Google Meet link"
              />
            </div>
          )}

          {interviewType === "in_person" && (
            <div className="space-y-2">
              <Label htmlFor="location">Location</Label>
              <Input
                id="location"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Office address or room number"
              />
            </div>
          )}

          {/* Proposed Times */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Proposed Time Slots</Label>
              {proposedTimes.length < 5 && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addTimeSlot}
                  className="h-8 gap-1"
                >
                  <Plus className="h-3 w-3" />
                  Add Slot
                </Button>
              )}
            </div>

            <AnimatePresence mode="popLayout">
              {proposedTimes.map((slot, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2"
                >
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn(
                          "flex-1 justify-start text-left font-normal",
                          !slot.date && "text-muted-foreground"
                        )}
                      >
                        <CalendarDays className="mr-2 h-4 w-4" />
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

                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="time"
                      value={slot.time}
                      onChange={(e) =>
                        updateTimeSlot(index, "time", e.target.value)
                      }
                      className="pl-10 w-32"
                    />
                  </div>

                  {proposedTimes.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeTimeSlot(index)}
                      className="h-9 w-9 shrink-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  )}
                </motion.div>
              ))}
            </AnimatePresence>

            <p className="text-xs text-muted-foreground">
              Provide up to 5 time slots for the candidate to choose from.
            </p>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes for Candidate (Optional)</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any preparation tips or agenda for the interview..."
              rows={3}
            />
          </div>

          {/* Submit */}
          <Button
            onClick={handleSchedule}
            disabled={scheduling}
            className="w-full gap-2"
          >
            {scheduling ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Send className="h-4 w-4" />
                Send Interview Request
              </>
            )}
          </Button>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default InterviewScheduleModal;
