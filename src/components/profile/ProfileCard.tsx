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
}

export const ProfileCard = ({
  title,
  children,
  className,
  onEdit,
  editLabel = "Edit",
  headerAction,
  compact = false,
}: ProfileCardProps) => {
  return (
    <div
      className={cn(
        "bg-card rounded-xl border border-border shadow-card transition-shadow hover:shadow-elevated",
        compact ? "p-4" : "p-5 md:p-6",
        className
      )}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-heading font-semibold text-base md:text-lg text-foreground">
          {title}
        </h3>
        {headerAction}
        {onEdit && !headerAction && (
          <Button
            variant="ghost"
            size="sm"
            className="h-8 px-2 text-muted-foreground hover:text-foreground"
            onClick={onEdit}
          >
            <Edit2 className="h-4 w-4" />
            <span className="ml-1 hidden sm:inline">{editLabel}</span>
          </Button>
        )}
      </div>
      {children}
    </div>
  );
};

export default ProfileCard;
