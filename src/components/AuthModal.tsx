import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  User,
  Briefcase,
  Mail,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  Loader2,
  Building2,
  GraduationCap,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
  CheckCircle2,
} from "lucide-react";
import owlMascot from "@/assets/owl-mascot.png";


interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "login" | "signup";
  defaultRole?: "candidate" | "recruiter";
}

const candidateBenefits = [
  { icon: GraduationCap, text: "Faculty & research roles from IITs, IIMs, top universities" },
  { icon: Sparkles, text: "AI resume parsing & smart job matches in seconds" },
  { icon: ShieldCheck, text: "Verified recruiters only — no spam, no scams" },
];

const recruiterBenefits = [
  { icon: Search, text: "Search 50+ academic criteria — Naukri Resdex style" },
  { icon: Users, text: "Access verified Job Seekers with research metrics" },
  { icon: ShieldCheck, text: "Institution-verified profile builds candidate trust" },
];

const getPasswordStrength = (pwd: string) => {
  if (!pwd) return { score: 0, label: "", color: "" };
  let score = 0;
  if (pwd.length >= 6) score++;
  if (pwd.length >= 10) score++;
  if (/[A-Z]/.test(pwd) && /[a-z]/.test(pwd)) score++;
  if (/\d/.test(pwd) && /[^A-Za-z0-9]/.test(pwd)) score++;
  const labels = ["Too short", "Weak", "Okay", "Strong", "Excellent"];
  const colors = ["bg-destructive", "bg-destructive", "bg-warning", "bg-info", "bg-success"];
  return { score, label: labels[score], color: colors[score] };
};

