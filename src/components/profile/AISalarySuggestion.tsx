import * as React from "react";
import { Sparkles, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

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

  const getConfidenceBadge = (confidence: string) => {
    switch (confidence) {
      case "high":
        return <Badge className="bg-green-500/10 text-green-600 border-green-500/30 text-[10px]">High confidence</Badge>;
      case "medium":
        return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30 text-[10px]">Medium confidence</Badge>;
      default:
        return <Badge className="bg-muted text-muted-foreground text-[10px]">Low confidence</Badge>;
    }
  };

  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-3">
        <h4 className="text-xs text-muted-foreground">AI-Suggested Salary</h4>
        <Badge
          variant="secondary"
          className="gap-1 bg-primary/10 text-primary border-0 text-[10px] h-5 px-1.5"
        >
          <Sparkles className="h-2.5 w-2.5" />
          AI Powered
        </Badge>
      </div>

      <div className="text-center">
        <p className="font-heading font-bold text-xl md:text-2xl text-foreground">
          {salaryData.salaryRange}
        </p>
        <div className="flex items-center justify-center gap-2 mt-2">
          {getConfidenceBadge(salaryData.confidence)}
          {salaryData.factors && salaryData.factors.length > 0 && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button className="text-muted-foreground hover:text-foreground">
                  <Info className="h-3.5 w-3.5" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="bottom" className="max-w-xs">
                <p className="text-xs font-medium mb-1">Based on:</p>
                <ul className="text-xs text-muted-foreground space-y-0.5">
                  {salaryData.factors.map((factor, i) => (
                    <li key={i}>• {factor}</li>
                  ))}
                </ul>
              </TooltipContent>
            </Tooltip>
          )}
        </div>
      </div>
    </div>
  );
};

export default AISalarySuggestion;
