import * as React from "react";
import { motion } from "framer-motion";
import { GraduationCap } from "lucide-react";

interface EducationItem {
  degree: string;
  institution: string;
  years: string;
}

interface EducationListProps {
  items: EducationItem[];
  emptyMessage?: string;
}

export const EducationList = ({
  items,
  emptyMessage = "Add your educational background.",
}: EducationListProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <GraduationCap className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="flex items-start gap-4 p-4 rounded-xl bg-secondary/30 border border-border/50 hover:border-border transition-colors"
        >
          <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-heading font-semibold text-foreground text-base mb-0.5">
              {item.degree}
            </h4>
            <p className="text-sm text-primary font-medium">{item.institution}</p>
            <p className="text-xs text-muted-foreground mt-1">{item.years}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default EducationList;