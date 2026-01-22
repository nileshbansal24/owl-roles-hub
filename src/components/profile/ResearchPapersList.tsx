import * as React from "react";
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { ExternalLink, FileText, Search, BookOpen, Calendar, Users, Quote, ArrowUpDown, TrendingUp, SortAsc, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type SortOption = "date-desc" | "date-asc" | "citations" | "title";

const sortLabels: Record<SortOption, string> = {
  "date-desc": "Newest First",
  "date-asc": "Oldest First",
  "citations": "Most Cited",
  "title": "Title (A-Z)",
};

export const ResearchPapersList = ({
  papers,
  emptyMessage = "Add your research papers to showcase your academic contributions.",
}: ResearchPapersListProps) => {
  const [sortBy, setSortBy] = useState<SortOption>("date-desc");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredAndSortedPapers = useMemo(() => {
    // First filter by search query
    let filtered = papers;
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = papers.filter(paper => 
        paper.title.toLowerCase().includes(query) ||
        paper.authors.toLowerCase().includes(query) ||
        (paper.journal?.toLowerCase().includes(query) ?? false)
      );
    }
    
    // Then sort
    const sorted = [...filtered];
    switch (sortBy) {
      case "date-desc":
        return sorted.sort((a, b) => {
          const yearA = parseInt(a.date) || 0;
          const yearB = parseInt(b.date) || 0;
          return yearB - yearA;
        });
      case "date-asc":
        return sorted.sort((a, b) => {
          const yearA = parseInt(a.date) || 0;
          const yearB = parseInt(b.date) || 0;
          return yearA - yearB;
        });
      case "citations":
        return sorted.sort((a, b) => (b.citations || 0) - (a.citations || 0));
      case "title":
        return sorted.sort((a, b) => a.title.localeCompare(b.title));
      default:
        return sorted;
    }
  }, [papers, sortBy, searchQuery]);

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

  const getSortIcon = () => {
    switch (sortBy) {
      case "citations":
        return <TrendingUp className="h-3.5 w-3.5" />;
      case "title":
        return <SortAsc className="h-3.5 w-3.5" />;
      default:
        return <Calendar className="h-3.5 w-3.5" />;
    }
  };

  return (
    <div className="space-y-4">
      {/* Search and Sort Controls */}
      {papers.length > 1 && (
        <div className="space-y-3">
          {/* Search Input */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by title, author, or journal..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-9 h-9 text-sm"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0"
                onClick={() => setSearchQuery("")}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
          
          {/* Count and Sort */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {searchQuery ? `${filteredAndSortedPapers.length} of ${papers.length}` : papers.length} publication{papers.length !== 1 ? 's' : ''}
            </span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 text-xs gap-1.5 text-muted-foreground hover:text-foreground">
                  {getSortIcon()}
                  {sortLabels[sortBy]}
                  <ArrowUpDown className="h-3 w-3 ml-1" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-40">
                <DropdownMenuItem 
                  onClick={() => setSortBy("date-desc")}
                  className={sortBy === "date-desc" ? "bg-primary/10" : ""}
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  Newest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("date-asc")}
                  className={sortBy === "date-asc" ? "bg-primary/10" : ""}
                >
                  <Calendar className="h-3.5 w-3.5 mr-2" />
                  Oldest First
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("citations")}
                  className={sortBy === "citations" ? "bg-primary/10" : ""}
                >
                  <TrendingUp className="h-3.5 w-3.5 mr-2" />
                  Most Cited
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => setSortBy("title")}
                  className={sortBy === "title" ? "bg-primary/10" : ""}
                >
                  <SortAsc className="h-3.5 w-3.5 mr-2" />
                  Title (A-Z)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      )}

      {/* No Results Message */}
      {searchQuery && filteredAndSortedPapers.length === 0 && (
        <div className="text-center py-8">
          <Search className="h-8 w-8 text-muted-foreground mx-auto mb-3 opacity-50" />
          <p className="text-sm text-muted-foreground">No publications match "{searchQuery}"</p>
          <Button 
            variant="link" 
            size="sm" 
            className="mt-1 text-xs"
            onClick={() => setSearchQuery("")}
          >
            Clear search
          </Button>
        </div>
      )}

      {/* Papers List */}
      {filteredAndSortedPapers.map((paper, index) => (
        <motion.div
          key={`${paper.title}-${index}`}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
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
