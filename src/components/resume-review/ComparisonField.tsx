import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { ArrowRight, Check, X } from "lucide-react";

interface ComparisonFieldProps {
  label: string;
  currentValue: ReactNode;
  newValue: ReactNode;
  hasChange: boolean;
  type?: "text" | "list" | "complex";
}

export function ComparisonField({
  label,
  currentValue,
  newValue,
  hasChange,
  type = "text",
}: ComparisonFieldProps) {
  return (
    <div className="grid grid-cols-[1fr,auto,1fr] gap-3 items-start py-3 border-b border-border/50 last:border-0">
      {/* Current Value */}
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          Current
        </span>
        <div
          className={cn(
            "text-sm p-2 rounded-md min-h-[2.5rem] flex items-center",
            hasChange
              ? "bg-muted/50 text-muted-foreground"
              : "bg-muted/30"
          )}
        >
          {currentValue || (
            <span className="text-muted-foreground/50 italic">Empty</span>
          )}
        </div>
      </div>

      {/* Arrow indicator */}
      <div className="flex items-center justify-center pt-6">
        {hasChange ? (
          <ArrowRight className="h-4 w-4 text-primary" />
        ) : (
          <Check className="h-4 w-4 text-muted-foreground/40" />
        )}
      </div>

      {/* New Value */}
      <div className="space-y-1">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
          From Resume
        </span>
        <div
          className={cn(
            "text-sm p-2 rounded-md min-h-[2.5rem] flex items-center",
            hasChange
              ? "bg-primary/10 border border-primary/20 text-foreground font-medium"
              : "bg-muted/30"
          )}
        >
          {newValue || (
            <span className="text-muted-foreground/50 italic">Not extracted</span>
          )}
        </div>
      </div>
    </div>
  );
}

interface ComparisonSectionProps {
  title: string;
  children: ReactNode;
}

export function ComparisonSection({ title, children }: ComparisonSectionProps) {
  return (
    <div className="space-y-2">
      <h4 className="font-semibold text-sm text-foreground">{title}</h4>
      <div className="space-y-0">{children}</div>
    </div>
  );
}
