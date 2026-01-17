import * as React from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  MapPin, 
  Building2, 
  Briefcase, 
  TrendingUp,
  ChevronRight
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface ProfileData {
  role?: string | null;
  headline?: string | null;
  yearsExperience?: number | null;
  location?: string | null;
  skills?: string[] | null;
  university?: string | null;
  bio?: string | null;
}

interface JobMatch {
  jobId: string;
  matchScore: number;
  matchReasons: string[];
  job: {
    id: string;
    title: string;
    institute: string;
    location: string;
    job_type: string | null;
    salary_range: string | null;
    tags: string[] | null;
  };
}

interface AIJobMatchingProps {
  profile: ProfileData | null;
  onViewJob?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  className?: string;
}

// Mock job database
const mockJobs = [
  // Director/Principal level jobs
  { id: "1", title: "Director", institute: "ABC Engineering College", location: "Mumbai", job_type: "Full-time", salary_range: "₹18-22 LPA", tags: ["leadership", "administration", "director"], level: "director" },
  { id: "2", title: "Principal", institute: "XYZ University", location: "Delhi", job_type: "Full-time", salary_range: "₹15-20 LPA", tags: ["principal", "leadership", "academic"], level: "director" },
  { id: "3", title: "Vice Chancellor", institute: "State University", location: "Bangalore", job_type: "Full-time", salary_range: "₹25-30 LPA", tags: ["vice chancellor", "leadership"], level: "director" },
  
  // HOD/Dean level jobs
  { id: "4", title: "Dean - Engineering", institute: "Tech Institute", location: "Hyderabad", job_type: "Full-time", salary_range: "₹12-15 LPA", tags: ["dean", "engineering", "leadership"], level: "hod" },
  { id: "5", title: "Head of Department - Computer Science", institute: "Modern College", location: "Pune", job_type: "Full-time", salary_range: "₹10-12 LPA", tags: ["hod", "computer science", "department head"], level: "hod" },
  { id: "6", title: "HOD - Mathematics", institute: "City College", location: "Chennai", job_type: "Full-time", salary_range: "₹10-12 LPA", tags: ["hod", "mathematics", "academic"], level: "hod" },
  { id: "7", title: "Dean - Science Faculty", institute: "National University", location: "Kolkata", job_type: "Full-time", salary_range: "₹11-14 LPA", tags: ["dean", "science", "faculty"], level: "hod" },
  
  // Professor level jobs
  { id: "8", title: "Professor - Physics", institute: "IIT Delhi", location: "Delhi", job_type: "Full-time", salary_range: "₹8-10 LPA", tags: ["professor", "physics", "research"], level: "professor" },
  { id: "9", title: "Professor - Computer Science", institute: "BITS Pilani", location: "Pilani", job_type: "Full-time", salary_range: "₹9-11 LPA", tags: ["professor", "cs", "teaching"], level: "professor" },
  { id: "10", title: "Senior Professor - Economics", institute: "Delhi School of Economics", location: "Delhi", job_type: "Full-time", salary_range: "₹8-10 LPA", tags: ["professor", "economics"], level: "professor" },
  
  // Associate Professor level
  { id: "11", title: "Associate Professor - English", institute: "St. Xavier's College", location: "Mumbai", job_type: "Full-time", salary_range: "₹5-7 LPA", tags: ["associate professor", "english", "literature"], level: "associate" },
  { id: "12", title: "Associate Professor - Management", institute: "IIM Bangalore", location: "Bangalore", job_type: "Full-time", salary_range: "₹6-8 LPA", tags: ["associate professor", "mba", "management"], level: "associate" },
  
  // Assistant Professor level jobs
  { id: "13", title: "Assistant Professor - Chemistry", institute: "Government College", location: "Jaipur", job_type: "Full-time", salary_range: "₹4-6 LPA", tags: ["assistant professor", "chemistry", "teaching"], level: "assistant" },
  { id: "14", title: "Assistant Professor - Mechanical Engineering", institute: "Engineering College", location: "Ahmedabad", job_type: "Full-time", salary_range: "₹3-5 LPA", tags: ["assistant professor", "mechanical", "engineering"], level: "assistant" },
  { id: "15", title: "Lecturer - Mathematics", institute: "Private College", location: "Lucknow", job_type: "Full-time", salary_range: "₹2.5-4 LPA", tags: ["lecturer", "mathematics", "teaching"], level: "assistant" },
  { id: "16", title: "Assistant Professor - Computer Applications", institute: "MCA College", location: "Noida", job_type: "Full-time", salary_range: "₹4-6 LPA", tags: ["assistant professor", "mca", "computer"], level: "assistant" },
];

// Get user's level based on their role
const getUserLevel = (role: string): string => {
  const roleLower = role.toLowerCase();
  
  if (roleLower.includes("director") || roleLower.includes("principal") || roleLower.includes("vice chancellor")) {
    return "director";
  }
  if (roleLower.includes("hod") || roleLower.includes("head of department") || roleLower.includes("dean") || roleLower.includes("head")) {
    return "hod";
  }
  if (roleLower.includes("professor") && !roleLower.includes("assistant") && !roleLower.includes("associate")) {
    return "professor";
  }
  if (roleLower.includes("associate")) {
    return "associate";
  }
  return "assistant";
};

// Get recommended job levels based on user level
const getRecommendedLevels = (userLevel: string): string[] => {
  switch (userLevel) {
    case "director":
      return ["director"]; // Directors see director-level jobs
    case "hod":
      return ["hod", "director"]; // HODs can see HOD and Director jobs
    case "professor":
      return ["professor", "hod"]; // Professors see Professor and HOD jobs
    case "associate":
      return ["associate", "professor"]; // Associate Professors see Associate and Professor jobs
    default:
      return ["assistant", "associate"]; // Assistant Professors see Assistant and Associate jobs
  }
};

