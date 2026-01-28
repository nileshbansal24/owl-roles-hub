import { useState } from "react";
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
  CheckCircle2,
  Loader2
} from "lucide-react";

interface AuthModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultMode?: "login" | "signup";
  defaultRole?: "candidate" | "recruiter";
}

const AuthModal = ({ 
  open, 
  onOpenChange, 
  defaultMode = "login",
  defaultRole = "candidate" 
}: AuthModalProps) => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">(defaultMode);
  const [role, setRole] = useState<"candidate" | "recruiter">(defaultRole);
  const [step, setStep] = useState<"role" | "form">("role");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
    fullName: "",
    phone: "",
  });

  const handleRoleSelect = (selectedRole: "candidate" | "recruiter") => {
    setRole(selectedRole);
    setStep("form");
  };

  const redirectBasedOnRole = async (userId: string, selectedRole?: string) => {
    // If we know the role from signup, use it directly
    if (selectedRole) {
      if (selectedRole === "recruiter") {
        navigate("/recruiter-dashboard");
      } else {
        navigate("/candidate-dashboard");
      }
      return;
    }

    // For login, fetch the user type from the database
    const { data: profile } = await supabase
      .from("profiles")
      .select("user_type")
      .eq("id", userId)
      .maybeSingle();

    if (profile?.user_type === "recruiter") {
      navigate("/recruiter-dashboard");
    } else {
      navigate("/candidate-dashboard");
    }
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
            },
          },
        });

        if (error) throw error;

        toast({
          title: "Account created!",
          description: "Welcome to OWL ROLES!",
        });
        onOpenChange(false);
        
        // Redirect based on selected role
        if (data.user) {
          redirectBasedOnRole(data.user.id, role);
        }
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: formData.email,
          password: formData.password,
        });

        if (error) throw error;

        toast({
          title: "Welcome back!",
          description: "You have been logged in successfully.",
        });
        onOpenChange(false);
        
        // Redirect based on user's stored role
        if (data.user) {
          redirectBasedOnRole(data.user.id);
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const resetModal = () => {
    setStep("role");
    setFormData({ email: "", password: "", fullName: "", phone: "" });
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) resetModal(); }}>
      <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-card">
        <AnimatePresence mode="wait">
          {step === "role" ? (
            <motion.div
              key="role-select"
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className="p-8"
            >
              <div className="text-center mb-8">
                <motion.div
                  initial={{ scale: 0.8 }}
                  animate={{ scale: 1 }}
                  className="w-16 h-16 rounded-2xl bg-primary mx-auto flex items-center justify-center mb-4"
                >
                  <span className="text-primary-foreground font-heading font-bold text-2xl">O</span>
                </motion.div>
                <h2 className="font-heading text-2xl font-bold text-foreground">
                  {mode === "login" ? "Welcome Back!" : "Join OWL ROLES"}
                </h2>
                <p className="text-muted-foreground mt-2">
                  {mode === "login" ? "Select your account type to continue" : "Choose how you want to use OWL ROLES"}
                </p>
              </div>

              <div className="grid gap-4">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect("candidate")}
                  className="flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-primary bg-background transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <User className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-heading font-semibold text-foreground">Candidate</h3>
                    <p className="text-sm text-muted-foreground">Find your dream academic job</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.button>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => handleRoleSelect("recruiter")}
                  className="flex items-center gap-4 p-5 rounded-xl border-2 border-border hover:border-primary bg-background transition-all group"
                >
                  <div className="w-14 h-14 rounded-xl bg-accent/10 flex items-center justify-center group-hover:bg-accent/20 transition-colors">
                    <Briefcase className="w-7 h-7 text-primary" />
                  </div>
                  <div className="text-left flex-1">
                    <h3 className="font-heading font-semibold text-foreground">Recruiter</h3>
                    <p className="text-sm text-muted-foreground">Post jobs & find top talent</p>
                  </div>
                  <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors" />
                </motion.button>
              </div>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="auth-form"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="p-8"
            >
              <button
                onClick={() => setStep("role")}
                className="text-sm text-muted-foreground hover:text-foreground mb-4 flex items-center gap-1"
              >
                ← Back
              </button>

              <div className="flex items-center gap-3 mb-6">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  role === "candidate" ? "bg-primary/10" : "bg-accent/10"
                }`}>
                  {role === "candidate" ? (
                    <User className="w-6 h-6 text-primary" />
                  ) : (
                    <Briefcase className="w-6 h-6 text-primary" />
                  )}
                </div>
                <div>
                  <h2 className="font-heading text-xl font-bold text-foreground">
                    {mode === "login" ? "Login" : "Create Account"}
                  </h2>
                  <p className="text-sm text-muted-foreground capitalize">{role} Account</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">Full Name</Label>
                    <Input
                      id="fullName"
                      placeholder="Enter your full name"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      className="pl-10"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter your password"
                      className="pl-10 pr-10"
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
                </div>

                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone (Optional)</Label>
                    <Input
                      id="phone"
                      type="tel"
                      placeholder="Enter your phone number"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    />
                  </div>
                )}

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 mr-2" />
                  )}
                  {mode === "login" ? "Login" : "Create Account"}
                </Button>
              </form>

              <div className="mt-4 text-center">
                <button
                  onClick={() => setMode(mode === "login" ? "signup" : "login")}
                  className="text-sm text-muted-foreground hover:text-primary transition-colors"
                >
                  {mode === "login" ? "Don't have an account? Sign up" : "Already have an account? Log in"}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default AuthModal;
