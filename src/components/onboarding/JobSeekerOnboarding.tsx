import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import {
  Sparkles,
  Upload,
  FileText,
  PenLine,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  User,
  GraduationCap,
  Briefcase,
  Loader2,
  Rocket,
  BookOpen,
  MapPin,
  Building2,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface JobSeekerOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userName?: string | null;
  onChooseResume: () => void;
  onChooseManual: () => void;
  onSaveBasicInfo: (data: {
    full_name: string;
    role: string;
    university: string;
    location: string;
  }) => Promise<void>;
  onComplete: () => void;
}

const STEPS = [
  { id: "welcome", label: "Welcome" },
  { id: "basic", label: "Basic Info" },
  { id: "method", label: "Profile Method" },
  { id: "guide", label: "Dashboard Guide" },
  { id: "ready", label: "Ready!" },
];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 80 : -80,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -80 : 80,
    opacity: 0,
  }),
};

const GUIDE_TABS = [
  {
    icon: User,
    title: "Overview Tab",
    description: "Your profile summary, completion tracker, AI salary insights and resume upload — all in one glance.",
    color: "text-blue-500",
    bg: "bg-blue-500/10",
  },
  {
    icon: Briefcase,
    title: "Experience Tab",
    description: "Add your work history with titles, companies and dates. Click '+' to add entries.",
    color: "text-emerald-500",
    bg: "bg-emerald-500/10",
  },
  {
    icon: BookOpen,
    title: "Research Tab",
    description: "Import publications from Scopus/ORCID or add manually. Track citations and h-index.",
    color: "text-purple-500",
    bg: "bg-purple-500/10",
  },
  {
    icon: GraduationCap,
    title: "Achievements & Personal",
    description: "Showcase awards, certifications, hobbies, and personal details that make you stand out.",
    color: "text-amber-500",
    bg: "bg-amber-500/10",
  },
];

