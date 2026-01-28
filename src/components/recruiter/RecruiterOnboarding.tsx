import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Briefcase,
  Users,
  Search,
  Calendar,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Target,
  MessageSquare,
  Star,
} from "lucide-react";

interface RecruiterOnboardingProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recruiterName?: string;
  onComplete: () => void;
}

const steps = [
  {
    id: "welcome",
    title: "Welcome to OWL ROLES!",
    subtitle: "Let's get you set up to find the best academic talent",
    icon: Sparkles,
    features: [
      { icon: Briefcase, label: "Post unlimited jobs", description: "Reach thousands of academic professionals" },
      { icon: Users, label: "Find top candidates", description: "Search through qualified profiles" },
      { icon: Calendar, label: "Schedule interviews", description: "Manage your hiring pipeline" },
    ],
  },
  {
    id: "post-job",
    title: "Post Your First Job",
    subtitle: "Start attracting qualified candidates in minutes",
    icon: Target,
    tips: [
      "Write a clear, descriptive job title",
      "Include salary range to attract more applicants",
      "Add relevant tags for better visibility",
      "Describe your institution and culture",
    ],
  },
  {
    id: "find-candidates",
    title: "Find Candidates",
    subtitle: "Proactively search for the perfect fit",
    icon: Search,
    features: [
      { icon: Search, label: "Search by Role", description: "Find Deans, Professors, HODs and more" },
      { icon: Star, label: "Save Favorites", description: "Bookmark promising candidates" },
      { icon: MessageSquare, label: "Add Notes", description: "Keep track of your evaluations" },
    ],
  },
  {
    id: "ready",
    title: "You're All Set!",
    subtitle: "Let's post your first job and start hiring",
    icon: CheckCircle2,
    cta: true,
  },
];

const RecruiterOnboarding = ({
  open,
  onOpenChange,
  recruiterName,
  onComplete,
}: RecruiterOnboardingProps) => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(0);
  const progress = ((currentStep + 1) / steps.length) * 100;
  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handlePostJob = () => {
    onComplete();
    onOpenChange(false);
    navigate("/post-job");
  };

  const handleSkip = () => {
    onComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden bg-card">
        {/* Progress bar */}
        <div className="px-6 pt-6">
          <Progress value={progress} className="h-1.5" />
          <p className="text-xs text-muted-foreground mt-2 text-right">
            Step {currentStep + 1} of {steps.length}
          </p>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={step.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="p-6 pt-2"
          >
            {/* Step Icon */}
            <div className="flex justify-center mb-6">
              <motion.div
                initial={{ scale: 0.8 }}
                animate={{ scale: 1 }}
                className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center"
              >
                <step.icon className="w-10 h-10 text-primary" />
              </motion.div>
            </div>

            {/* Title */}
            <div className="text-center mb-6">
              <h2 className="font-heading text-2xl font-bold text-foreground">
                {step.id === "welcome" && recruiterName
                  ? `Welcome, ${recruiterName.split(" ")[0]}!`
                  : step.title}
              </h2>
              <p className="text-muted-foreground mt-2">{step.subtitle}</p>
            </div>

            {/* Step Content */}
            {step.id === "welcome" && step.features && (
              <div className="space-y-4 mb-6">
                {step.features.map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-4 p-4 rounded-xl bg-secondary/50"
                  >
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-foreground">{feature.label}</h4>
                      <p className="text-sm text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {step.id === "post-job" && step.tips && (
              <div className="mb-6">
                <div className="bg-secondary/50 rounded-xl p-5">
                  <h4 className="font-medium text-foreground mb-3 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-primary" />
                    Pro Tips for Great Job Posts
                  </h4>
                  <ul className="space-y-2">
                    {step.tips.map((tip, index) => (
                      <motion.li
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className="flex items-start gap-2 text-sm text-muted-foreground"
                      >
                        <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        {tip}
                      </motion.li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {step.id === "find-candidates" && step.features && (
              <div className="grid gap-3 mb-6">
                {step.features.map((feature, index) => (
                  <motion.div
                    key={feature.label}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50"
                  >
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <feature.icon className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-foreground">{feature.label}</h4>
                      <p className="text-xs text-muted-foreground">{feature.description}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {step.id === "ready" && (
              <div className="mb-6">
                <motion.div
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl p-6 text-center"
                >
                  <div className="flex justify-center mb-4">
                    <div className="flex -space-x-2">
                      {[...Array(3)].map((_, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-full bg-primary/20 border-2 border-card flex items-center justify-center"
                        >
                          <Users className="w-5 h-5 text-primary" />
                        </div>
                      ))}
                    </div>
                  </div>
                  <p className="text-foreground font-medium">
                    Thousands of academic professionals are waiting to hear from you!
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    Post your first job to start receiving applications
                  </p>
                </motion.div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button variant="outline" onClick={handleBack} className="flex-1">
                  Back
                </Button>
              )}

              {step.cta ? (
                <>
                  <Button variant="outline" onClick={handleSkip} className="flex-1">
                    Explore Dashboard
                  </Button>
                  <Button onClick={handlePostJob} className="flex-1 gap-2">
                    Post First Job
                    <ArrowRight className="w-4 h-4" />
                  </Button>
                </>
              ) : (
                <Button onClick={handleNext} className="flex-1 gap-2">
                  {currentStep === 0 ? "Get Started" : "Continue"}
                  <ArrowRight className="w-4 h-4" />
                </Button>
              )}
            </div>

            {/* Skip link */}
            {!step.cta && (
              <div className="text-center mt-4">
                <button
                  onClick={handleSkip}
                  className="text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  Skip onboarding
                </button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};

export default RecruiterOnboarding;
