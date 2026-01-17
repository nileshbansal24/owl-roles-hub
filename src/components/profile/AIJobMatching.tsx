import * as React from "react";
import { motion } from "framer-motion";
import { 
  Sparkles, 
  RefreshCw, 
  MapPin, 
  Building2, 
  Briefcase, 
  TrendingUp,
  ChevronRight,
  Loader2
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [matches, setMatches] = React.useState<JobMatch[]>([]);
  const [hasAttempted, setHasAttempted] = React.useState(false);

  const fetchJobMatches = React.useCallback(async () => {
    if (!profile) return;

    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("match-jobs", {
        body: {
          profile: {
            role: profile.role,
            headline: profile.headline,
            yearsExperience: profile.yearsExperience,
            location: profile.location,
            skills: profile.skills,
            university: profile.university,
            bio: profile.bio,
          },
          limit: 5,
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setMatches(data.matches || []);
      setHasAttempted(true);
    } catch (error: any) {
      console.error("Failed to fetch job matches:", error);
      toast({
        title: "Couldn't find job matches",
        description: error.message || "Please try again later.",
        variant: "destructive",
      });
      setHasAttempted(true);
    } finally {
      setLoading(false);
    }
  }, [profile, toast]);

  // Auto-fetch on mount if profile has data
  React.useEffect(() => {
    if (profile && !hasAttempted && matches.length === 0) {
      const hasProfileData =
        profile.role ||
        profile.headline ||
        (profile.yearsExperience !== null && profile.yearsExperience !== undefined) ||
        profile.location ||
        (profile.skills && profile.skills.length > 0);

      if (hasProfileData) {
        fetchJobMatches();
      }
    }
  }, [profile, hasAttempted, matches.length, fetchJobMatches]);

  const getMatchScoreColor = (score: number) => {
    if (score >= 80) return "text-green-600";
    if (score >= 60) return "text-amber-600";
    return "text-muted-foreground";
  };

  const getMatchScoreLabel = (score: number) => {
    if (score >= 80) return "Excellent Match";
    if (score >= 60) return "Good Match";
    return "Potential Match";
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
          onClick={fetchJobMatches}
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
          {matches.map((match, index) => (
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
      ) : hasAttempted ? (
        <div className="text-center py-8">
          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
            <Briefcase className="h-6 w-6 text-muted-foreground" />
          </div>
          <p className="text-sm text-muted-foreground mb-3">
            No matching jobs found based on your profile
          </p>
          <Button size="sm" variant="outline" onClick={fetchJobMatches}>
            <RefreshCw className="h-4 w-4 mr-1.5" />
            Try Again
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
          <Button size="sm" onClick={fetchJobMatches} disabled={loading}>
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
