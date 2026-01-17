import * as React from "react";
import { ExternalLink, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResearchPaper {
  title: string;
  authors: string;
  date: string;
  abstractUrl?: string;
  fullPaperUrl?: string;
}

interface ResearchPapersListProps {
  papers: ResearchPaper[];
  emptyMessage?: string;
}

export const ResearchPapersList = ({
  papers,
  emptyMessage = "Add your research papers to showcase your academic contributions.",
}: ResearchPapersListProps) => {
  if (papers.length === 0) {
    return (
      <div className="text-center py-6">
        <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {papers.map((paper, index) => (
        <div
          key={index}
          className="border-b border-border last:border-0 pb-4 last:pb-0"
        >
          <h4 className="font-medium text-primary text-sm hover:underline cursor-pointer">
            "{paper.title}"
          </h4>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-3">
            <span>👤 {paper.authors}</span>
            <span>📅 Published: {paper.date}</span>
          </p>
          <div className="flex items-center gap-3 mt-2">
            {paper.abstractUrl && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                View Abstract →
              </Button>
            )}
            {paper.fullPaperUrl && (
              <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1">
                Full Paper <ExternalLink className="h-3 w-3" />
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResearchPapersList;
