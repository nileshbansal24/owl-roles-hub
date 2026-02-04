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
  // Helper function to detect if role is teaching or non-teaching
  const isTeachingRole = (role: string | null | undefined): boolean => {
    if (!role) return true;
    const roleLower = role.toLowerCase();
    
    const nonTeachingKeywords = [
      "hr", "human resource", "admin", "administrator", "finance", "accounts",
      "purchase", "procurement", "registrar", "librarian", "it ", "maintenance",
      "security", "transport", "hostel", "placement", "training", "tpo", "counselor"
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
    
    // Check for generic admin roles (manager, executive, coordinator without teaching context)
    if ((roleLower.includes("manager") || roleLower.includes("executive") || roleLower.includes("coordinator") || roleLower.includes("officer"))
        && !roleLower.includes("academic")) {
      return false;
    }
    
    return true;
  };

  const isTeaching = isTeachingRole(currentRole);

  // Determine career stage based on role
  const getCareerStage = () => {
    const role = (currentRole || "").toLowerCase();
    
    if (isTeaching) {
      if (role.includes("director") || role.includes("executive")) return "Senior Leadership";
      if (role.includes("hod") || role.includes("head") || role.includes("dean")) return "Leadership";
      if (role.includes("professor") && !role.includes("assistant") && !role.includes("associate")) return "Senior Faculty";
      if (role.includes("associate")) return "Mid-Level Faculty";
      return "Early Career Faculty";
    } else {
      if (role.includes("gm") || role.includes("director")) return "Executive Leadership";
      if (role.includes("agm") || role.includes("dgm") || role.includes("senior manager")) return "Senior Management";
      if (role.includes("manager")) return "Management";
      if (role.includes("senior") || role.includes("sr.")) return "Senior Professional";
      return "Professional";
    }
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
