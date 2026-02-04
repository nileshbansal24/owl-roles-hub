import * as React from "react";
import { motion } from "framer-motion";
import { ArrowRight, TrendingUp, Sparkles } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CareerInsightsCardProps {
  currentRole?: string | null;
  onClick?: () => void;
  className?: string;
}

export const CareerInsightsCard = ({
  currentRole,
  onClick,
  className,
}: CareerInsightsCardProps) => {
  // Determine career stage based on role
  const getCareerStage = () => {
    const role = (currentRole || "").toLowerCase();
    if (role.includes("director") || role.includes("executive")) return "Senior Leadership";
    if (role.includes("hod") || role.includes("head") || role.includes("dean")) return "Leadership";
    if (role.includes("professor") && !role.includes("assistant") && !role.includes("associate")) return "Senior Faculty";
    if (role.includes("associate")) return "Mid-Level Faculty";
    if (role.includes("assistant") || role.includes("lecturer")) return "Early Career";
    return "Early Career";
  };

  return (
    <motion.button
      onClick={onClick}
      className={`w-full text-left p-4 rounded-xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/15 hover:border-primary/30 transition-all duration-200 group ${className}`}
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
            <TrendingUp className="h-4 w-4 text-primary" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-medium text-foreground">Career Path Insights</h4>
              <Badge
                variant="secondary"
                className="gap-1 bg-primary/10 text-primary border-0 text-[10px] h-5 px-2"
              >
                <Sparkles className="h-2.5 w-2.5" />
                Market Data
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              View salary benchmarks & career progression for {getCareerStage()}
            </p>
          </div>
        </div>
        <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </motion.button>
  );
};

export default CareerInsightsCard;
