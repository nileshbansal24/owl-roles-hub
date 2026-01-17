import * as React from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  MapPin, 
  Building2, 
  Briefcase, 
  TrendingUp,
  ChevronRight,
  RefreshCw,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";

interface ProfileData {
  role?: string | null;
  headline?: string | null;
  yearsExperience?: number | null;
  location?: string | null;
  skills?: string[] | null;
  university?: string | null;
  bio?: string | null;
}

interface Job {
  id: string;
  title: string;
  institute: string;
  location: string;
  job_type: string | null;
  salary_range: string | null;
  tags: string[] | null;
  description: string | null;
}

interface JobMatch {
  jobId: string;
  matchScore: number;
  matchReasons: string[];
  job: Job;
}

interface AIJobMatchingProps {
  profile: ProfileData | null;
  onViewJob?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
  className?: string;
}

// Keywords for different job levels
const levelKeywords = {
  director: ["director", "principal", "vice chancellor", "vc", "registrar", "provost"],
  hod: ["hod", "head of department", "dean", "head", "chairperson", "coordinator"],
  professor: ["professor", "senior professor", "full professor"],
  associate: ["associate professor", "associate"],
  assistant: ["assistant professor", "lecturer", "faculty", "teacher", "instructor"]
};

// Get user's level based on their role
const getUserLevel = (role: string): string => {
  const roleLower = role.toLowerCase();
  
  if (levelKeywords.director.some(k => roleLower.includes(k))) {
    return "director";
  }
  if (levelKeywords.hod.some(k => roleLower.includes(k))) {
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

// Get job level from title
const getJobLevel = (title: string): string => {
  const titleLower = title.toLowerCase();
  
  if (levelKeywords.director.some(k => titleLower.includes(k))) {
    return "director";
  }
  if (levelKeywords.hod.some(k => titleLower.includes(k))) {
    return "hod";
  }
  if (titleLower.includes("professor") && !titleLower.includes("assistant") && !titleLower.includes("associate")) {
    return "professor";
  }
  if (titleLower.includes("associate")) {
    return "associate";
  }
  return "assistant";
};

// Get recommended job levels based on user level
const getRecommendedLevels = (userLevel: string): string[] => {
  switch (userLevel) {
    case "director":
      return ["director"];
    case "hod":
      return ["hod", "director"];
    case "professor":
      return ["professor", "hod"];
    case "associate":
      return ["associate", "professor"];
    default:
      return ["assistant", "associate"];
  }
};

// Score a job based on profile match
const scoreJob = (job: Job, profile: ProfileData, userLevel: string, recommendedLevels: string[]): JobMatch | null => {
  const jobLevel = getJobLevel(job.title);
  
  // Only include jobs from recommended levels
  if (!recommendedLevels.includes(jobLevel)) {
    return null;
  }
  
  let score = 50; // Base score
  const reasons: string[] = [];
  
  // Level match bonus
  if (jobLevel === userLevel) {
    score += 20;
    reasons.push("Same seniority level");
  } else if (recommendedLevels.includes(jobLevel)) {
    score += 15;
    reasons.push("Career progression opportunity");
  }
  
  // Location match
  const userLocation = profile.location?.toLowerCase() || "";
  if (userLocation && job.location.toLowerCase().includes(userLocation)) {
    score += 15;
    reasons.push("Location match");
  }
  
  // Skills/tags match
  const userSkills = profile.skills || [];
  const jobTags = job.tags || [];
  const jobDescription = job.description?.toLowerCase() || "";
  const jobTitle = job.title.toLowerCase();
  
  const matchingSkills = userSkills.filter(skill => {
    const skillLower = skill.toLowerCase();
    return (
      jobTags.some(tag => tag.toLowerCase().includes(skillLower) || skillLower.includes(tag.toLowerCase())) ||
      jobDescription.includes(skillLower) ||
      jobTitle.includes(skillLower)
    );
  });
  
  if (matchingSkills.length > 0) {
    score += Math.min(matchingSkills.length * 5, 20);
    reasons.push(`Skills: ${matchingSkills.slice(0, 2).join(", ")}`);
  }
  
  // Role keyword match in title
  const userRole = (profile.role || profile.headline || "").toLowerCase();
  const roleWords = userRole.split(/\s+/).filter(w => w.length > 3);
  const titleMatches = roleWords.filter(word => jobTitle.includes(word));
  
  if (titleMatches.length > 0) {
    score += 10;
    if (!reasons.some(r => r.includes("Skills"))) {
      reasons.push("Role keywords match");
    }
  }
  
  // Add generic reason if no specific matches
  if (reasons.length === 0) {
    reasons.push("Matches your experience level");
  }
  
  return {
    jobId: job.id,
    matchScore: Math.min(score, 98),
    matchReasons: reasons.slice(0, 2),
    job
  };
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
  const [loading, setLoading] = React.useState(false);
  const [matches, setMatches] = React.useState<JobMatch[]>([]);
  const [hasLoaded, setHasLoaded] = React.useState(false);

  const fetchAndMatchJobs = React.useCallback(async () => {
    if (!profile) return;
    
    setLoading(true);
    try {
      // Fetch all jobs from the database
      const { data: jobs, error } = await supabase
        .from("jobs")
        .select("id, title, institute, location, job_type, salary_range, tags, description")
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching jobs:", error);
        return;
      }
      
      if (!jobs || jobs.length === 0) {
        setMatches([]);
        return;
      }
      
      // Get user level and recommended levels
      const userRole = profile.role || profile.headline || "assistant professor";
      const userLevel = getUserLevel(userRole);
      const recommendedLevels = getRecommendedLevels(userLevel);
      
      // Score and filter jobs
      const scoredJobs = jobs
        .map(job => scoreJob(job as Job, profile, userLevel, recommendedLevels))
        .filter((match): match is JobMatch => match !== null)
        .sort((a, b) => b.matchScore - a.matchScore)
        .slice(0, 5);
      
      setMatches(scoredJobs);
    } catch (error) {
      console.error("Error in job matching:", error);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }, [profile]);

  // Auto-fetch on mount
  React.useEffect(() => {
    if (profile && !hasLoaded) {
      fetchAndMatchJobs();
    }
  }, [profile, hasLoaded, fetchAndMatchJobs]);

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
        <Button
          variant="ghost"
          size="sm"
          className="h-8 px-2"
          onClick={fetchAndMatchJobs}
          disabled={loading}
        >
          <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Content */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-4 rounded-lg border border-border bg-card">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-1/2" />
                  <Skeleton className="h-3 w-full" />
                </div>
                <Skeleton className="h-12 w-12 rounded-full" />
              </div>
            </div>
          ))}
        </div>
      ) : matches.length > 0 ? (
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
      ) : hasLoaded ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            No matching jobs found. Check back later for new opportunities!
          </p>
          <Button size="sm" variant="outline" onClick={fetchAndMatchJobs}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Refresh
          </Button>
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            Find jobs that match your skills and experience
          </p>
          <Button size="sm" onClick={fetchAndMatchJobs} disabled={loading}>
            {loading ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            Find Matching Jobs
          </Button>
        </div>
      )}
    </div>
  );
};

export default AIJobMatching;
