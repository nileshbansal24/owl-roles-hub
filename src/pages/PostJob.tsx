import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import RecruiterNavbar from "@/components/RecruiterNavbar";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Loader2, ArrowLeft, Briefcase, AlertCircle, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { jobPostingSchema, sanitizeTags } from "@/lib/validations";

const jobTypes = ["Full Time", "Part Time", "Contract", "Visiting"] as const;

const initialData = {
  title: "",
  institute: "",
  location: "",
  description: "",
  salary_range: "",
  job_type: "Full Time",
  tags: "",
};

type FieldErrors = Partial<Record<keyof typeof initialData, string>>;

const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState(initialData);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [successOpen, setSuccessOpen] = useState(false);

  const validate = (data = formData): FieldErrors => {
    const result = jobPostingSchema.safeParse(data);
    if (result.success) return {};
    const fieldErrors: FieldErrors = {};
    for (const issue of result.error.errors) {
      const key = issue.path[0] as keyof typeof initialData;
      if (key && !fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    return fieldErrors;
  };

  const handleChange = (field: keyof typeof initialData, value: string) => {
    const next = { ...formData, [field]: value };
    setFormData(next);
    if (touched[field] || errors[field]) {
      setErrors(validate(next));
    }
  };

  const handleBlur = (field: keyof typeof initialData) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    setErrors(validate());
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const fieldErrors = validate();
    setErrors(fieldErrors);
    setTouched(
      Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {})
    );

    if (Object.keys(fieldErrors).length > 0) {
      toast.error("Please fix the highlighted fields before posting.");
      return;
    }

    setLoading(true);
    try {
      const validation = jobPostingSchema.safeParse(formData);
      if (!validation.success) return;

      const tagsArray = sanitizeTags(formData.tags);

      const { error } = await supabase.from("jobs").insert({
        title: validation.data.title,
        institute: validation.data.institute,
        location: validation.data.location,
        description: validation.data.description || null,
        salary_range: validation.data.salary_range || null,
        job_type: validation.data.job_type,
        tags: tagsArray,
        created_by: user.id,
      });

      if (error) {
        toast.error("Couldn't post job", { description: error.message });
      } else {
        setSuccessOpen(true);
      }
    } catch {
      toast.error("Something went wrong", {
        description: "An unexpected error occurred. Please try again.",
      });
    } finally {
      setLoading(false);
    }
  };

  const inputCls = (field: keyof typeof initialData) =>
    cn("h-11", errors[field] && "border-destructive focus-visible:ring-destructive");

  const FieldError = ({ field }: { field: keyof typeof initialData }) =>
    errors[field] ? (
      <p className="flex items-center gap-1.5 text-xs text-destructive mt-1">
        <AlertCircle className="h-3.5 w-3.5" />
        {errors[field]}
      </p>
    ) : null;

  return (
    <div className="min-h-screen bg-background">
      <RecruiterNavbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          <Link
            to="/recruiter-dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="card-elevated p-8 animate-fade-in">
            <div className="flex items-center gap-3 mb-8">
              <div className="w-12 h-12 rounded-lg bg-primary flex items-center justify-center">
                <Briefcase className="h-6 w-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading font-bold text-2xl text-foreground">Post a New Job</h1>
                <p className="text-muted-foreground">Fill in the details to list your position</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" noValidate>
              <div className="space-y-1.5">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Assistant Professor of Computer Science"
                  value={formData.title}
                  onChange={(e) => handleChange("title", e.target.value)}
                  onBlur={() => handleBlur("title")}
                  aria-invalid={!!errors.title}
                  className={inputCls("title")}
                />
                <FieldError field="title" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="institute">Institution *</Label>
                <Input
                  id="institute"
                  placeholder="e.g., Massachusetts Institute of Technology"
                  value={formData.institute}
                  onChange={(e) => handleChange("institute", e.target.value)}
                  onBlur={() => handleBlur("institute")}
                  aria-invalid={!!errors.institute}
                  className={inputCls("institute")}
                />
                <FieldError field="institute" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="location">Location *</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Bengaluru, Karnataka"
                    value={formData.location}
                    onChange={(e) => handleChange("location", e.target.value)}
                    onBlur={() => handleBlur("location")}
                    aria-invalid={!!errors.location}
                    className={inputCls("location")}
                  />
                  <FieldError field="location" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="job_type">Job Type</Label>
                  <Select
                    value={formData.job_type}
                    onValueChange={(value) => handleChange("job_type", value)}
                  >
                    <SelectTrigger className="h-11 bg-popover">
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {jobTypes.map((type) => (
                        <SelectItem key={type} value={type}>
                          {type}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="salary_range">Salary Range</Label>
                <Input
                  id="salary_range"
                  placeholder="e.g., 8 - 12 LPA"
                  value={formData.salary_range}
                  onChange={(e) => handleChange("salary_range", e.target.value)}
                  onBlur={() => handleBlur("salary_range")}
                  aria-invalid={!!errors.salary_range}
                  className={inputCls("salary_range")}
                />
                <FieldError field="salary_range" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="description">Job Description</Label>
                <Textarea
                  id="description"
                  placeholder="Describe the role, responsibilities, and qualifications..."
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  onBlur={() => handleBlur("description")}
                  aria-invalid={!!errors.description}
                  rows={5}
                  className={cn(errors.description && "border-destructive focus-visible:ring-destructive")}
                />
                <div className="flex justify-between items-center">
                  <FieldError field="description" />
                  <p className="text-xs text-muted-foreground ml-auto">
                    {formData.description.length}/5000
                  </p>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input
                  id="tags"
                  placeholder="e.g., Research, Machine Learning, AI"
                  value={formData.tags}
                  onChange={(e) => handleChange("tags", e.target.value)}
                  onBlur={() => handleBlur("tags")}
                  aria-invalid={!!errors.tags}
                  className={inputCls("tags")}
                />
                <FieldError field="tags" />
              </div>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" className="flex-1" onClick={() => navigate("/recruiter-dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1" disabled={loading}>
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Posting...
                    </>
                  ) : (
                    "Post Job"
                  )}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>

      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center font-heading text-2xl">
              Job posted successfully
            </DialogTitle>
            <DialogDescription className="text-center">
              Your listing is live and candidates can start applying right away.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setFormData(initialData);
                setErrors({});
                setTouched({});
                setSuccessOpen(false);
              }}
            >
              Post another
            </Button>
            <Button onClick={() => navigate("/recruiter-dashboard")}>
              Go to dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PostJob;
