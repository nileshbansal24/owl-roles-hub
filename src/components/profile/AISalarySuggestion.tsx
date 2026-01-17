import * as React from "react";
import { Sparkles, RefreshCw, Info } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

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

export const AISalarySuggestion = ({ profile, className }: AISalarySuggestionProps) => {
  const { toast } = useToast();
  const [loading, setLoading] = React.useState(false);
  const [salaryData, setSalaryData] = React.useState<SalaryData | null>(null);
  const [hasAttempted, setHasAttempted] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [isRateLimited, setIsRateLimited] = React.useState(false);

  const fetchSalarySuggestion = React.useCallback(async () => {
    if (!profile || isRateLimited) return;

    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.functions.invoke("suggest-salary", {
        body: {
          profile: {
            role: profile.role,
            headline: profile.headline,
            yearsExperience: profile.yearsExperience,
            location: profile.location,
            skills: profile.skills,
            university: profile.university,
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        // Check for specific error types
        if (data.error.includes("credits exhausted") || data.error.includes("402")) {
          setError("AI credits exhausted. Please try again later.");
          setIsRateLimited(true);
        } else if (data.error.includes("Rate limit") || data.error.includes("429")) {
          setError("Too many requests. Please wait a moment.");
          setIsRateLimited(true);
          setTimeout(() => setIsRateLimited(false), 30000);
        } else {
          throw new Error(data.error);
        }
        return;
      }

      setSalaryData(data);
      setHasAttempted(true);
    } catch (error: any) {
      console.error("Failed to fetch salary suggestion:", error);
      const errorMessage = error.message || "Please try again later.";
      
      if (errorMessage.includes("credits") || errorMessage.includes("402")) {
        setError("AI credits exhausted. Please try again later.");
        setIsRateLimited(true);
      } else if (errorMessage.includes("Rate limit") || errorMessage.includes("429")) {
        setError("Too many requests. Please wait a moment.");
        setIsRateLimited(true);
        setTimeout(() => setIsRateLimited(false), 30000);
      } else {
        setError(errorMessage);
        toast({
          title: "Couldn't generate salary estimate",
          description: errorMessage,
          variant: "destructive",
        });
      }
      setHasAttempted(true);
    } finally {
      setLoading(false);
    }
  }, [profile, toast, isRateLimited]);

  // Auto-fetch on mount if profile has data
  React.useEffect(() => {
    if (profile && !hasAttempted && !salaryData) {
      const hasProfileData = profile.role || profile.headline || 
        (profile.yearsExperience !== null && profile.yearsExperience !== undefined) ||
        profile.location || (profile.skills && profile.skills.length > 0);
      
      if (hasProfileData) {
        fetchSalarySuggestion();
      }
    }
  }, [profile, hasAttempted, salaryData, fetchSalarySuggestion]);

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

      {loading ? (
        <div className="space-y-2 py-2">
          <Skeleton className="h-8 w-3/4 mx-auto" />
          <Skeleton className="h-4 w-1/2 mx-auto" />
        </div>
      ) : salaryData ? (
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
          <Button
            variant="ghost"
            size="sm"
            className="mt-3 text-xs h-7 px-2"
            onClick={fetchSalarySuggestion}
            disabled={loading}
          >
            <RefreshCw className="h-3 w-3 mr-1" />
            Refresh
          </Button>
        </div>
      ) : error ? (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground mb-3">
            {error}
          </p>
          {!isRateLimited && (
            <Button
              size="sm"
              variant="outline"
              onClick={fetchSalarySuggestion}
              disabled={loading}
              className="gap-1.5"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              Try Again
            </Button>
          )}
        </div>
      ) : (
        <div className="text-center py-2">
          <p className="text-sm text-muted-foreground mb-3">
            Get an AI-powered salary estimate based on your profile
          </p>
          <Button
            size="sm"
            variant="outline"
            onClick={fetchSalarySuggestion}
            disabled={loading}
            className="gap-1.5"
          >
            <Sparkles className="h-3.5 w-3.5" />
            Generate Estimate
          </Button>
        </div>
      )}
    </div>
  );
};

export default AISalarySuggestion;