// Generate mock matches based on profile
const getMockMatches = (profile: ProfileData | null): JobMatch[] => {
  if (!profile) return [];
  
  const userRole = profile.role || profile.headline || "assistant professor";
  const userLevel = getUserLevel(userRole);
  const recommendedLevels = getRecommendedLevels(userLevel);
  const userLocation = profile.location?.toLowerCase() || "";
  const userSkills = profile.skills || [];
  
  // Filter jobs by recommended levels
  const relevantJobs = mockJobs.filter(job => recommendedLevels.includes(job.level));
  
  // Score and rank jobs
  const scoredJobs = relevantJobs.map(job => {
    let score = 60; // Base score for level match
    const reasons: string[] = [];
    
    // Level match bonus
    if (job.level === userLevel) {
      score += 15;
      reasons.push("Same seniority level");
    } else if (recommendedLevels.indexOf(job.level) === 1) {
      score += 10;
      reasons.push("Career progression opportunity");
    }
    
    // Location match
    if (userLocation && job.location.toLowerCase().includes(userLocation)) {
      score += 15;
      reasons.push("Location match");
    }
    
    // Skills/tags match
    const matchingTags = job.tags?.filter(tag => 
      userSkills.some(skill => skill.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(skill.toLowerCase()))
    ) || [];
    
    if (matchingTags.length > 0) {
      score += matchingTags.length * 5;
      reasons.push(`Skills: ${matchingTags.slice(0, 2).join(", ")}`);
    }
    
    // Add generic reason if no specific matches
    if (reasons.length === 0) {
      reasons.push("Matches your experience level");
    }
    
    return {
      jobId: job.id,
      matchScore: Math.min(score, 98),
      matchReasons: reasons.slice(0, 2),
      job: {
        id: job.id,
        title: job.title,
        institute: job.institute,
        location: job.location,
        job_type: job.job_type,
        salary_range: job.salary_range,
        tags: job.tags
      }
    };
  });
  
  // Sort by score and return top 5
  return scoredJobs
    .sort((a, b) => b.matchScore - a.matchScore)
    .slice(0, 5);
};

const itemVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
};

export const AIJobMatching = ({ 
  profile, 
  onViewJob, 
  onApply,
  className 
}: AIJobMatchingProps) => {
  const matches = React.useMemo(() => getMockMatches(profile), [profile]);

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-muted-foreground";
  };

  return (
    <div className={className}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <h3 className="font-heading font-semibold text-lg text-foreground">
            AI Job Recommendations
          </h3>
          <Badge
            variant="secondary"
            className="gap-1 bg-primary/10 text-primary border-0 text-[10px] h-5 px-1.5"
          >
            <Sparkles className="h-2.5 w-2.5" />
            AI Powered
          </Badge>
        </div>
      </div>

      {/* Content */}
      {matches.length > 0 ? (
        <motion.div
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1 } },
          }}
          className="space-y-3"
        >
          {matches.map((match) => (
            <motion.div
              key={match.jobId}
              variants={itemVariants}
              className="group p-4 rounded-lg border border-border bg-card hover:shadow-card transition-all cursor-pointer"
              onClick={() => onViewJob?.(match.jobId)}
            >
              <div className="flex items-start gap-4">
                {/* Match Score Circle */}
                <div className="relative shrink-0">
                  <svg className="w-14 h-14 -rotate-90">
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      className="text-muted/30"
                    />
                    <circle
                      cx="28"
                      cy="28"
                      r="24"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                      strokeDasharray={`${(match.matchScore / 100) * 150.8} 150.8`}
                      className={getMatchScoreColor(match.matchScore)}
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className={`text-sm font-bold ${getMatchScoreColor(match.matchScore)}`}>
                      {match.matchScore}%
                    </span>
                  </div>
                </div>

                {/* Job Details */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h4 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {match.job.title}
                      </h4>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-0.5">
                        <Building2 className="h-3.5 w-3.5" />
                        <span className="truncate">{match.job.institute}</span>
                      </div>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary shrink-0 transition-colors" />
                  </div>

                  <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      <span>{match.job.location}</span>
                    </div>
                    {match.job.job_type && (
                      <div className="flex items-center gap-1">
                        <Briefcase className="h-3 w-3" />
                        <span>{match.job.job_type}</span>
                      </div>
                    )}
                    {match.job.salary_range && (
                      <Badge variant="secondary" className="text-[10px] h-5">
                        {match.job.salary_range}
                      </Badge>
                    )}
                  </div>

                  {/* Match Reasons */}
                  <div className="mt-2 flex flex-wrap gap-1">
                    {match.matchReasons.slice(0, 2).map((reason, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-[10px] h-5 bg-primary/5 border-primary/20 text-primary"
                      >
                        <TrendingUp className="h-2.5 w-2.5 mr-1" />
                        {reason}
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>

              {/* Quick Apply Button */}
              {onApply && (
                <div className="mt-3 pt-3 border-t border-border">
                  <Button
                    size="sm"
                    className="w-full"
                    onClick={(e) => {
                      e.stopPropagation();
                      onApply(match.jobId);
                    }}
                  >
                    Quick Apply
                  </Button>
                </div>
              )}
            </motion.div>
          ))}
        </motion.div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Complete your profile to see job recommendations
          </p>
        </div>
      )}
    </div>
  );
};

export default AIJobMatching;
