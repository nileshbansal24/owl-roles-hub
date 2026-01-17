import * as React from "react";
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
      <div className="text-center py-6">
        <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {items.map((item, index) => (
        <div key={index} className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <GraduationCap className="h-4 w-4 text-primary" />
          </div>
          <div>
            <h4 className="font-medium text-foreground text-sm">{item.degree}</h4>
            <p className="text-sm text-primary">{item.institution}</p>
            <p className="text-xs text-muted-foreground">{item.years}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default EducationList;
