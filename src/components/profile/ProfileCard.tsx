import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Edit2 } from "lucide-react";

interface ProfileCardProps {
  title: string;
  children: React.ReactNode;
  className?: string;
  onEdit?: () => void;
  editLabel?: string;
  headerAction?: React.ReactNode;
  compact?: boolean;
  icon?: React.ReactNode;
}

export const ProfileCard = ({
  title,
  children,
  className,
  onEdit,
  editLabel = "Edit",
  headerAction,
  compact = false,
  icon,
}: ProfileCardProps) => {
  return (
    <div
      className={cn(
        "bg-card rounded-2xl border border-border shadow-card transition-all duration-200 hover:shadow-elevated hover:border-border/80",
        compact ? "p-4" : "p-5 md:p-6",
        className
      )}
    >
      {title && (
        <div className="flex items-center justify-between mb-5 pb-4 border-b border-border/50">
          <div className="flex items-center gap-3">
            {icon && (
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                {icon}
              </div>
            )}
            <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {headerAction}
            {onEdit && !headerAction && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-3 text-muted-foreground hover:text-foreground hover:bg-secondary"
                onClick={onEdit}
              >
                <Edit2 className="h-4 w-4" />
                <span className="ml-1.5 hidden sm:inline">{editLabel}</span>
              </Button>
            )}
          </div>
        </div>
      )}
      <div className={cn(title ? "" : "pt-0")}>{children}</div>
    </div>
  );
};

export default ProfileCard;