const AuthModal = ({
  open,
  onOpenChange,
  defaultMode = "login",
  defaultRole = "candidate",
}: AuthModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [role, setRole] = useState<"candidate" | "recruiter">(defaultRole);
  const [step, setStep] = useState<"role" | "form">(defaultMode === "login" ? "form" : "role");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // Sync internal state whenever the modal is (re)opened with new defaults
  useEffect(() => {
    if (!open) return;
    setMode(defaultMode);
    setRole(defaultRole);
    setStep(defaultMode === "login" ? "form" : "role");
  }, [open, defaultMode, defaultRole]);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
    institutionName: "",
    designation: "",
  });

  const pwdStrength = useMemo(() => getPasswordStrength(formData.password), [formData.password]);
  const benefits = role === "candidate" ? candidateBenefits : recruiterBenefits;

  const handleRoleSelect = (selectedRole: "candidate" | "recruiter") => {
    setRole(selectedRole);
    setStep("form");
  };

  const switchMode = (next: "login" | "signup") => {
    setMode(next);
    setStep(next === "login" ? "form" : "role");
  };

  const redirectBasedOnRole = async (userId: string, selectedRole?: string, isNewSignup?: boolean) => {
    if (selectedRole) {
      navigate(selectedRole === "recruiter" ? "/recruiter-dashboard" : "/candidate-dashboard");
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .maybeSingle();
    navigate(profile?.user_type === "recruiter" ? "/recruiter-dashboard" : "/candidate-dashboard");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: formData.email,
          password: formData.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: formData.fullName,
              user_type: role,
              ...(role === "recruiter" && formData.institutionName ? { institution_name: formData.institutionName } : {}),
              ...(role === "recruiter" && formData.designation ? { designation: formData.designation } : {}),
            },
          },
        });
        if (error) throw error;
        if (role === "recruiter" && data.user) {
          const updates: Record<string, string> = {};
          if (formData.institutionName) updates.university = formData.institutionName;
          if (formData.designation) updates.designation = formData.designation;
          if (Object.keys(updates).length > 0) {
            await supabase.from("profiles").update(updates).eq("id", data.user.id);
          }
        }
        toast({
          title: "Account created!",
          description: role === "recruiter" ? "Your account is pending admin approval." : "Welcome to OWL ROLES!",
        });
        onOpenChange(false);
        if (data.user) redirectBasedOnRole(data.user.id, role, true);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });
        if (error) throw error;
        toast({ title: "Welcome back!", description: "You have been logged in successfully." });
        onOpenChange(false);
        if (data.user) redirectBasedOnRole(data.user.id);
      }
    } catch (error: any) {
      const message = error.message === "Failed to fetch"
        ? "Network error. Please check your internet connection and try again."
        : error.message;
      toast({ title: "Error", description: message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep(mode === "login" ? "form" : "role");
    setFormData({ email: "", password: "", fullName: "", phone: "", institutionName: "", designation: "" });
  };

  const showBenefitsPanel = mode === "signup" && step === "form";

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetModal(); }}>
      <DialogContent
        className={`p-0 overflow-hidden bg-card border-border/60 max-h-[92vh] flex flex-col ${
          showBenefitsPanel ? "sm:max-w-[880px]" : "sm:max-w-[460px]"
        }`}
      >
        <div className={`grid flex-1 min-h-0 ${showBenefitsPanel ? "md:grid-cols-[1fr_400px]" : "grid-cols-1"} overflow-hidden`}>
          {/* Benefits panel (signup only) */}
          {showBenefitsPanel && (
            <div className="hidden md:flex flex-col justify-between p-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground relative overflow-hidden">
              {/* decorative blobs */}
              <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-primary-foreground/10 blur-3xl" />
              <div className="absolute -bottom-24 -right-16 w-72 h-72 rounded-full bg-primary-foreground/10 blur-3xl" />

              <div className="relative">
                <div className="w-12 h-12 rounded-xl bg-primary-foreground/15 backdrop-blur flex items-center justify-center mb-6">
                  <span className="font-heading font-bold text-xl">O</span>
                </div>
                <h3 className="font-heading font-bold text-2xl tracking-tight leading-tight mb-2">
                  {role === "candidate" ? "Your next academic chapter starts here." : "Hire educators & researchers, faster."}
                </h3>
                <p className="text-primary-foreground/80 text-sm leading-relaxed">
                  {role === "candidate"
                    ? "Join thousands of Job Seekers landing roles at India's top institutions."
                    : "Trusted by leading universities and research institutions across India."}
                </p>
              </div>

              {/* Animated owl mascot */}
              <motion.div
                className="relative flex justify-center my-6"
                animate={{ y: [0, -10, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <motion.img
                  src={owlMascot}
                  alt="OWL ROLES mascot"
                  width={180}
                  height={180}
                  loading="lazy"
                  className="w-44 h-44 drop-shadow-2xl"
                  animate={{ rotate: [-2, 2, -2] }}
                  transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                />
              </motion.div>

              <ul className="space-y-3 relative">
                {benefits.map(({ icon: Icon, text }, i) => (
                  <li key={i} className="flex gap-3 items-start">
                    <div className="w-7 h-7 rounded-lg bg-primary-foreground/15 backdrop-blur shrink-0 flex items-center justify-center">
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[13px] leading-relaxed text-primary-foreground/95">{text}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Right side: auth content — scrollable */}
          <div className="p-6 sm:p-8 overflow-y-auto">

            <AnimatePresence mode="wait">
              {step === "role" ? (
                <motion.div
                  key="role-select"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="text-center mb-7">
                    <div className="w-14 h-14 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4 shadow-lg shadow-primary/25">
                      <span className="text-primary-foreground font-heading font-bold text-xl">O</span>
                    </div>
                    <h2 className="font-heading text-2xl font-bold text-foreground tracking-tight">
                      {mode === "login" ? "Welcome back" : "Join OWL ROLES"}
                    </h2>
                    <p className="text-muted-foreground mt-1.5 text-sm">
                      {mode === "login" ? "Select your account type" : "How will you use OWL ROLES?"}
                    </p>
                  </div>

                  <div className="grid gap-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleRoleSelect("candidate")}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/[0.03] bg-background transition-all group text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                        <User className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-foreground text-[15px] leading-tight">I'm a Job Seeker</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Faculty, research & teaching roles</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </motion.button>

                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.99 }}
                      onClick={() => handleRoleSelect("recruiter")}
                      className="flex items-center gap-4 p-4 rounded-xl border border-border hover:border-primary hover:bg-primary/[0.03] bg-background transition-all group text-left"
                    >
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/15 transition-colors shrink-0">
                        <Briefcase className="w-5 h-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-heading font-semibold text-foreground text-[15px] leading-tight">I'm a Recruiter</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">Post jobs & find top academic talent</p>
                      </div>
                      <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </motion.button>
                  </div>

                  <div className="mt-6 text-center text-sm">
                    <span className="text-muted-foreground">
                      {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <button
                      onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                      className="font-semibold text-primary hover:underline"
                    >
                      {mode === "login" ? "Sign up" : "Sign in"}
                    </button>
                  </div>
                </motion.div>
              ) : (
                <motion.div
                  key="auth-form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.2 }}
                >
                  {mode === "signup" && (
                    <button
                      onClick={() => setStep("role")}
                      className="text-xs text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
                    >
                      ← Change role
                    </button>
                  )}

                  <div className="mb-6">
                    {mode === "signup" && (
                      <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-3">
                        {role === "candidate" ? <User className="w-3 h-3" /> : <Briefcase className="w-3 h-3" />}
                        {role === "candidate" ? "Job Seeker" : "Recruiter"}
                      </div>
                    )}
                    <h2 className="font-heading text-2xl font-bold text-foreground tracking-tight leading-tight">
                      {mode === "login" ? "Welcome back" : "Create your account"}
                    </h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      {mode === "login"
                        ? "Enter your email and password to continue"
                        : role === "recruiter"
                          ? "We'll verify your institution before activation"
                          : "It takes less than a minute"}
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-3.5">
                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="fullName" className="text-xs font-medium">Full Name</Label>
                        <Input
                          id="fullName"
                          placeholder={role === "recruiter" ? "Dr. Jane Smith" : "Your full name"}
                          value={formData.fullName}
                          onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                          required
                          className="h-11"
                        />
                      </div>
                    )}

                    <div className="space-y-1.5">
                      <Label htmlFor="email" className="text-xs font-medium">
                        {role === "recruiter" && mode === "signup" ? "Institutional Email" : "Email"}
                      </Label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="email"
                          type="email"
                          placeholder={role === "recruiter" && mode === "signup" ? "you@university.edu" : "you@example.com"}
                          className="pl-10 h-11"
                          value={formData.email}
                          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <Label htmlFor="password" className="text-xs font-medium">Password</Label>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          id="password"
                          type={showPassword ? "text" : "password"}
                          placeholder={mode === "signup" ? "Min. 6 characters" : "Your password"}
                          className="pl-10 pr-10 h-11"
                          value={formData.password}
                          onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                          required
                          minLength={6}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                        >
                          {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      {mode === "signup" && formData.password && (
                        <div className="flex items-center gap-2 pt-1">
                          <div className="flex-1 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className={`h-full transition-all ${pwdStrength.color}`}
                              style={{ width: `${(pwdStrength.score / 4) * 100}%` }}
                            />
                          </div>
                          <span className="text-[11px] text-muted-foreground font-medium w-16 text-right">{pwdStrength.label}</span>
                        </div>
                      )}
                    </div>

                    {mode === "signup" && role === "recruiter" && (
                      <>
                        <div className="space-y-1.5">
                          <Label htmlFor="institutionName" className="text-xs font-medium">Institution / University</Label>
                          <div className="relative">
                            <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="institutionName"
                              placeholder="e.g. IIT Delhi, ABC Consultancy"
                              className="pl-10 h-11"
                              value={formData.institutionName}
                              onChange={(e) => setFormData({ ...formData, institutionName: e.target.value })}
                              required
                            />
                          </div>
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="designation" className="text-xs font-medium">Your Designation</Label>
                          <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                              id="designation"
                              placeholder="e.g. HR Manager, Dean, Professor"
                              className="pl-10 h-11"
                              value={formData.designation}
                              onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                              required
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {mode === "signup" && (
                      <div className="space-y-1.5">
                        <Label htmlFor="phone" className="text-xs font-medium text-muted-foreground">Phone <span className="font-normal">(optional)</span></Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+91 98765 43210"
                          value={formData.phone}
                          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                          className="h-11"
                        />
                      </div>
                    )}

                    <Button type="submit" className="w-full h-11 mt-2 shadow-md shadow-primary/20 hover:shadow-lg hover:shadow-primary/30 transition-shadow font-semibold" disabled={loading}>
                      {loading ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" />{mode === "login" ? "Logging in…" : "Creating account…"}</>
                      ) : (
                        <>{mode === "login" ? "Log in" : "Create account"}<ArrowRight className="w-4 h-4 ml-2" /></>
                      )}
                    </Button>

                    {mode === "signup" && (
                      <p className="text-[11px] text-muted-foreground text-center leading-relaxed pt-1">
                        By creating an account you agree to our{" "}
                        <a href="/terms-of-service" className="underline hover:text-foreground">Terms</a> and{" "}
                        <a href="/privacy-policy" className="underline hover:text-foreground">Privacy Policy</a>.
                      </p>
                    )}
                  </form>

                  <div className="mt-5 pt-5 border-t border-border/60 text-center text-sm">
                    <span className="text-muted-foreground">
                      {mode === "login" ? "Don't have an account? " : "Already have an account? "}
                    </span>
                    <button
                      onClick={() => switchMode(mode === "login" ? "signup" : "login")}
                      className="font-semibold text-primary hover:underline"
                    >
                      {mode === "login" ? "Sign up" : "Sign in"}
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
