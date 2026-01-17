import * as React from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  headerAction?: React.ReactNode;
  defaultExpanded?: boolean;
  collapsible?: boolean;
}

export const SidebarCard = ({
  title,
  children,
  className,
  headerAction,
  defaultExpanded = true,
  collapsible = true,
}: SidebarCardProps) => {
  const isMobile = useIsMobile();
  const [isExpanded, setIsExpanded] = React.useState(defaultExpanded);
  
  // On mobile, cards are collapsible by default
  const shouldCollapse = collapsible && isMobile;

  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border shadow-card transition-shadow hover:shadow-elevated",
        className
      )}
    >
      <div 
        className={cn(
          "flex items-center justify-between p-4",
          shouldCollapse && "cursor-pointer"
        )}
        onClick={shouldCollapse ? () => setIsExpanded(!isExpanded) : undefined}
      >
        <h3 className="font-heading font-semibold text-sm md:text-base text-foreground">
          {title}
        </h3>
        <div className="flex items-center gap-2">
          {headerAction}
          {shouldCollapse && (
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              {isExpanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
        </div>
      </div>
      {(!shouldCollapse || isExpanded) && (
        <div className="px-4 pb-4">
          {children}
        </div>
      )}
    </div>
  );
};

export default SidebarCard;
