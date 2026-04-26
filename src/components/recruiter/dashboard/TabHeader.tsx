import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface TabHeaderProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  badge?: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}

/**
 * Consistent header for every tab in the recruiter dashboard.
 * Provides title, optional description, badge, and trailing actions.
 */
const TabHeader = ({ icon: Icon, title, description, badge, actions, className }: TabHeaderProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className={cn(
        "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-1",
        className,
      )}
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Icon className="h-4 w-4 text-primary" />
            </div>
          )}
          <h2 className="font-heading font-semibold text-lg sm:text-xl text-foreground tracking-tight truncate">
            {title}
          </h2>
          {badge}
        </div>
        {description && (
          <p className="text-sm text-muted-foreground mt-1 sm:ml-[42px]">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex items-center gap-2 shrink-0">{actions}</div>}
    </motion.div>
  );
};

export default TabHeader;
