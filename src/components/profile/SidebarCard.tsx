import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
  icon?: React.ReactNode;
}

export const SidebarCard = ({
  title,
  children,
  className,
  headerAction,
  defaultExpanded = true,
  collapsible = true,
  icon,
}: SidebarCardProps) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  
  // On mobile, cards are collapsible by default
  const shouldCollapse = collapsible && isMobile;

  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border shadow-card transition-all duration-200 hover:shadow-elevated overflow-hidden",
        className
      )}
    >
      <div 
        className={cn(
          "flex items-center justify-between p-4",
          shouldCollapse && "cursor-pointer active:bg-secondary/30 transition-colors"
        )}
        onClick={shouldCollapse ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <div className="flex items-center gap-2.5">
          {icon && (
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
              {icon}
            </div>
          )}
          <h3 className="font-heading font-semibold text-sm md:text-base text-foreground">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {headerAction}
          {shouldCollapse && (
            <Button variant="ghost" size="sm" className="h-7 w-7 p-0 text-muted-foreground">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      <AnimatePresence initial={false}>
        {(!shouldCollapse || isExpanded) && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: "easeInOut" }}
          >
            <div className="px-4 pb-4 pt-1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default SidebarCard;