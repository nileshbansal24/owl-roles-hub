import { useState, useEffect, useMemo } from "react";
import { useNavigate, Link, useParams } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import RecruiterNavbar from "@/components/RecruiterNavbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import { Badge } from "@/components/ui/badge";
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
import {
  Loader2,
  ArrowLeft,
  ClipboardList,
  AlertCircle,
  CheckCircle2,
  Lock,
  Briefcase,
  GraduationCap,
  FileText,
  Users,
  Sparkles,
  Building2,
  Plus,
  X,
  Eye,
  MapPin,
  IndianRupee,
  UserPlus,
  Search,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

import { cn } from "@/lib/utils";

// ---------- constants ----------
const jobTypes = ["Full Time", "Part Time", "Contract", "Visiting"] as const;

const departments = [
  // Teaching — Sciences
  "Department of Physics",
  "Department of Chemistry",
  "Department of Mathematics",
  "Department of Biology / Life Sciences",
  "Department of Biotechnology",
  "Department of Environmental Science",
  "Department of Statistics",
  // Teaching — Engineering & Tech
  "Department of Computer Science & Engineering",
  "Department of Information Technology",
  "Department of Electronics & Communication",
  "Department of Electrical Engineering",
  "Department of Mechanical Engineering",
  "Department of Civil Engineering",
  "Department of Chemical Engineering",
  "Department of Artificial Intelligence & Data Science",
  // Teaching — Commerce & Management
  "Department of Commerce",
  "Department of Management Studies / MBA",
  "Department of Economics",
  // Teaching — Humanities & Social Sciences
  "Department of English",
  "Department of Hindi / Regional Languages",
  "Department of History",
  "Department of Political Science",
  "Department of Sociology",
  "Department of Psychology",
  "Department of Philosophy",
  "Department of Education / B.Ed",
  // Teaching — Professional
  "Department of Law",
  "Department of Medicine / Medical Sciences",
  "Department of Pharmacy",
  "Department of Nursing",
  "Department of Architecture & Planning",
  "Department of Design",
  "Department of Fine Arts & Performing Arts",
  "Department of Physical Education & Sports",
  "Department of Journalism & Mass Communication",
  "Department of Hotel Management",
  "Department of Agriculture",
  // Non-teaching / Administration
  "Library & Information Services",
  "Examination Cell",
  "Admissions Office",
  "Academic Affairs / Registrar Office",
  "Research & Development Cell",
  "International Relations Office",
  "Placement & Career Services",
  "Human Resources (HR)",
  "Finance & Accounts",
  "IT & Systems Support",
  "Estate / Facilities Management",
  "Hostel Administration",
  "Public Relations & Communications",
  "Student Affairs / Welfare",
  "Quality Assurance (IQAC)",
  "Other",
] as const;

const experienceBands = [
  { label: "Fresher", min: 0, max: 0 },
  { label: "0 – 1 Years", min: 0, max: 1 },
  { label: "1 – 3 Years", min: 1, max: 3 },
  { label: "3 – 5 Years", min: 3, max: 5 },
  { label: "5 – 8 Years", min: 5, max: 8 },
  { label: "8+ Years", min: 8, max: 25 },
];

const industries = [
  "Education",
  "Information Technology",
  "Research",
  "Healthcare",
  "Finance",
  "Manufacturing",
  "Consulting",
  "E-commerce",
  "Media",
  "Non-Profit",
  "Government",
  "Other",
];

const orgSizes = [
  "1 – 10",
  "11 – 50",
  "51 – 200",
  "201 – 500",
  "501 – 1000",
  "1001 – 5000",
  "5000+",
];

const skillSuggestions = [
  "React", "Node.js", "Python", "Java", "TypeScript", "SQL", "AWS",
  "Machine Learning", "Data Analysis", "Research", "Teaching",
  "Communication", "Leadership", "Sales", "Digital Marketing",
  "Project Management", "Public Speaking", "Writing", "Excel", "Figma",
];

const SALARY_MIN = 0;
const SALARY_MAX = 100;

// ---------- types ----------
interface FormState {
  title: string;
  department: string;
  role: string;
  jobType: string;
  expBand: string;
  expMin: number;
  expMax: number;
  vacancies: number;
  location: string;
  salaryRange: [number, number];
  description: string;
  responsibilities: string[];
  qualifications: string[];
  skills: string[];
  companyAbout: string;
  companyWebsite: string;
  companyIndustry: string;
  companySize: string;
  companyLocation: string;
}

const initialState: FormState = {
  title: "",
  department: "",
  role: "",
  jobType: "Full Time",
  expBand: "1 – 3 Years",
  expMin: 1,
  expMax: 3,
  vacancies: 1,
  location: "",
  salaryRange: [6, 15],
  description: "",
  responsibilities: [""],
  qualifications: [""],
  skills: [],
  companyAbout: "",
  companyWebsite: "",
  companyIndustry: "",
  companySize: "",
  companyLocation: "",
};

// ---------- helpers ----------
const buildDescription = (f: FormState) => {
  const lines: string[] = [];
  if (f.description.trim()) {
    lines.push("## About the Role", f.description.trim(), "");
  }
  const resp = f.responsibilities.map((s) => s.trim()).filter(Boolean);
  if (resp.length) {
    lines.push("## Responsibilities", ...resp.map((r) => `- ${r}`), "");
  }
  const qual = f.qualifications.map((s) => s.trim()).filter(Boolean);
  if (qual.length) {
    lines.push("## Qualifications", ...qual.map((q) => `- ${q}`), "");
  }
  lines.push("## Job Details");
  lines.push(`- Department: ${f.department || "—"}`);
  lines.push(`- Role: ${f.role || "—"}`);
  lines.push(`- Experience: ${f.expBand} (${f.expMin}–${f.expMax} yrs)`);
  lines.push(`- Vacancies: ${f.vacancies}`);
  lines.push("");
  if (
    f.companyAbout.trim() ||
    f.companyWebsite.trim() ||
    f.companyIndustry ||
    f.companySize ||
    f.companyLocation.trim()
  ) {
    lines.push("## About the Institute / Company");
    if (f.companyAbout.trim()) lines.push(f.companyAbout.trim(), "");
    const meta: string[] = [];
    if (f.companyIndustry) meta.push(`- Industry: ${f.companyIndustry}`);
    if (f.companySize) meta.push(`- Size: ${f.companySize}`);
    if (f.companyLocation.trim())
      meta.push(`- Headquarters: ${f.companyLocation.trim()}`);
    if (f.companyWebsite.trim())
      meta.push(`- Website: ${f.companyWebsite.trim()}`);
    if (meta.length) lines.push(...meta);
  }
  return lines.join("\n").trim();
};

// ---------- section card ----------
const SectionCard = ({
  icon: Icon,
  title,
  subtitle,
  children,
}: {
  icon: React.ElementType;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) => (
  <section className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
    <header className="flex items-start gap-3 px-6 py-5 border-b border-border bg-muted/30">
      <div className="w-9 h-9 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
        <Icon className="h-4.5 w-4.5 text-primary" strokeWidth={2} />
      </div>
      <div className="min-w-0">
        <h2 className="font-heading font-semibold text-base text-foreground leading-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-xs text-muted-foreground mt-0.5">{subtitle}</p>
        )}
      </div>
    </header>
    <div className="p-6 space-y-5">{children}</div>
  </section>
);

