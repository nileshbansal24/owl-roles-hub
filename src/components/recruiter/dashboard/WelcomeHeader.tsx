import { motion } from "framer-motion";
import { format } from "date-fns";
import { Activity } from "lucide-react";

interface WelcomeHeaderProps {
  name?: string;
}

const WelcomeHeader = ({ name }: WelcomeHeaderProps) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = name || "Recruiter";

  return (
    <motion.div
      initial={{ opacity: 0, y: -6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2"
    >
      <div className="space-y-0.5">
        <h2 className="text-lg sm:text-xl font-heading font-semibold text-foreground tracking-tight">
          {greeting}, {displayName}
        </h2>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>{format(new Date(), "EEEE, MMMM d, yyyy")}</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1">
            <Activity className="h-3 w-3 text-primary" />
            Hiring overview
          </span>
        </div>
      </div>
    </motion.div>
  );
};

export default WelcomeHeader;
