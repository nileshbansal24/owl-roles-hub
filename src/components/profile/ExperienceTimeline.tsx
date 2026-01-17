import * as React from "react";
import { motion } from "framer-motion";

interface ExperienceItem {
  year: string;
  role: string;
  institution: string;
  description: string;
  isCurrent: boolean;
}

interface ExperienceTimelineProps {
  items: ExperienceItem[];
  emptyMessage?: string;
}

export const ExperienceTimeline = ({
  items,
  emptyMessage = "Add your work experience to showcase your career journey.",
}: ExperienceTimelineProps) => {
  if (items.length === 0) {
    return (
      <div className="text-center py-6">
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
      <div className="space-y-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className="relative pl-8"
          >
            <div
              className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${
                item.isCurrent
                  ? "bg-primary border-primary"
                  : "bg-background border-muted-foreground/30"
              }`}
            />
            <div>
              <h4 className="font-heading font-semibold text-foreground text-sm md:text-base">
                {item.role}
              </h4>
              <p className="text-sm text-primary">{item.institution}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{item.year}</p>
              {item.description && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {item.description}
                </p>
              )}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default ExperienceTimeline;