// ---------- page ----------
const PostJob = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobId: editJobId } = useParams<{ jobId?: string }>();
  const isEditMode = !!editJobId;
  const [loading, setLoading] = useState(false);
  const [loadingJob, setLoadingJob] = useState(isEditMode);
  const [form, setForm] = useState<FormState>(initialState);
  const [lockedInstitute, setLockedInstitute] = useState("");
  const [successOpen, setSuccessOpen] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [skillInput, setSkillInput] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [originalSnapshot, setOriginalSnapshot] = useState<{
    title: string;
    location: string;
    salary_range: string;
    job_type: string;
    description: string;
    tags: string[];
  } | null>(null);
  const [notifiedCount, setNotifiedCount] = useState(0);

  // Collaboration
  type Colleague = { id: string; full_name: string | null; avatar_url: string | null; designation: string | null };
  const [collabEnabled, setCollabEnabled] = useState(false);
  const [colleagues, setColleagues] = useState<Colleague[]>([]);
  const [colleaguesLoading, setColleaguesLoading] = useState(false);
  const [selectedCollabIds, setSelectedCollabIds] = useState<string[]>([]);
  const [collabSearch, setCollabSearch] = useState("");


  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("profiles")
        .select("university, location")
        .eq("id", user.id)
        .maybeSingle();
      if (data?.university?.trim()) {
        setLockedInstitute(data.university.trim());
        setForm((p) => ({
          ...p,
          companyLocation: p.companyLocation || data.location || "",
        }));
      }
    })();
  }, [user]);

  // Load existing job in edit mode
  useEffect(() => {
    if (!isEditMode || !editJobId || !user) return;
    (async () => {
      setLoadingJob(true);
      const { data, error } = await supabase
        .from("jobs")
        .select("title, institute, location, description, salary_range, job_type, tags")
        .eq("id", editJobId)
        .maybeSingle();
      if (error || !data) {
        toast.error("Could not load this job for editing.");
        navigate("/recruiter-dashboard");
        return;
      }
      // Parse salary "X - Y LPA"
      let lo = 6, hi = 15;
      const m = (data.salary_range ?? "").match(/(\d+)\s*-\s*(\d+)/);
      if (m) { lo = parseInt(m[1]); hi = parseInt(m[2]); }
      setLockedInstitute((data.institute ?? "").trim());
      setForm((p) => ({
        ...p,
        title: data.title ?? "",
        location: data.location ?? "",
        jobType: data.job_type ?? "Full Time",
        salaryRange: [lo, hi],
        skills: Array.isArray(data.tags) ? (data.tags as string[]) : [],
        description: data.description ?? "",
        responsibilities: [""],
        qualifications: [""],
      }));
      setOriginalSnapshot({
        title: data.title ?? "",
        location: data.location ?? "",
        salary_range: data.salary_range ?? "",
        job_type: data.job_type ?? "",
        description: data.description ?? "",
        tags: Array.isArray(data.tags) ? (data.tags as string[]) : [],
      });
      setLoadingJob(false);
    })();
  }, [isEditMode, editJobId, user, navigate]);

  // Fetch same-institution recruiters when collab is enabled
  useEffect(() => {
    if (!user || !collabEnabled || !lockedInstitute || colleagues.length) return;
    setColleaguesLoading(true);
    (async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, designation, university")
        .eq("user_type", "recruiter")
        .ilike("university", lockedInstitute)
        .neq("id", user.id);
      if (!error && data) {
        setColleagues(
          data
            .filter(
              (p: any) =>
                (p.university ?? "").trim().toLowerCase() ===
                lockedInstitute.trim().toLowerCase(),
            )
            .map((p: any) => ({
              id: p.id,
              full_name: p.full_name,
              avatar_url: p.avatar_url,
              designation: p.designation,
            })),
        );
      }
      setColleaguesLoading(false);
    })();
  }, [user, collabEnabled, lockedInstitute, colleagues.length]);

  const toggleCollab = (id: string) =>
    setSelectedCollabIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );

  const filteredColleagues = useMemo(() => {
    const q = collabSearch.trim().toLowerCase();
    if (!q) return colleagues;
    return colleagues.filter(
      (c) =>
        (c.full_name ?? "").toLowerCase().includes(q) ||
        (c.designation ?? "").toLowerCase().includes(q),
    );
  }, [colleagues, collabSearch]);


  const update = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((p) => ({ ...p, [key]: value }));
    if (errors[key as string]) {
      setErrors((e) => {
        const { [key as string]: _, ...rest } = e;
        return rest;
      });
    }
  };

  const handleExpBand = (label: string) => {
    const band = experienceBands.find((b) => b.label === label);
    if (!band) return;
    setForm((p) => ({ ...p, expBand: label, expMin: band.min, expMax: band.max }));
  };

  const addSkill = (raw: string) => {
    const s = raw.trim().replace(/,$/, "");
    if (!s) return;
    if (form.skills.length >= 20) {
      toast.error("You can add up to 20 skills.");
      return;
    }
    if (form.skills.some((x) => x.toLowerCase() === s.toLowerCase())) return;
    update("skills", [...form.skills, s.slice(0, 50)]);
    setSkillInput("");
  };

  const removeSkill = (s: string) =>
    update("skills", form.skills.filter((x) => x !== s));

  const filteredSuggestions = useMemo(
    () =>
      skillSuggestions
        .filter(
          (s) =>
            !form.skills.some((x) => x.toLowerCase() === s.toLowerCase()) &&
            (skillInput.trim() === "" ||
              s.toLowerCase().includes(skillInput.toLowerCase())),
        )
        .slice(0, 8),
    [skillInput, form.skills],
  );

  const validate = () => {
    const e: Record<string, string> = {};
    if (!form.title.trim()) e.title = "Job title is required";
    if (form.title.length > 200) e.title = "Keep title under 200 characters";
    if (!form.department) e.department = "Select a department";
    if (!form.role.trim()) e.role = "Role is required";
    if (!form.location.trim()) e.location = "Location is required";
    if (!lockedInstitute) e.institute = "Your verified institution is missing";
    if (form.vacancies < 1) e.vacancies = "At least 1 vacancy";
    if (!form.description.trim() && !form.responsibilities.some((r) => r.trim()))
      e.description = "Add a description or at least one responsibility";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!validate()) {
      toast.error("Please fix the highlighted fields.");
      return;
    }
    setLoading(true);
    try {
      // In edit mode, preserve user's raw description verbatim so we don't
      // double-wrap an already-rendered markdown block on every save.
      const hasExtras =
        form.responsibilities.some((r) => r.trim()) ||
        form.qualifications.some((q) => q.trim());
      const description =
        isEditMode && !hasExtras
          ? form.description.trim()
          : buildDescription(form);
      const salary_range = `${form.salaryRange[0]} - ${form.salaryRange[1]} LPA`;

      if (isEditMode && editJobId) {
        // ---- UPDATE existing job ----
        const { error: updErr } = await supabase
          .from("jobs")
          .update({
            title: form.title.trim(),
            location: form.location.trim(),
            description,
            salary_range,
            job_type: form.jobType,
            tags: form.skills.slice(0, 20),
          })
          .eq("id", editJobId);

        if (updErr) {
          toast.error("Couldn't update job", { description: updErr.message });
          return;
        }

        // Diff against snapshot to build change list
        const changes: string[] = [];
        if (originalSnapshot) {
          if (originalSnapshot.title !== form.title.trim())
            changes.push(`Title: "${originalSnapshot.title}" → "${form.title.trim()}"`);
          if (originalSnapshot.location !== form.location.trim())
            changes.push(`Location: "${originalSnapshot.location}" → "${form.location.trim()}"`);
          if (originalSnapshot.salary_range !== salary_range)
            changes.push(`Salary: ${originalSnapshot.salary_range} → ${salary_range}`);
          if (originalSnapshot.job_type !== form.jobType)
            changes.push(`Job type: ${originalSnapshot.job_type} → ${form.jobType}`);
          if (originalSnapshot.description !== description)
            changes.push("Job description updated");
          const oldTags = [...originalSnapshot.tags].sort().join(",");
          const newTags = [...form.skills.slice(0, 20)].sort().join(",");
          if (oldTags !== newTags) changes.push("Skills / tags updated");
        }

        // Notify applicants (only those who applied) via edge function
        try {
          const { data: notifData } = await supabase.functions.invoke(
            "send-job-update-notification",
            { body: { jobId: editJobId, changes } },
          );
          setNotifiedCount((notifData as any)?.notified ?? 0);
        } catch (notifErr) {
          console.error("Notification failed:", notifErr);
        }

        setSuccessOpen(true);
        return;
      }

      // ---- INSERT new job ----
      const { data: insertedJob, error } = await supabase
        .from("jobs")
        .insert({
          title: form.title.trim(),
          institute: lockedInstitute,
          location: form.location.trim(),
          description,
          salary_range,
          job_type: form.jobType,
          tags: form.skills.slice(0, 20),
          created_by: user.id,
        })
        .select("id")
        .single();
      if (error || !insertedJob) {
        toast.error("Couldn't post job", { description: error?.message });
      } else {
        // Add collaborators if any selected
        if (collabEnabled && selectedCollabIds.length > 0) {
          const rows = selectedCollabIds.map((rid) => ({
            job_id: insertedJob.id,
            recruiter_id: rid,
            added_by: user.id,
          }));
          const { error: collabErr } = await supabase
            .from("job_collaborators")
            .insert(rows);
          if (collabErr) {
            toast.warning("Job posted, but some collaborators couldn't be added", {
              description: collabErr.message,
            });
          } else {
            toast.success(
              `Job posted with ${selectedCollabIds.length} collaborator${selectedCollabIds.length > 1 ? "s" : ""}`,
            );
          }
        }
        setSuccessOpen(true);
      }

    } finally {
      setLoading(false);
    }
  };

  const FieldError = ({ name }: { name: string }) =>
    errors[name] ? (
      <p className="flex items-center gap-1.5 text-xs text-destructive mt-1.5">
        <AlertCircle className="h-3.5 w-3.5" />
        {errors[name]}
      </p>
    ) : null;

  // ---------- render ----------
  return (
    <div className="min-h-screen bg-muted/20">
      <RecruiterNavbar />

      <main className="pt-20 pb-32 lg:pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          <Link
            to="/recruiter-dashboard"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-5 transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>

          {/* Page header */}
          <div className="rounded-2xl border border-border bg-gradient-to-br from-card to-muted/40 shadow-sm p-6 sm:p-8 mb-6 flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center shrink-0">
              <ClipboardList className="h-6 w-6 text-primary" strokeWidth={1.75} />
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="font-heading font-bold text-2xl sm:text-3xl text-foreground tracking-tight">
                {isEditMode ? "Edit Job Posting" : "Post a New Job"}
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                {isEditMode
                  ? "Update the listing — applicants who already applied will be notified of the changes."
                  : "Create a detailed, professional listing to attract the right candidates."}
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {/* 1. Basic Information */}
            <SectionCard
              icon={Briefcase}
              title="Basic Information"
              subtitle="The essentials candidates see first"
            >
              <div className="space-y-1.5">
                <Label htmlFor="title">Job Title *</Label>
                <Input
                  id="title"
                  placeholder="e.g., Assistant Professor of Computer Science"
                  value={form.title}
                  onChange={(e) => update("title", e.target.value)}
                  className={cn("h-11", errors.title && "border-destructive")}
                />
                <FieldError name="title" />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="department">Department / Subcategory *</Label>
                  <Select
                    value={form.department}
                    onValueChange={(v) => update("department", v)}
                  >
                    <SelectTrigger
                      id="department"
                      className={cn("h-11 bg-popover", errors.department && "border-destructive")}
                    >
                      <SelectValue placeholder="Select department" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {departments.map((d) => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError name="department" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="role">Role *</Label>
                  <Input
                    id="role"
                    placeholder="e.g., Faculty, Engineer, Manager"
                    value={form.role}
                    onChange={(e) => update("role", e.target.value)}
                    className={cn("h-11", errors.role && "border-destructive")}
                  />
                  <FieldError name="role" />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="location" className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                    Job Location *
                  </Label>
                  <Input
                    id="location"
                    placeholder="e.g., Bengaluru, Karnataka"
                    value={form.location}
                    onChange={(e) => update("location", e.target.value)}
                    className={cn("h-11", errors.location && "border-destructive")}
                  />
                  <FieldError name="location" />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="jobType">Job Type</Label>
                  <Select value={form.jobType} onValueChange={(v) => update("jobType", v)}>
                    <SelectTrigger id="jobType" className="h-11 bg-popover">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {jobTypes.map((t) => (
                        <SelectItem key={t} value={t}>{t}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </SectionCard>

            {/* 2. Work Experience */}
            <SectionCard
              icon={GraduationCap}
              title="Work Experience"
              subtitle="Set the experience level you're hiring for"
            >
              <div className="flex flex-wrap gap-2">
                {experienceBands.map((b) => {
                  const active = form.expBand === b.label;
                  return (
                    <button
                      key={b.label}
                      type="button"
                      onClick={() => handleExpBand(b.label)}
                      className={cn(
                        "px-4 h-10 rounded-full border text-sm font-medium transition-all",
                        active
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background border-border text-foreground hover:border-primary/50 hover:bg-muted",
                      )}
                    >
                      {b.label}
                    </button>
                  );
                })}
              </div>

              <div className="grid grid-cols-2 gap-4 pt-2">
                <div className="space-y-1.5">
                  <Label htmlFor="expMin">Minimum (years)</Label>
                  <Input
                    id="expMin"
                    type="number"
                    min={0}
                    max={50}
                    value={form.expMin}
                    onChange={(e) =>
                      update("expMin", Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="expMax">Maximum (years)</Label>
                  <Input
                    id="expMax"
                    type="number"
                    min={0}
                    max={50}
                    value={form.expMax}
                    onChange={(e) =>
                      update("expMax", Math.max(0, parseInt(e.target.value) || 0))
                    }
                    className="h-11"
                  />
                </div>
              </div>
            </SectionCard>

            {/* 3. Compensation */}
            <SectionCard
              icon={IndianRupee}
              title="Compensation"
              subtitle="Help candidates self-qualify with a clear range"
            >
              <div className="rounded-xl border border-border bg-muted/30 p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-sm font-medium">Annual Salary Range</Label>
                  <span className="text-sm font-semibold text-primary tabular-nums">
                    ₹ {form.salaryRange[0]} – {form.salaryRange[1]} LPA
                  </span>
                </div>
                <Slider
                  min={SALARY_MIN}
                  max={SALARY_MAX}
                  step={1}
                  value={form.salaryRange}
                  onValueChange={(v) =>
                    update("salaryRange", [v[0], v[1]] as [number, number])
                  }
                  className="py-2"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>₹ {SALARY_MIN} LPA</span>
                  <span>₹ {SALARY_MAX}+ LPA</span>
                </div>
              </div>
            </SectionCard>

            {/* 4. Job Description */}
            <SectionCard
              icon={FileText}
              title="Job Description"
              subtitle="Structured details candidates can scan quickly"
            >
              <div className="space-y-1.5">
                <Label htmlFor="description">Overview</Label>
                <Textarea
                  id="description"
                  placeholder="Briefly describe the role, team, and impact..."
                  value={form.description}
                  onChange={(e) => update("description", e.target.value)}
                  rows={5}
                  className={cn(errors.description && "border-destructive")}
                />
                <div className="flex justify-between items-center">
                  <FieldError name="description" />
                  <p className="text-xs text-muted-foreground ml-auto">
                    {form.description.length}/5000
                  </p>
                </div>
              </div>

              <BulletEditor
                label="Responsibilities"
                placeholder="e.g., Lead curriculum design for the CS department"
                items={form.responsibilities}
                onChange={(items) => update("responsibilities", items)}
              />

              <BulletEditor
                label="Qualifications"
                placeholder="e.g., PhD in Computer Science or equivalent"
                items={form.qualifications}
                onChange={(items) => update("qualifications", items)}
              />
            </SectionCard>

            {/* 5. Vacancies */}
            <SectionCard
              icon={Users}
              title="Vacancies"
              subtitle="How many candidates are you hiring?"
            >
              <div className="flex items-center gap-3">
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() =>
                    update("vacancies", Math.max(1, form.vacancies - 1))
                  }
                >
                  <span className="text-lg">−</span>
                </Button>
                <Input
                  type="number"
                  min={1}
                  value={form.vacancies}
                  onChange={(e) =>
                    update("vacancies", Math.max(1, parseInt(e.target.value) || 1))
                  }
                  className="h-11 w-24 text-center text-lg font-semibold"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  className="h-11 w-11"
                  onClick={() => update("vacancies", form.vacancies + 1)}
                >
                  <Plus className="h-4 w-4" />
                </Button>
                <span className="text-sm text-muted-foreground ml-1">
                  {form.vacancies === 1 ? "vacancy" : "vacancies"}
                </span>
              </div>
              <FieldError name="vacancies" />
            </SectionCard>

            {/* 6. Skills */}
            <SectionCard
              icon={Sparkles}
              title="Skills Required"
              subtitle="Add up to 20 skills candidates should have"
            >
              <div
                className="flex flex-wrap items-center gap-2 min-h-[48px] rounded-md border border-input bg-background p-2 focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 focus-within:ring-offset-background"
                onClick={() => document.getElementById("skillInput")?.focus()}
              >
                {form.skills.map((s) => (
                  <Badge
                    key={s}
                    variant="secondary"
                    className="h-7 px-2.5 gap-1 text-xs font-medium"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => removeSkill(s)}
                      className="ml-0.5 rounded-sm hover:bg-background/60 p-0.5"
                      aria-label={`Remove ${s}`}
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
                <input
                  id="skillInput"
                  value={skillInput}
                  onChange={(e) => setSkillInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" || e.key === ",") {
                      e.preventDefault();
                      addSkill(skillInput);
                    } else if (e.key === "Backspace" && !skillInput && form.skills.length) {
                      removeSkill(form.skills[form.skills.length - 1]);
                    }
                  }}
                  placeholder={form.skills.length ? "" : "Type a skill and press Enter…"}
                  className="flex-1 min-w-[140px] bg-transparent outline-none text-sm px-1 py-1"
                />
              </div>

              {filteredSuggestions.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs text-muted-foreground w-full">Suggestions</span>
                  {filteredSuggestions.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => addSkill(s)}
                      className="text-xs px-2.5 h-7 rounded-full border border-dashed border-border text-muted-foreground hover:text-foreground hover:border-primary/50 hover:bg-muted transition-colors inline-flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" />
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </SectionCard>

            {/* 7. Company Profile */}
            <SectionCard
              icon={Building2}
              title="Institute / Company Profile"
              subtitle="Help candidates understand who they'd be joining"
            >
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  Institute / Organisation
                  {lockedInstitute && <Lock className="h-3.5 w-3.5 text-muted-foreground" />}
                </Label>
                <Input
                  value={lockedInstitute}
                  readOnly
                  disabled
                  placeholder="Your verified institution will appear here"
                  className="h-11 bg-muted/60 cursor-not-allowed font-medium text-foreground"
                />
                {lockedInstitute ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-1">
                    <Lock className="h-3 w-3" />
                    Locked to your verified institution. Contact support to change this.
                  </p>
                ) : (
                  <FieldError name="institute" />
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="about">About</Label>
                <Textarea
                  id="about"
                  placeholder="A short introduction to your organisation, mission, and culture…"
                  value={form.companyAbout}
                  onChange={(e) => update("companyAbout", e.target.value)}
                  rows={4}
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="website">Website URL</Label>
                  <Input
                    id="website"
                    type="url"
                    placeholder="https://example.edu"
                    value={form.companyWebsite}
                    onChange={(e) => update("companyWebsite", e.target.value)}
                    className="h-11"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="size">Organisation Size</Label>
                  <Select value={form.companySize} onValueChange={(v) => update("companySize", v)}>
                    <SelectTrigger id="size" className="h-11 bg-popover">
                      <SelectValue placeholder="Select size" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      {orgSizes.map((s) => (
                        <SelectItem key={s} value={s}>{s} employees</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="hq">Location</Label>
                  <Input
                    id="hq"
                    placeholder="e.g., New Delhi, India"
                    value={form.companyLocation}
                    onChange={(e) => update("companyLocation", e.target.value)}
                    className="h-11"
                  />
                </div>
              </div>
            </SectionCard>

            {/* 8. Team & Collaboration */}
            <SectionCard
              icon={UserPlus}
              title="Team & Collaboration"
              subtitle="Optionally co-manage this posting with colleagues from your institution"
            >
              <label className="flex items-start gap-3 p-4 rounded-xl border border-border hover:bg-muted/30 cursor-pointer transition-colors">
                <Checkbox
                  checked={collabEnabled}
                  onCheckedChange={(v) => {
                    const next = !!v;
                    setCollabEnabled(next);
                    if (!next) setSelectedCollabIds([]);
                  }}
                  className="mt-0.5"
                />
                <div className="flex-1">
                  <p className="font-medium text-sm text-foreground">
                    Collaborate with teammates on this job
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Selected teammates from <span className="font-medium text-foreground">{lockedInstitute || "your institution"}</span> can view applications, schedule interviews, and update statuses for this posting.
                  </p>
                </div>
              </label>

              {collabEnabled && (
                <div className="space-y-3 pt-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search teammates by name or designation…"
                      value={collabSearch}
                      onChange={(e) => setCollabSearch(e.target.value)}
                      className="h-10 pl-9"
                    />
                  </div>

                  {colleaguesLoading ? (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground py-6 justify-center">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Loading teammates…
                    </div>
                  ) : colleagues.length === 0 ? (
                    <div className="text-center py-6 px-4 rounded-xl border border-dashed border-border bg-muted/20">
                      <Users className="h-6 w-6 text-muted-foreground mx-auto mb-2" />
                      <p className="text-sm font-medium text-foreground">No teammates found yet</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Other verified recruiters from {lockedInstitute} will appear here once they join.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-80 overflow-y-auto rounded-xl border border-border divide-y divide-border">
                        {filteredColleagues.map((c) => {
                          const checked = selectedCollabIds.includes(c.id);
                          const initials =
                            (c.full_name ?? "?")
                              .split(" ")
                              .map((w) => w[0])
                              .slice(0, 2)
                              .join("")
                              .toUpperCase();
                          return (
                            <button
                              key={c.id}
                              type="button"
                              onClick={() => toggleCollab(c.id)}
                              className={cn(
                                "w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-muted/40",
                                checked && "bg-primary/5",
                              )}
                            >
                              <Checkbox checked={checked} className="pointer-events-none" />
                              <Avatar className="h-9 w-9">
                                <AvatarImage src={c.avatar_url ?? undefined} />
                                <AvatarFallback className="text-xs">{initials}</AvatarFallback>
                              </Avatar>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-foreground truncate">
                                  {c.full_name ?? "Unnamed recruiter"}
                                </p>
                                {c.designation && (
                                  <p className="text-xs text-muted-foreground truncate">
                                    {c.designation}
                                  </p>
                                )}
                              </div>
                            </button>
                          );
                        })}
                        {filteredColleagues.length === 0 && (
                          <p className="text-sm text-muted-foreground text-center py-6">
                            No teammates match "{collabSearch}"
                          </p>
                        )}
                      </div>
                      {selectedCollabIds.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                          {selectedCollabIds.length} teammate{selectedCollabIds.length > 1 ? "s" : ""} selected
                        </p>
                      )}
                    </>
                  )}
                </div>
              )}
            </SectionCard>
          </form>

        </div>
      </main>

      {/* Sticky bottom actions */}
      <div className="fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80 shadow-[0_-4px_24px_-12px_rgba(0,0,0,0.15)]">
        <div className="container mx-auto px-4 max-w-4xl py-3 flex flex-col-reverse sm:flex-row gap-2 sm:gap-3 sm:items-center sm:justify-end">
          <Button
            type="button"
            variant="outline"
            className="h-11 sm:min-w-[140px]"
            onClick={() => navigate("/recruiter-dashboard")}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="secondary"
            className="h-11 sm:min-w-[160px]"
            onClick={() => setPreviewOpen(true)}
          >
            <Eye className="h-4 w-4 mr-2" />
            Preview Job
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="h-11 sm:min-w-[160px] font-semibold"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {isEditMode ? "Saving…" : "Posting…"}
              </>
            ) : (
              isEditMode ? "Save Changes" : "Post Job"
            )}
          </Button>
        </div>
      </div>

      {/* Preview dialog */}
      <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
        <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading text-2xl">
              {form.title || "Untitled Role"}
            </DialogTitle>
            <DialogDescription className="flex flex-wrap gap-2 pt-2">
              <Badge variant="secondary">{lockedInstitute || "Your Institution"}</Badge>
              {form.location && <Badge variant="outline">{form.location}</Badge>}
              <Badge variant="outline">{form.jobType}</Badge>
              <Badge variant="outline">{form.expBand}</Badge>
              <Badge variant="outline">
                ₹ {form.salaryRange[0]}–{form.salaryRange[1]} LPA
              </Badge>
              <Badge variant="outline">
                {form.vacancies} {form.vacancies === 1 ? "vacancy" : "vacancies"}
              </Badge>
            </DialogDescription>
          </DialogHeader>
          <div className="prose prose-sm max-w-none whitespace-pre-wrap text-sm text-foreground">
            {buildDescription(form) || (
              <p className="text-muted-foreground italic">
                Add a description, responsibilities, or qualifications to see the preview.
              </p>
            )}
          </div>
          {form.skills.length > 0 && (
            <div>
              <p className="text-sm font-semibold mb-2">Skills</p>
              <div className="flex flex-wrap gap-1.5">
                {form.skills.map((s) => (
                  <Badge key={s} variant="secondary">{s}</Badge>
                ))}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setPreviewOpen(false)}>
              Close Preview
            </Button>
            <Button
              onClick={() => {
                setPreviewOpen(false);
                handleSubmit({ preventDefault: () => {} } as React.FormEvent);
              }}
            >
              {isEditMode ? "Looks good — Save Changes" : "Looks good — Post Job"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Success dialog */}
      <Dialog open={successOpen} onOpenChange={setSuccessOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="mx-auto w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center mb-2">
              <CheckCircle2 className="h-8 w-8 text-primary" />
            </div>
            <DialogTitle className="text-center font-heading text-2xl">
              {isEditMode ? "Job updated successfully" : "Job posted successfully"}
            </DialogTitle>
            <DialogDescription className="text-center">
              {isEditMode
                ? notifiedCount > 0
                  ? `Your changes are live. We notified ${notifiedCount} applicant${notifiedCount === 1 ? "" : "s"} who already applied.`
                  : "Your changes are live. No applicants needed to be notified yet."
                : "Your listing is live and candidates can start applying right away."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="sm:justify-center gap-2">
            {!isEditMode && (
              <Button
                variant="outline"
                onClick={() => {
                  setForm(initialState);
                  setSuccessOpen(false);
                }}
              >
                Post another
              </Button>
            )}
            <Button onClick={() => navigate("/recruiter-dashboard")}>
              Go to dashboard
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

// ---------- bullet editor ----------
const BulletEditor = ({
  label,
  placeholder,
  items,
  onChange,
}: {
  label: string;
  placeholder: string;
  items: string[];
  onChange: (items: string[]) => void;
}) => {
  const set = (i: number, v: string) => {
    const next = [...items];
    next[i] = v;
    onChange(next);
  };
  const add = () => onChange([...items, ""]);
  const remove = (i: number) => {
    if (items.length === 1) {
      onChange([""]);
      return;
    }
    onChange(items.filter((_, idx) => idx !== i));
  };
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="space-y-2">
        {items.map((item, i) => (
          <div key={i} className="flex items-start gap-2">
            <div className="mt-3 w-1.5 h-1.5 rounded-full bg-primary/60 shrink-0" />
            <Input
              value={item}
              onChange={(e) => set(i, e.target.value)}
              placeholder={placeholder}
              className="h-11"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-11 w-9 text-muted-foreground hover:text-destructive shrink-0"
              onClick={() => remove(i)}
              aria-label="Remove item"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={add}
        className="text-primary hover:text-primary hover:bg-primary/10 -ml-2"
      >
        <Plus className="h-4 w-4 mr-1" />
        Add {label.toLowerCase().replace(/s$/, "")}
      </Button>
    </div>
  );
};

export default PostJob;
