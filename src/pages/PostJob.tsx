import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import RecruiterNavbar from "@/components/RecruiterNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
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
import { Loader2, ArrowLeft, ClipboardList, AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { jobPostingSchema, sanitizeTags } from "@/lib/validations";

const jobTypes = ["Full Time", "Part Time", "Contract", "Visiting"] as const;

const SALARY_MIN = 0;
const SALARY_MAX = 100; // LPA
const SALARY_STEP = 1;

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
  const [salaryRange, setSalaryRange] = useState<[number, number]>([6, 15]);
  const [lockedInstitute, setLockedInstitute] = useState<string>("");

  // Load recruiter's verified institution and lock it
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("university")
        .eq("id", user.id)
        .maybeSingle();
      const inst = data?.university?.trim() || "";
      if (inst) {
        setLockedInstitute(inst);
        setFormData((prev) => ({ ...prev, institute: inst }));
      }
    })();
  }, [user]);

  const formatSalary = (range: [number, number]) =>
    `${range[0]} - ${range[1]} LPA`;

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
    if (field === "institute" && lockedInstitute) return; // locked
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

  const handleSalaryChange = (value: number[]) => {
    const range: [number, number] = [value[0], value[1]];
    setSalaryRange(range);
    const formatted = formatSalary(range);
    setFormData((prev) => ({ ...prev, salary_range: formatted }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const submitData = {
      ...formData,
      institute: lockedInstitute || formData.institute,
      salary_range: formatSalary(salaryRange),
    };

    const fieldErrors = validate(submitData);
    setErrors(fieldErrors);
    setTouched(
      Object.keys(formData).reduce((acc, k) => ({ ...acc, [k]: true }), {})
    );

    if (Object.keys(fieldErrors).length > 0) {
      toast.error("Please fix the highlighted fields before posting.");
      return;
    }

    if (!submitData.institute) {
      toast.error("Your institution is not set on your profile. Please complete verification first.");
      return;
    }

    setLoading(true);
    try {
      const validation = jobPostingSchema.safeParse(submitData);
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
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <RecruiterNavbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          <Link
            to="/recruiter-dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 sm:p-10 animate-fade-in">
            <div className="flex items-center gap-4 mb-8 pb-6 border-b border-border">
              <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
                <ClipboardList className="h-6 w-6 text-primary" strokeWidth={1.75} />
              </div>
              <div>
                <h1 className="font-heading font-bold text-2xl text-foreground tracking-tight">
                  Post a New Job
                </h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Share an opening with qualified candidates
                </p>
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
                <Label htmlFor="institute" className="flex items-center gap-1.5">
                  Institution / Organisation *
                  {lockedInstitute && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </Label>
                <Input
                  id="institute"
                  value={lockedInstitute || formData.institute}
                  readOnly={!!lockedInstitute}
                  disabled={!!lockedInstitute}
                  placeholder="Your verified institution will appear here"
                  className={cn(
                    "h-11",
                    lockedInstitute && "bg-muted/60 cursor-not-allowed font-medium text-foreground"
                  )}
                />
                {lockedInstitute ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Lock className="h-3 w-3" />
                    Locked to your verified institution. Contact support to change this.
                  </p>
                ) : (
                  <FieldError field="institute" />
                )}
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

              <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-5">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Salary Range (LPA)</Label>
                  <span className="text-sm font-semibold text-primary tabular-nums">
                    ₹ {salaryRange[0]} – {salaryRange[1]} LPA
                  </span>
                </div>
                <Slider
                  min={SALARY_MIN}
                  max={SALARY_MAX}
                  step={SALARY_STEP}
                  value={salaryRange}
                  onValueChange={handleSalaryChange}
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹ {SALARY_MIN} LPA</span>
                  <span>₹ {SALARY_MAX}+ LPA</span>
                </div>
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

              <div className="flex flex-col-reverse sm:flex-row gap-3 pt-4 border-t border-border">
                <Button type="button" variant="outline" className="flex-1 h-11" onClick={() => navigate("/recruiter-dashboard")}>
                  Cancel
                </Button>
                <Button type="submit" className="flex-1 h-11" disabled={loading}>
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
                setFormData({ ...initialData, institute: lockedInstitute });
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
