import * as React from "react";
import { motion } from "framer-motion";
import { Sparkles, Info, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";

interface ProfileData {
  role?: string | null;
  headline?: string | null;
  yearsExperience?: number | null;
  location?: string | null;
  skills?: string[] | null;
  university?: string | null;
}

interface SalaryData {
  minSalary: number;
  maxSalary: number;
  confidence: "low" | "medium" | "high";
  factors: string[];
  salaryRange: string;
  percentile: number;
}

interface AISalarySuggestionProps {
  profile: ProfileData | null;
  className?: string;
}

// Mock salary data based on role/position
const getMockSalaryData = (profile: ProfileData | null): SalaryData => {
  const role = (profile?.role || profile?.headline || "").toLowerCase();
  const yearsExp = profile?.yearsExperience || 0;
  
  // Director level
  if (role.includes("director") || role.includes("principal") || role.includes("vice chancellor")) {
    return {
      minSalary: 1500000,
      maxSalary: 2000000,
      confidence: "high",
      percentile: 95,
      factors: [
        "Director/Principal level position",
        `${yearsExp > 0 ? yearsExp + "+ years experience" : "Senior leadership role"}`,
        profile?.location ? `Location: ${profile.location}` : "Metro city premium",
        "Administrative responsibilities"
      ],
      salaryRange: "₹15 - 20 LPA"
    };
  }
  
  // HOD level
  if (role.includes("hod") || role.includes("head of department") || role.includes("head") || role.includes("dean")) {
    return {
      minSalary: 1000000,
      maxSalary: 1200000,
      confidence: "high",
      percentile: 85,
      factors: [
        "HOD/Dean level position",
        `${yearsExp > 0 ? yearsExp + "+ years experience" : "Department leadership"}`,
        profile?.location ? `Location: ${profile.location}` : "Academic institution",
        "Departmental management"
      ],
      salaryRange: "₹10 - 12 LPA"
    };
  }
  
  // Professor level
  if (role.includes("professor") && !role.includes("assistant") && !role.includes("associate")) {
    return {
      minSalary: 700000,
      maxSalary: 1000000,
      confidence: "high",
      percentile: 75,
      factors: [
        "Professor rank position",
        `${yearsExp > 0 ? yearsExp + "+ years experience" : "Senior faculty"}`,
        profile?.location ? `Location: ${profile.location}` : "University/College",
        profile?.skills?.length ? `Expertise in ${profile.skills.slice(0, 2).join(", ")}` : "Subject matter expertise"
      ],
      salaryRange: "₹7 - 10 LPA"
    };
  }
  
  // Associate Professor level
  if (role.includes("associate professor")) {
    return {
      minSalary: 500000,
      maxSalary: 700000,
      confidence: "medium",
      percentile: 60,
      factors: [
        "Associate Professor rank",
        `${yearsExp > 0 ? yearsExp + "+ years experience" : "Mid-level faculty"}`,
        profile?.location ? `Location: ${profile.location}` : "Academic institution",
        "Teaching and research"
      ],
      salaryRange: "₹5 - 7 LPA"
    };
  }
  
  // Assistant Professor / Entry level
  if (role.includes("assistant") || role.includes("lecturer") || role.includes("faculty")) {
    return {
      minSalary: 300000,
      maxSalary: 700000,
      confidence: "medium",
      percentile: 45,
      factors: [
        "Assistant Professor/Lecturer rank",
        `${yearsExp > 0 ? yearsExp + "+ years experience" : "Entry to mid-level"}`,
        profile?.location ? `Location: ${profile.location}` : "Institution type varies",
        profile?.university ? `From ${profile.university}` : "Academic qualifications"
      ],
      salaryRange: "₹3 - 7 LPA"
    };
  }
  
  // Default/Unknown role
  return {
    minSalary: 400000,
    maxSalary: 800000,
    confidence: "low",
    percentile: 50,
    factors: [
      "Based on general academic roles",
      profile?.yearsExperience ? `${profile.yearsExperience} years experience` : "Experience level unknown",
      profile?.location ? `Location: ${profile.location}` : "Location varies",
      "Complete your profile for better estimate"
    ],
    salaryRange: "₹4 - 8 LPA"
  };
};

export const AISalarySuggestion = ({ profile, className }: AISalarySuggestionProps) => {
  const salaryData = React.useMemo(() => getMockSalaryData(profile), [profile]);

  const getConfidenceStyles = (confidence: string) => {
    switch (confidence) {
      case "high":
        return { badge: "bg-green-500/10 text-green-600 border-green-500/30", progress: "bg-green-500" };
      case "medium":
        return { badge: "bg-amber-500/10 text-amber-600 border-amber-500/30", progress: "bg-amber-500" };
      default:
        return { badge: "bg-muted text-muted-foreground", progress: "bg-muted-foreground" };
    }
  };

  const confidenceStyles = getConfidenceStyles(salaryData.confidence);

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <h4 className="text-sm font-medium text-foreground">Expected Salary</h4>
        </div>
        <Badge
          variant="secondary"
          className="gap-1 bg-primary/10 text-primary border-0 text-[10px] h-5 px-2"
        >
          <Sparkles className="h-2.5 w-2.5" />
          AI
        </Badge>
      </div>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center p-4 rounded-xl bg-gradient-to-br from-primary/5 to-transparent border border-primary/10"
      >
        <p className="font-heading font-bold text-2xl md:text-3xl text-foreground">
          {salaryData.salaryRange}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          per annum (estimated)
        </p>
        
        <div className="flex items-center justify-center gap-2 mt-4">
          <Badge className={`${confidenceStyles.badge} text-[10px] font-medium`}>
            {salaryData.confidence.charAt(0).toUpperCase() + salaryData.confidence.slice(1)} confidence
          </Badge>
          {salaryData.factors && salaryData.factors.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="p-1 rounded-full hover:bg-secondary transition-colors text-muted-foreground hover:text-foreground">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs p-3">
                <p className="text-xs font-semibold mb-2">Based on:</p>
                <ul className="text-xs text-muted-foreground space-y-1">
                  {salaryData.factors.map((factor, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-primary">•</span>
                      {factor}
                    </li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </div>

        <div className="mt-4 pt-3 border-t border-border/50">
          <div className="flex items-center justify-between text-xs text-muted-foreground mb-1.5">
            <span>Market Percentile</span>
            <span className="font-medium text-foreground">{salaryData.percentile}%</span>
          </div>
          <Progress value={salaryData.percentile} className="h-1.5" />
        </div>
      </motion.div>
    </div>
  );
};

export default AISalarySuggestion;