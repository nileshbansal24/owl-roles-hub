import { motion } from "framer-motion";
import { format } from "date-fns";
import { Sparkles } from "lucide-react";

interface WelcomeHeaderProps {
  name?: string;
}

const WelcomeHeader = ({ name }: WelcomeHeaderProps) => {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";
  const displayName = name || "Recruiter";

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-1"
    >
      <div>
        <div className="flex items-center gap-2">
          <h2 className="text-xl sm:text-2xl font-heading font-bold text-foreground">
            {greeting}, {displayName}
          </h2>
          <motion.div
            animate={{ rotate: [0, 14, -8, 14, -4, 10, 0] }}
            transition={{ duration: 2.5, delay: 0.5 }}
          >
            <Sparkles className="h-5 w-5 text-primary" />
          </motion.div>
        </div>
        <p className="text-sm text-muted-foreground mt-0.5">
          {format(new Date(), "EEEE, MMMM d, yyyy")} — Here's your hiring overview
        </p>
      </div>
    </motion.div>
  );
};

export default WelcomeHeader;
