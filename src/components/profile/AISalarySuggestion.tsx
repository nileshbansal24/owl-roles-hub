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

// Helper function to detect if role is teaching or non-teaching
const isTeachingRole = (role: string | null | undefined): boolean => {
  if (!role) return true;
  const roleLower = role.toLowerCase();
  
  const nonTeachingKeywords = [
    "hr", "human resource", "admin", "administrator", "finance", "accounts",
    "purchase", "procurement", "registrar", "librarian", "it ", "maintenance",
    "security", "transport", "hostel", "placement", "training", "tpo", "counselor",
    "executive", "officer", "coordinator"
  ];
  
  const teachingKeywords = [
    "professor", "lecturer", "faculty", "teacher", "instructor",
    "dean", "hod", "head of department", "principal", "academic", "research"
  ];
  
  for (const keyword of teachingKeywords) {
    if (roleLower.includes(keyword)) return true;
  }
  
  for (const keyword of nonTeachingKeywords) {
    if (roleLower.includes(keyword)) return false;
  }
  
  if ((roleLower.includes("manager") || roleLower.includes("executive") || roleLower.includes("coordinator") || roleLower.includes("officer"))
      && !roleLower.includes("academic")) {
    return false;
  }
  
  return true;
};

// Salary data based on role/position - synced with CareerPathVisualization
const getMockSalaryData = (profile: ProfileData | null): SalaryData => {
  const role = (profile?.role || profile?.headline || "").toLowerCase();
  const yearsExp = profile?.yearsExperience || 0;
  const isTeaching = isTeachingRole(role);
  
  // NON-TEACHING / ADMINISTRATIVE ROLES
  if (!isTeaching) {
    // GM / Director (Admin) level
    if (role.includes("gm") || role.includes("general manager") || (role.includes("director") && !role.includes("academic"))) {
      return {
        minSalary: 1500000,
        maxSalary: 3000000,
        confidence: "high",
        percentile: 95,
        factors: [
          "GM/Director (Admin) level position",
          `${yearsExp > 0 ? yearsExp + "+ years experience" : "Executive leadership role"}`,
          profile?.location ? `Location: ${profile.location}` : "Metro city premium",
          "Strategic administrative responsibilities"
        ],
        salaryRange: "₹15 - 30 LPA"
      };
    }
    
    // AGM / DGM level
    if (role.includes("agm") || role.includes("dgm") || role.includes("assistant general") || role.includes("deputy general")) {
      return {
        minSalary: 1000000,
        maxSalary: 1800000,
        confidence: "high",
        percentile: 85,
        factors: [
          "AGM/DGM level position",
          `${yearsExp > 0 ? yearsExp + "+ years experience" : "Senior management role"}`,
          profile?.location ? `Location: ${profile.location}` : "Institution type",
          "Department oversight"
        ],
        salaryRange: "₹10 - 18 LPA"
      };
    }
    
    // Senior Manager / Deputy Director level
    if (role.includes("senior manager") || role.includes("deputy director") || role.includes("sr. manager") || role.includes("sr manager")) {
      return {
        minSalary: 600000,
        maxSalary: 1200000,
        confidence: "high",
        percentile: 75,
        factors: [
          "Senior Manager level position",
          `${yearsExp > 0 ? yearsExp + "+ years experience" : "Senior management"}`,
          profile?.location ? `Location: ${profile.location}` : "Institution type",
          "Team and process management"
        ],
        salaryRange: "₹6 - 12 LPA"
      };
    }
    
    // Manager level
    if (role.includes("manager") && !role.includes("assistant") && !role.includes("senior")) {
      return {
        minSalary: 400000,
        maxSalary: 800000,
        confidence: "medium",
        percentile: 60,
        factors: [
          "Manager level position",
          `${yearsExp > 0 ? yearsExp + "+ years experience" : "Mid-level management"}`,
          profile?.location ? `Location: ${profile.location}` : "Institution type",
          "Operational management"
        ],
        salaryRange: "₹4 - 8 LPA"
      };
    }
    
    // Assistant Manager level
    if (role.includes("assistant manager") || role.includes("asst. manager") || role.includes("asst manager")) {
      return {
        minSalary: 400000,
        maxSalary: 600000,
        confidence: "medium",
        percentile: 50,
        factors: [
          "Assistant Manager level position",
          `${yearsExp > 0 ? yearsExp + "+ years experience" : "Early management"}`,
          profile?.location ? `Location: ${profile.location}` : "Institution type",
          "Support management functions"
        ],
        salaryRange: "₹4 - 6 LPA"
      };
    }
    
    // Senior Executive level
    if (role.includes("senior executive") || role.includes("sr. executive") || role.includes("sr executive") || role.includes("senior officer")) {
      return {
        minSalary: 300000,
        maxSalary: 500000,
        confidence: "medium",
        percentile: 40,
        factors: [
          "Senior Executive level position",
          `${yearsExp > 0 ? yearsExp + "+ years experience" : "Experienced professional"}`,
          profile?.location ? `Location: ${profile.location}` : "Institution type",
          "Specialized expertise"
        ],
        salaryRange: "₹3 - 5 LPA"
      };
    }
    
    // Executive / Officer level (default non-teaching)
    return {
      minSalary: 200000,
      maxSalary: 400000,
      confidence: "medium",
      percentile: 30,
      factors: [
        "Executive/Officer level position",
        `${yearsExp > 0 ? yearsExp + "+ years experience" : "Entry to mid-level"}`,
        profile?.location ? `Location: ${profile.location}` : "Institution type varies",
        "Administrative responsibilities"
      ],
      salaryRange: "₹2 - 4 LPA"
    };
  }
  
  // TEACHING / ACADEMIC ROLES
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