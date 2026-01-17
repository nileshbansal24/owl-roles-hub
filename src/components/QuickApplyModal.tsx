import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { 
  Loader2, 
  CheckCircle2, 
  Building2, 
  MapPin, 
  Briefcase,
  FileText,
  Upload
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

interface Job {
  id: string;
  title: string;
  institute: string;
  location: string;
  job_type: string | null;
  salary_range: string | null;
}

interface QuickApplyModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: Job | null;
  resumeUrl?: string | null;
  onSuccess?: () => void;
}

const QuickApplyModal = ({
  open,
  onOpenChange,
  job,
  resumeUrl,
  onSuccess,
}: QuickApplyModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [coverLetter, setCoverLetter] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
    if (!user || !job) return;

    setSubmitting(true);
    try {
      // Check if already applied
      const { data: existingApp } = await supabase
        .from("job_applications")
        .select("id")
        .eq("job_id", job.id)
        .eq("applicant_id", user.id)
        .maybeSingle();

      if (existingApp) {
        toast({
          title: "Already Applied",
          description: "You have already applied to this position.",
          variant: "destructive",
        });
        setSubmitting(false);
        return;
      }

      // Submit application
      const { error } = await supabase.from("job_applications").insert({
        job_id: job.id,
        applicant_id: user.id,
        applicant_email: user.email || null,
        cover_letter: coverLetter || null,
        resume_url: resumeUrl || null,
        status: "pending",
      });

      if (error) throw error;

      setSubmitted(true);
      toast({
        title: "Application Submitted!",
        description: `Your application for ${job.title} has been sent.`,
      });

      // Close after a delay
      setTimeout(() => {
        onOpenChange(false);
        setSubmitted(false);
        setCoverLetter("");
        onSuccess?.();
      }, 2000);
    } catch (error: any) {
      console.error("Application error:", error);
      toast({
        title: "Application Failed",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!submitting) {
      onOpenChange(false);
      setSubmitted(false);
      setCoverLetter("");
    }
  };

  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="font-heading">
            {submitted ? "Application Sent!" : "Quick Apply"}
          </DialogTitle>
          {!submitted && (
            <DialogDescription>
              Apply to this position with your profile
            </DialogDescription>
          )}
        </DialogHeader>

        {submitted ? (
          <div className="py-8 text-center">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="h-8 w-8 text-green-600" />
            </div>
            <h3 className="font-heading font-semibold text-lg mb-2">
              Application Submitted!
            </h3>
            <p className="text-sm text-muted-foreground">
              Your application for <span className="font-medium text-foreground">{job.title}</span> at{" "}
              <span className="font-medium text-foreground">{job.institute}</span> has been sent successfully.
            </p>
          </div>
        ) : (
          <>
            {/* Job Summary */}
            <div className="bg-secondary/30 rounded-lg p-4 space-y-2">
              <h4 className="font-heading font-semibold text-foreground">
                {job.title}
              </h4>
              <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Building2 className="h-4 w-4" />
                  <span>{job.institute}</span>
                </div>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{job.location}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-1">
                {job.job_type && (
                  <Badge variant="secondary" className="text-xs">
                    <Briefcase className="h-3 w-3 mr-1" />
                    {job.job_type}
                  </Badge>
                )}
                {job.salary_range && (
                  <Badge variant="outline" className="text-xs">
                    {job.salary_range}
                  </Badge>
                )}
              </div>
            </div>

            {/* Resume Status */}
            <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                resumeUrl ? "bg-green-500/10" : "bg-amber-500/10"
              }`}>
                {resumeUrl ? (
                  <FileText className="h-5 w-5 text-green-600" />
                ) : (
                  <Upload className="h-5 w-5 text-amber-600" />
                )}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">
                  {resumeUrl ? "Resume attached" : "No resume uploaded"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {resumeUrl
                    ? "Your latest resume will be included"
                    : "Upload a resume from your profile for better chances"}
                </p>
              </div>
            </div>

            {/* Cover Letter */}
            <div className="space-y-2">
              <Label htmlFor="cover-letter">Cover Letter (Optional)</Label>
              <Textarea
                id="cover-letter"
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
                placeholder="Write a brief message to the recruiter about why you're interested in this role..."
                rows={4}
                className="resize-none"
              />
              <p className="text-xs text-muted-foreground">
                A personalized message can increase your chances of getting noticed.
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={handleClose}
                disabled={submitting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={submitting}
                className="flex-1"
              >
                {submitting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  "Submit Application"
                )}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default QuickApplyModal;
