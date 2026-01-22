import * as React from "react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { 
  CheckCircle2, 
  Circle, 
  Sparkles,
  User,
  Briefcase,
  GraduationCap,
  FileText,
  Award,
  Target,
  BookOpen,
  MapPin,
  ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ProfileMilestoneBadges } from "./ProfileMilestoneBadges";

interface ProfileCompletionCardProps {
  profile: {
    full_name?: string | null;
    role?: string | null;
    location?: string | null;
    avatar_url?: string | null;
    resume_url?: string | null;
    bio?: string | null;
    headline?: string | null;
  } | null;
  professionalSummary?: string;
  experience?: any[];
  education?: any[];
  skills?: string[];
  achievements?: string[];
  researchPapers?: any[];
  onSectionClick?: (section: string) => void;
  defaultOpen?: boolean;
}

interface CompletionItem {
  id: string;
  label: string;
  icon: React.ElementType;
  completed: boolean;
  weight: number;
  tip: string;
}

export const ProfileCompletionCard = ({
  profile,
  professionalSummary = "",
  experience = [],
  education = [],
  skills = [],
  achievements = [],
  researchPapers = [],
  onSectionClick,
}: ProfileCompletionCardProps) => {
  const completionItems: CompletionItem[] = [
    {
      id: "basic",
      label: "Basic Info",
      icon: User,
      completed: !!(profile?.full_name && profile.full_name !== "Your Name"),
      weight: 15,
      tip: "Add your full name to personalize your profile",
    },
    {
      id: "avatar",
      label: "Profile Photo",
      icon: User,
      completed: !!profile?.avatar_url,
      weight: 10,
      tip: "Upload a professional photo to stand out",
    },
    {
      id: "role",
      label: "Current Role",
      icon: Briefcase,
      completed: !!profile?.role,
      weight: 10,
      tip: "Add your current job title or position",
    },
    {
      id: "location",
      label: "Location",
      icon: MapPin,
      completed: !!profile?.location,
      weight: 5,
      tip: "Add your location to help with job matching",
    },
    {
      id: "summary",
      label: "Professional Summary",
      icon: FileText,
      completed: professionalSummary.length > 50,
      weight: 15,
      tip: "Write a compelling summary of your career",
    },
    {
      id: "experience",
      label: "Work Experience",
      icon: Briefcase,
      completed: experience.length > 0,
      weight: 15,
      tip: "Add at least one work experience entry",
    },
    {
      id: "education",
      label: "Education",
      icon: GraduationCap,
      completed: education.length > 0,
      weight: 10,
      tip: "Add your educational background",
    },
    {
      id: "skills",
      label: "Skills",
      icon: Target,
      completed: skills.length >= 3,
      weight: 10,
      tip: "Add at least 3 skills to showcase your expertise",
    },
    {
      id: "resume",
      label: "Resume",
      icon: FileText,
      completed: !!profile?.resume_url,
      weight: 5,
      tip: "Upload your resume for quick applications",
    },
    {
      id: "achievements",
      label: "Achievements",
      icon: Award,
      completed: achievements.length > 0,
      weight: 3,
      tip: "Highlight your key achievements and awards",
    },
    {
      id: "research",
      label: "Publications",
      icon: BookOpen,
      completed: researchPapers.length > 0,
      weight: 2,
      tip: "Add research papers or publications",
    },
  ];

  const completedWeight = completionItems
    .filter((item) => item.completed)
    .reduce((sum, item) => sum + item.weight, 0);
  
  const totalWeight = completionItems.reduce((sum, item) => sum + item.weight, 0);
  const completionPercentage = Math.round((completedWeight / totalWeight) * 100);

  // Auto-collapse when 100% complete
  const [isOpen, setIsOpen] = useState(completionPercentage < 100);

  const incompleteItems = completionItems.filter((item) => !item.completed);
  const completedItems = completionItems.filter((item) => item.completed);

  const getStatusLabel = (percentage: number) => {
    if (percentage >= 90) return { text: "Excellent", color: "bg-green-500/10 text-green-600 border-green-200" };
    if (percentage >= 70) return { text: "Good", color: "bg-blue-500/10 text-blue-600 border-blue-200" };
    if (percentage >= 50) return { text: "Getting There", color: "bg-amber-500/10 text-amber-600 border-amber-200" };
    return { text: "Needs Work", color: "bg-orange-500/10 text-orange-600 border-orange-200" };
  };

  const status = getStatusLabel(completionPercentage);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Card className="overflow-hidden border-border bg-card shadow-card rounded-2xl">
        <Collapsible open={isOpen} onOpenChange={setIsOpen}>
          <CardHeader className="pb-3 bg-gradient-to-r from-primary/5 via-transparent to-primary/3">
            <CollapsibleTrigger asChild>
              <button className="w-full flex items-center justify-between hover:opacity-80 transition-opacity">
                <CardTitle className="text-base font-heading font-semibold flex items-center gap-2">
                  <Sparkles className="h-4 w-4 text-primary" />
                  Profile Strength
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn("text-xs font-medium", status.color)}>
                    {status.text}
                  </Badge>
                  <ChevronDown 
                    className={cn(
                      "h-4 w-4 text-muted-foreground transition-transform duration-200",
                      isOpen ? "rotate-180" : ""
                    )} 
                  />
                </div>
              </button>
            </CollapsibleTrigger>
          </CardHeader>
          
          <CollapsibleContent>
            <AnimatePresence>
              {isOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                >
                  <CardContent className="space-y-4">
                    {/* Progress Circle & Percentage */}
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <svg className="w-16 h-16 transform -rotate-90">
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            className="text-secondary"
                          />
                          <circle
                            cx="32"
                            cy="32"
                            r="28"
                            stroke="currentColor"
                            strokeWidth="6"
                            fill="none"
                            strokeDasharray={`${completionPercentage * 1.76} 176`}
                            strokeLinecap="round"
                            className={cn(
                              "transition-all duration-700 ease-out",
                              completionPercentage >= 80 ? "text-green-500" : 
                              completionPercentage >= 50 ? "text-amber-500" : "text-primary"
                            )}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold text-foreground">{completionPercentage}%</span>
                        </div>
                      </div>
                      <div className="flex-1">
                        <p className="text-sm text-muted-foreground mb-1">
                          {completedItems.length} of {completionItems.length} sections complete
                        </p>
                        <Progress 
                          value={completionPercentage} 
                          className="h-2"
                        />
                      </div>
                    </div>

                    {/* Milestone Badges */}
                    <ProfileMilestoneBadges completionPercentage={completionPercentage} />

                    {/* Tips for Improvement */}
                    {incompleteItems.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                          Tips to Improve
                        </h4>
                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                          {incompleteItems.slice(0, 3).map((item) => (
                            <motion.button
                              key={item.id}
                              onClick={() => onSectionClick?.(item.id)}
                              className="w-full flex items-center gap-2.5 p-2 rounded-lg bg-secondary/40 hover:bg-secondary/70 transition-colors text-left group"
                              whileHover={{ x: 2 }}
                              whileTap={{ scale: 0.98 }}
                            >
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary">
                                <item.icon className="h-3.5 w-3.5" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-foreground truncate">
                                  {item.tip}
                                </p>
                              </div>
                              <Circle className="h-3.5 w-3.5 text-muted-foreground/50 group-hover:text-primary transition-colors" />
                            </motion.button>
                          ))}
                        </div>
                        {incompleteItems.length > 3 && (
                          <p className="text-xs text-muted-foreground text-center pt-1">
                            +{incompleteItems.length - 3} more improvements available
                          </p>
                        )}
                      </div>
                    )}

                    {/* Completed Items Summary */}
                    {completedItems.length > 0 && (
                      <div className="pt-2 border-t border-border">
                        <div className="flex flex-wrap gap-1.5">
                          {completedItems.map((item) => (
                            <div
                              key={item.id}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-green-500/10 text-green-600 text-xs"
                            >
                              <CheckCircle2 className="h-3 w-3" />
                              <span>{item.label}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </motion.div>
              )}
            </AnimatePresence>
          </CollapsibleContent>
        </Collapsible>
      </Card>
    </motion.div>
  );
};

export default ProfileCompletionCard;