export const JobSeekerOnboarding = ({
  open,
  onOpenChange,
  userName,
  onChooseResume,
  onChooseManual,
  onSaveBasicInfo,
  onComplete,
}: JobSeekerOnboardingProps) => {
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [saving, setSaving] = useState(false);
  const [basicInfo, setBasicInfo] = useState({
    full_name: userName || "",
    role: "",
    university: "",
    location: "",
  });

  const progress = ((step + 1) / STEPS.length) * 100;

  const goNext = () => {
    setDirection(1);
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const goBack = () => {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSaveBasic = async () => {
    if (!basicInfo.full_name.trim()) return;
    setSaving(true);
    try {
      await onSaveBasicInfo(basicInfo);
      goNext();
    } catch {
      // toast handled externally
    } finally {
      setSaving(false);
    }
  };

  const handleResumeChoice = () => {
    onChooseResume();
    onComplete();
    onOpenChange(false);
  };

  const handleManualChoice = () => {
    onChooseManual();
    goNext();
  };

  const handleFinish = () => {
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border/50 gap-0">
        {/* Progress bar */}
        <div className="px-6 pt-5 pb-3">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-medium text-muted-foreground">
              Step {step + 1} of {STEPS.length}
            </p>
            <p className="text-xs font-medium text-primary">
              {Math.round(progress)}%
            </p>
          </div>
          <Progress value={progress} className="h-1.5" />
        </div>

        {/* Content area */}
        <div className="px-6 pb-6 min-h-[380px] flex flex-col">
          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.25, ease: "easeInOut" }}
              className="flex-1 flex flex-col"
            >
              {/* Step 0: Welcome */}
              {step === 0 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-5">
                    <Rocket className="h-8 w-8 text-primary" />
                  </div>
                  <h2 className="text-xl font-bold font-heading text-foreground mb-2">
                    Welcome to Your Dashboard!
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-sm mb-2">
                    Let's set up your profile so recruiters can discover you and match you with the perfect opportunities.
                  </p>
                  <p className="text-xs text-muted-foreground/70 mb-6">
                    This takes about 2 minutes
                  </p>
                  <div className="flex flex-col sm:flex-row gap-3 w-full max-w-sm">
                    <Button onClick={goNext} className="flex-1 gap-2">
                      <Sparkles className="h-4 w-4" /> Guide Me Through
                    </Button>
                    <Button variant="outline" onClick={handleFinish} className="flex-1 gap-2">
                      I'll Explore on My Own
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 1: Basic Info */}
              {step === 1 && (
                <div className="flex-1 flex flex-col py-2">
                  <div className="flex items-center gap-3 mb-5">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold font-heading text-foreground">
                        Tell us about yourself
                      </h2>
                      <p className="text-xs text-muted-foreground">
                        Basic details to get your profile started
                      </p>
                    </div>
                  </div>
                  <div className="space-y-4 flex-1">
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-name" className="text-sm">Full Name *</Label>
                      <Input
                        id="ob-name"
                        value={basicInfo.full_name}
                        onChange={(e) => setBasicInfo({ ...basicInfo, full_name: e.target.value })}
                        placeholder="Dr. Jane Smith"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-role" className="text-sm flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-muted-foreground" /> Current Role / Title
                      </Label>
                      <Input
                        id="ob-role"
                        value={basicInfo.role}
                        onChange={(e) => setBasicInfo({ ...basicInfo, role: e.target.value })}
                        placeholder="Assistant Professor of Physics"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-uni" className="text-sm flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 text-muted-foreground" /> University / Institution
                      </Label>
                      <Input
                        id="ob-uni"
                        value={basicInfo.university}
                        onChange={(e) => setBasicInfo({ ...basicInfo, university: e.target.value })}
                        placeholder="Indian Institute of Science"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="ob-loc" className="text-sm flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-muted-foreground" /> Location
                      </Label>
                      <Input
                        id="ob-loc"
                        value={basicInfo.location}
                        onChange={(e) => setBasicInfo({ ...basicInfo, location: e.target.value })}
                        placeholder="Bangalore, India"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 mt-5">
                    <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                    <Button
                      size="sm"
                      className="flex-1 gap-1.5"
                      onClick={handleSaveBasic}
                      disabled={!basicInfo.full_name.trim() || saving}
                    >
                      {saving ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Save & Continue <ArrowRight className="h-3.5 w-3.5" /></>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 2: Choose Method */}
              {step === 2 && (
                <div className="flex-1 flex flex-col py-2">
                  <div className="text-center mb-6">
                    <h2 className="text-lg font-bold font-heading text-foreground mb-1">
                      How would you like to build your profile?
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Choose the fastest way to complete your profile
                    </p>
                  </div>
                  <div className="space-y-3 flex-1">
                    {/* Resume option */}
                    <button
                      onClick={handleResumeChoice}
                      className="w-full p-4 rounded-xl border-2 border-primary/30 bg-primary/5 hover:border-primary hover:bg-primary/10 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center shrink-0 group-hover:bg-primary/25 transition-colors">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-0.5">
                            <p className="font-semibold text-foreground text-sm">
                              Upload Resume
                            </p>
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-semibold">
                              <Sparkles className="h-3 w-3" /> Recommended
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            AI will automatically extract your name, experience, education, skills and more from your resume.
                          </p>
                        </div>
                      </div>
                    </button>

                    {/* Manual option */}
                    <button
                      onClick={handleManualChoice}
                      className="w-full p-4 rounded-xl border-2 border-border hover:border-foreground/30 hover:bg-secondary/50 transition-all text-left group"
                    >
                      <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center shrink-0 group-hover:bg-secondary/80 transition-colors">
                          <PenLine className="h-5 w-5 text-muted-foreground" />
                        </div>
                        <div>
                          <p className="font-semibold text-foreground text-sm mb-0.5">
                            Fill in Manually
                          </p>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            Add your details step by step. We'll guide you through each section of your profile.
                          </p>
                        </div>
                      </div>
                    </button>
                  </div>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 3: Dashboard Guide */}
              {step === 3 && (
                <div className="flex-1 flex flex-col py-2">
                  <div className="text-center mb-4">
                    <h2 className="text-lg font-bold font-heading text-foreground mb-1">
                      Your Dashboard, Explained
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      Here's where to add and manage your information
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 flex-1">
                    {GUIDE_TABS.map((tab) => (
                      <div
                        key={tab.title}
                        className="p-3 rounded-xl border border-border/60 bg-card hover:shadow-sm transition-shadow"
                      >
                        <div className="flex items-center gap-2.5 mb-1.5">
                          <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center", tab.bg)}>
                            <tab.icon className={cn("h-4 w-4", tab.color)} />
                          </div>
                          <p className="font-semibold text-sm text-foreground">{tab.title}</p>
                        </div>
                        <p className="text-xs text-muted-foreground leading-relaxed pl-[42px]">
                          {tab.description}
                        </p>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-3 mt-4">
                    <Button variant="outline" size="sm" onClick={goBack} className="gap-1.5">
                      <ArrowLeft className="h-3.5 w-3.5" /> Back
                    </Button>
                    <Button size="sm" className="flex-1 gap-1.5" onClick={goNext}>
                      Got it! <ArrowRight className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Step 4: Ready */}
              {step === 4 && (
                <div className="flex-1 flex flex-col items-center justify-center text-center py-4">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 200, damping: 12 }}
                    className="w-16 h-16 rounded-full bg-green-500/15 flex items-center justify-center mb-5"
                  >
                    <CheckCircle2 className="h-9 w-9 text-green-500" />
                  </motion.div>
                  <h2 className="text-xl font-bold font-heading text-foreground mb-2">
                    You're All Set!
                  </h2>
                  <p className="text-sm text-muted-foreground max-w-xs mb-1">
                    Your profile is ready to go. Complete more sections to increase your visibility to recruiters.
                  </p>
                  <p className="text-xs text-primary font-medium mb-6">
                    Tip: A 100% complete profile gets 5× more recruiter views
                  </p>
                  <Button onClick={handleFinish} className="gap-2 px-8">
                    <Sparkles className="h-4 w-4" /> Explore Dashboard
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default JobSeekerOnboarding;
