import * as React from "react";
import { motion } from "framer-motion";
import { Briefcase } from "lucide-react";

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
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <Briefcase className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-[11px] top-3 bottom-3 w-0.5 bg-gradient-to-b from-primary/30 via-border to-border" />
      
      <div className="space-y-6">
        {items.map((item, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, x: -15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1, duration: 0.3 }}
            className="relative pl-10"
          >
            {/* Timeline dot */}
            <div
              className={`absolute left-0 top-1 w-6 h-6 rounded-full flex items-center justify-center ${
                item.isCurrent
                  ? "bg-primary shadow-lg shadow-primary/30"
                  : "bg-secondary border-2 border-border"
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${item.isCurrent ? "bg-white" : "bg-muted-foreground/40"}`} />
            </div>
            
            <div className="bg-secondary/30 rounded-xl p-4 border border-border/50 hover:border-border transition-colors">
              <div className="flex items-start justify-between gap-3 mb-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-heading font-semibold text-foreground text-base">
                    {item.role}
                  </h4>
                  <p className="text-sm text-primary font-medium">{item.institution}</p>
                </div>
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                  item.isCurrent 
                    ? "bg-primary/10 text-primary" 
                    : "bg-secondary text-muted-foreground"
                }`}>
                  {item.year}
                </span>
              </div>
              {item.description && (
                <p className="text-sm text-muted-foreground leading-relaxed">
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