import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface TagsDisplayProps {
  tags: string[];
  emptyMessage?: string;
  variant?: "default" | "outline" | "secondary";
  className?: string;
}

export const TagsDisplay = ({
  tags,
  emptyMessage = "No items added yet.",
  variant = "secondary",
  className,
}: TagsDisplayProps) => {
  if (tags.length === 0) {
    return (
      <p className="text-sm text-muted-foreground text-center py-2">
        {emptyMessage}
      </p>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag, index) => (
        <Badge key={index} variant={variant} className="text-xs">
          {tag}
        </Badge>
      ))}
    </div>
  );
};

export default TagsDisplay;
