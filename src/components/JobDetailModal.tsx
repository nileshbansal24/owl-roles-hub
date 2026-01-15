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
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  MapPin,
  Clock,
  Briefcase,
  DollarSign,
  Building2,
  Send,
  CheckCircle2,
  Loader2,
  X,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";

interface Job {
  id: string;
  title: string;
  institute: string;
  location: string;
  salary_range: string | null;
  job_type: string | null;
  tags: string[] | null;
  created_at: string;
  description?: string | null;
}

interface JobDetailModalProps {
  job: Job | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const JobDetailModal = ({ job, open, onOpenChange }: JobDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [coverLetter, setCoverLetter] = useState("");
  const [applying, setApplying] = useState(false);
  const [hasApplied, setHasApplied] = useState(false);
  const [showApplyForm, setShowApplyForm] = useState(false);

  if (!job) return null;

  const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  const handleApply = async () => {
    if (!user) {
      toast({
        title: "Login required",
        description: "Please login to apply for this job.",
        variant: "destructive",
      });
      navigate("/auth");
      return;
    }

    setApplying(true);
    try {
      const { error } = await supabase.from("job_applications").insert({
        job_id: job.id,
        applicant_id: user.id,
        cover_letter: coverLetter || null,
      });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Already applied",
            description: "You have already applied for this position.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setHasApplied(true);
        toast({
          title: "Application submitted!",
          description: "Your application has been sent to the employer.",
        });
      }
    } catch (error: any) {
      console.error("Error applying:", error);
      toast({
        title: "Application failed",
        description: error.message || "Failed to submit application.",
        variant: "destructive",
      });
    } finally {
      setApplying(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl pr-8">{job.title}</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
          {/* Company Info */}
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center">
              <Building2 className="h-7 w-7 text-primary" />
            </div>
            <div>
              <p className="font-medium text-foreground">{job.institute}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                <MapPin className="h-3.5 w-3.5" />
                <span>{job.location}</span>
              </div>
            </div>
          </div>

          {/* Job Details */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            {job.salary_range && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <DollarSign className="h-3.5 w-3.5" />
                  Salary
                </div>
                <p className="font-medium text-sm text-foreground">{job.salary_range}</p>
              </div>
            )}
            {job.job_type && (
              <div className="p-3 rounded-lg bg-secondary/50">
                <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                  <Briefcase className="h-3.5 w-3.5" />
                  Type
                </div>
                <p className="font-medium text-sm text-foreground">{job.job_type}</p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-xs text-muted-foreground mb-1">
                <Clock className="h-3.5 w-3.5" />
                Posted
              </div>
              <p className="font-medium text-sm text-foreground">{timeAgo}</p>
            </div>
          </div>

          {/* Tags */}
          {job.tags && job.tags.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {job.tags.map((tag, index) => (
                <Badge key={index} variant="outline" className="font-normal">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          {/* Description */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-2">About this position</h4>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {job.description || "Join our prestigious institution and contribute to academic excellence. We offer competitive compensation, professional development opportunities, and a collaborative work environment."}
            </p>
          </div>

          {/* Apply Section */}
          <AnimatePresence mode="wait">
            {hasApplied ? (
              <motion.div
                key="applied"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="p-4 rounded-lg bg-primary/10 border border-primary/20 flex items-center gap-3"
              >
                <CheckCircle2 className="h-5 w-5 text-primary" />
                <div>
                  <p className="font-medium text-foreground">Application Submitted!</p>
                  <p className="text-sm text-muted-foreground">The employer will review your application soon.</p>
                </div>
              </motion.div>
            ) : showApplyForm ? (
              <motion.div
                key="form"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="space-y-4 overflow-hidden"
              >
                <div className="space-y-2">
                  <Label htmlFor="coverLetter">Cover Letter (Optional)</Label>
                  <Textarea
                    id="coverLetter"
                    value={coverLetter}
                    onChange={(e) => setCoverLetter(e.target.value)}
                    placeholder="Tell the employer why you're a great fit for this role..."
                    rows={4}
                  />
                </div>
                <div className="flex gap-3">
                  <Button onClick={handleApply} disabled={applying} className="flex-1 gap-2">
                    {applying ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" />
                        Submit Application
                      </>
                    )}
                  </Button>
                  <Button variant="outline" onClick={() => setShowApplyForm(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </motion.div>
            ) : (
              <motion.div key="button">
                <Button onClick={() => setShowApplyForm(true)} size="lg" className="w-full gap-2">
                  <Send className="h-4 w-4" />
                  Apply Now
                </Button>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </DialogContent>
    </Dialog>
  );
};

export default JobDetailModal;
