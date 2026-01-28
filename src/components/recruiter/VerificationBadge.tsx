import { CheckCircle2, Clock, XCircle, Shield } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

type VerificationStatus = "verified" | "pending" | "rejected" | "none";

interface VerificationBadgeProps {
  status: VerificationStatus;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
}

const statusConfig = {
  verified: {
    icon: CheckCircle2,
    label: "Verified Institution",
    description: "This recruiter is from a verified educational institution",
    bgColor: "bg-emerald-500/10",
    textColor: "text-emerald-600 dark:text-emerald-400",
    borderColor: "border-emerald-500/30",
  },
  pending: {
    icon: Clock,
    label: "Verification Pending",
    description: "Institution verification is being reviewed",
    bgColor: "bg-amber-500/10",
    textColor: "text-amber-600 dark:text-amber-400",
    borderColor: "border-amber-500/30",
  },
  rejected: {
    icon: XCircle,
    label: "Not Verified",
    description: "Institution verification was not approved",
    bgColor: "bg-destructive/10",
    textColor: "text-destructive",
    borderColor: "border-destructive/30",
  },
  none: {
    icon: Shield,
    label: "Unverified",
    description: "This institution has not been verified yet",
    bgColor: "bg-muted",
    textColor: "text-muted-foreground",
    borderColor: "border-border",
  },
};

const sizeConfig = {
  sm: {
    iconSize: "h-3.5 w-3.5",
    padding: "px-2 py-0.5",
    text: "text-xs",
    gap: "gap-1",
  },
  md: {
    iconSize: "h-4 w-4",
    padding: "px-2.5 py-1",
    text: "text-sm",
    gap: "gap-1.5",
  },
  lg: {
    iconSize: "h-5 w-5",
    padding: "px-3 py-1.5",
    text: "text-sm",
    gap: "gap-2",
  },
};

const VerificationBadge = ({
  status,
  size = "md",
  showLabel = true,
  className,
}: VerificationBadgeProps) => {
  const config = statusConfig[status];
  const sizeStyles = sizeConfig[size];
  const Icon = config.icon;

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div
            className={cn(
              "inline-flex items-center rounded-full border font-medium transition-colors",
              config.bgColor,
              config.textColor,
              config.borderColor,
              sizeStyles.padding,
              sizeStyles.text,
              sizeStyles.gap,
              className
            )}
          >
            <Icon className={sizeStyles.iconSize} />
            {showLabel && <span>{config.label}</span>}
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>{config.description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};

export default VerificationBadge;
