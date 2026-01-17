import * as React from "react";
import { Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface AISalarySuggestionProps {
  salaryRange?: string;
  dataPoints?: number;
  className?: string;
}

export const AISalarySuggestion = ({
  salaryRange = "₹8L - ₹15L p.a.",
  dataPoints = 1000,
  className,
}: AISalarySuggestionProps) => {
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
      <p className="font-heading font-bold text-xl md:text-2xl text-foreground text-center">
        {salaryRange}
      </p>
      <p className="text-[10px] text-muted-foreground text-center mt-1">
        Based on {dataPoints.toLocaleString()} data points
      </p>
    </div>
  );
};

export default AISalarySuggestion;
