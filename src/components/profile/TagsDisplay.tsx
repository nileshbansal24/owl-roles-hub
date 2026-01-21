import * as React from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { Tag } from "lucide-react";

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
      <div className="text-center py-4">
        <div className="w-10 h-10 rounded-xl bg-secondary/50 flex items-center justify-center mx-auto mb-3">
          <Tag className="h-5 w-5 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground">
          {emptyMessage}
        </p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.03 }}
        >
          <Badge 
            variant={variant} 
            className="text-xs font-medium px-3 py-1.5 rounded-lg hover:bg-primary/10 transition-colors cursor-default"
          >
            {tag}
          </Badge>
        </motion.div>
      ))}
    </div>
  );
};

export default TagsDisplay;