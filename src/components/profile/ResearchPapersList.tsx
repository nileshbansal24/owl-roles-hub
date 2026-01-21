import * as React from "react";
import { ExternalLink, FileText, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResearchPaper {
  title: string;
  authors: string;
  date: string;
  doi?: string;
  journal?: string;
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

  // Generate a search URL for the paper (Google Scholar)
  const getSearchUrl = (title: string) => {
    return `https://scholar.google.com/scholar?q=${encodeURIComponent(title)}`;
  };

  // Generate DOI link
  const getDoiUrl = (doi: string) => {
    return `https://doi.org/${doi}`;
  };

  return (
    <div className="space-y-4">
      {papers.map((paper, index) => (
        <div
          key={index}
          className="border-b border-border last:border-0 pb-4 last:pb-0"
        >
          <a
            href={paper.doi ? getDoiUrl(paper.doi) : getSearchUrl(paper.title)}
            target="_blank"
            rel="noopener noreferrer"
            className="block group"
          >
            <h4 className="font-medium text-primary text-sm group-hover:underline cursor-pointer flex items-start gap-1.5">
              <span>"{paper.title}"</span>
              <ExternalLink className="h-3 w-3 shrink-0 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </h4>
          </a>
          <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-3 flex-wrap">
            <span>👤 {paper.authors}</span>
            <span>📅 Published: {paper.date}</span>
            {paper.journal && <span>📖 {paper.journal}</span>}
          </p>
          <div className="flex items-center gap-3 mt-2">
            {paper.doi ? (
              <a
                href={getDoiUrl(paper.doi)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1">
                  DOI: {paper.doi} <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            ) : (
              <a
                href={getSearchUrl(paper.title)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1">
                  <Search className="h-3 w-3" /> Find on Google Scholar
                </Button>
              </a>
            )}
            {paper.abstractUrl && (
              <a href={paper.abstractUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs">
                  View Abstract →
                </Button>
              </a>
            )}
            {paper.fullPaperUrl && (
              <a href={paper.fullPaperUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="link" size="sm" className="h-auto p-0 text-xs gap-1">
                  Full Paper <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ResearchPapersList;
