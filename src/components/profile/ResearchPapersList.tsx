import * as React from "react";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Search, BookOpen, Calendar, Users, Quote } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ResearchPaper {
  title: string;
  authors: string;
  date: string;
  doi?: string;
  journal?: string;
  abstractUrl?: string;
  fullPaperUrl?: string;
  citations?: number;
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
      <div className="text-center py-8">
        <div className="w-14 h-14 rounded-2xl bg-secondary/50 flex items-center justify-center mx-auto mb-4">
          <BookOpen className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground max-w-xs mx-auto">{emptyMessage}</p>
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
        <motion.div
          key={index}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.08 }}
          className="p-5 rounded-xl bg-secondary/20 border border-border/50 hover:border-primary/30 hover:shadow-sm transition-all group"
        >
          <div className="flex items-start justify-between gap-3">
            <a
              href={paper.doi ? getDoiUrl(paper.doi) : getSearchUrl(paper.title)}
              target="_blank"
              rel="noopener noreferrer"
              className="block flex-1"
            >
              <h4 className="font-heading font-semibold text-foreground text-base leading-snug group-hover:text-primary transition-colors flex items-start gap-2">
                <FileText className="h-4 w-4 shrink-0 mt-1 text-primary" />
                <span>"{paper.title}"</span>
              </h4>
            </a>
            
            {/* Citation Badge */}
            {paper.citations !== undefined && paper.citations >= 0 && (
              <Badge 
                variant="secondary" 
                className="shrink-0 bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20 gap-1"
              >
                <Quote className="h-3 w-3" />
                {paper.citations} {paper.citations === 1 ? 'citation' : 'citations'}
              </Badge>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Users className="h-3.5 w-3.5" />
              <span className="truncate max-w-[200px]">{paper.authors}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Calendar className="h-3.5 w-3.5" />
              <span>{paper.date}</span>
            </div>
            {paper.journal && (
              <div className="flex items-center gap-1.5">
                <BookOpen className="h-3.5 w-3.5" />
                <span className="italic">{paper.journal}</span>
              </div>
            )}
          </div>
          
          <div className="flex flex-wrap items-center gap-3 mt-4 pt-3 border-t border-border/30">
            {paper.doi ? (
              <a
                href={getDoiUrl(paper.doi)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 hover:bg-primary/5">
                  <ExternalLink className="h-3.5 w-3.5" />
                  DOI: {paper.doi}
                </Button>
              </a>
            ) : (
              <a
                href={getSearchUrl(paper.title)}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5 hover:bg-primary/5">
                  <Search className="h-3.5 w-3.5" />
                  Find on Google Scholar
                </Button>
              </a>
            )}
            {paper.abstractUrl && (
              <a href={paper.abstractUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-8 text-xs">
                  View Abstract →
                </Button>
              </a>
            )}
            {paper.fullPaperUrl && (
              <a href={paper.fullPaperUrl} target="_blank" rel="noopener noreferrer">
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5">
                  Full Paper <ExternalLink className="h-3 w-3" />
                </Button>
              </a>
            )}
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default ResearchPapersList;