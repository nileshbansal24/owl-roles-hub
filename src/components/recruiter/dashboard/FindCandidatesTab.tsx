import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, X, UserSearch, Sparkles, ChevronLeft, ChevronRight, ArrowUpDown, Clock, User, Briefcase, MapPin } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CandidateCard from "./CandidateCard";
import SmartCandidateSearch from "./SmartCandidateSearch";
import { Checkbox } from "@/components/ui/checkbox";
import CandidateFiltersPanel, { type CandidateFilters, defaultFilters } from "./CandidateFiltersPanel";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/loading-skeleton";
import { staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import type { Profile } from "@/types/recruiter";

interface FindCandidatesTabProps {
  candidates: Profile[];
  savedCandidateIds: Set<string>;
  savedCandidateNotes: Record<string, string>;
  onViewCandidate: (candidate: Profile) => void;
  onSaveCandidate: (candidateId: string) => void;
  onMessageCandidate: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
  isLoading?: boolean;
  recruiterLocation?: string | null;
}

const CANDIDATES_PER_PAGE = 5;

type SortOption = "recent" | "experience-desc" | "experience-asc" | "name-asc" | "name-desc";

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: "recent", label: "Most Recent", icon: <Clock className="h-4 w-4" /> },
  { value: "experience-desc", label: "Experience (High to Low)", icon: <Briefcase className="h-4 w-4" /> },
  { value: "experience-asc", label: "Experience (Low to High)", icon: <Briefcase className="h-4 w-4" /> },
  { value: "name-asc", label: "Name (A-Z)", icon: <User className="h-4 w-4" /> },
  { value: "name-desc", label: "Name (Z-A)", icon: <User className="h-4 w-4" /> },
];

const FindCandidatesTab = ({
  candidates,
  savedCandidateIds,
  savedCandidateNotes,
  onViewCandidate,
  onSaveCandidate,
  onMessageCandidate,
  onSaveNote,
  isLoading = false,
  recruiterLocation,
}: FindCandidatesTabProps) => {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<Profile[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showNearMe, setShowNearMe] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<CandidateFilters>(defaultFilters);

  const handleSearchResults = useCallback((results: Profile[]) => {
    setSearchResults(results);
    setHasSearched(true);
    setCurrentPage(1);
  }, []);

  const handleSearching = useCallback((searching: boolean) => {
    setIsSearching(searching);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults(null);
    setHasSearched(false);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  // Helper: extract location tokens for proximity matching
  const getLocationTokens = useCallback((location: string | null): string[] => {
    if (!location) return [];
    return location
      .toLowerCase()
      .split(/[,\-\/\|]+/)
      .map(t => t.trim())
      .filter(t => t.length > 1);
  }, []);

  const recruiterTokens = useMemo(() => getLocationTokens(recruiterLocation ?? null), [recruiterLocation, getLocationTokens]);

  // Show search results if available, otherwise show all candidates
  const baseCandidates = searchResults !== null ? searchResults : candidates;

  // Apply "near me" filter
  const nearMeFiltered = useMemo(() => {
    if (!showNearMe || recruiterTokens.length === 0) return baseCandidates;
    return baseCandidates.filter(c => {
      const candidateTokens = getLocationTokens(c.location);
      return candidateTokens.some(ct => recruiterTokens.some(rt => ct.includes(rt) || rt.includes(ct)));
    });
  }, [baseCandidates, showNearMe, recruiterTokens, getLocationTokens]);

  // Apply advanced filters
  const filteredCandidates = useMemo(() => {
    let result = nearMeFiltered;

    // Experience range filter
    const [minExp, maxExp] = advancedFilters.experienceRange;
    if (minExp !== 0 || maxExp !== 30) {
      result = result.filter(c => {
        const exp = c.years_experience || 0;
        return exp >= minExp && (maxExp === 30 ? true : exp <= maxExp);
      });
    }

    // Skills filter
    if (advancedFilters.selectedSkills.length > 0) {
      result = result.filter(c => {
        const candidateSkills = (c.skills || []).map(s => s.trim().toLowerCase());
        return advancedFilters.selectedSkills.some(skill => candidateSkills.includes(skill));
      });
    }

    // Education level filter
    if (advancedFilters.educationLevel !== "all") {
      result = result.filter(c => {
        const bio = (c.bio || "").toLowerCase();
        const headline = (c.headline || "").toLowerCase();
        const role = (c.role || "").toLowerCase();
        const summary = (c.professional_summary || "").toLowerCase();
        const text = `${bio} ${headline} ${role} ${summary}`;
        
        switch (advancedFilters.educationLevel) {
          case "phd":
            return /\b(ph\.?d|doctorate|doctoral)\b/.test(text);
          case "masters":
            return /\b(master'?s?|m\.?s\.?|m\.?a\.?|m\.?tech|m\.?sc|mba)\b/.test(text);
          case "bachelors":
            return /\b(bachelor'?s?|b\.?s\.?|b\.?a\.?|b\.?tech|b\.?sc|b\.?e\.?)\b/.test(text);
          case "diploma":
            return /\b(diploma|certificate|certification)\b/.test(text);
          default:
            return true;
        }
      });
    }

    return result;
  }, [nearMeFiltered, advancedFilters]);

  // Sort candidates
  const sortedCandidates = useMemo(() => {
    const sorted = [...filteredCandidates];
    
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
      case "experience-desc":
        return sorted.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
      case "experience-asc":
        return sorted.sort((a, b) => (a.years_experience || 0) - (b.years_experience || 0));
      case "name-asc":
        return sorted.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
      case "name-desc":
        return sorted.sort((a, b) => (b.full_name || "").localeCompare(a.full_name || ""));
      default:
        return sorted;
    }
  }, [filteredCandidates, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(sortedCandidates.length / CANDIDATES_PER_PAGE);
  const startIndex = (currentPage - 1) * CANDIDATES_PER_PAGE;
  const endIndex = startIndex + CANDIDATES_PER_PAGE;
  const paginatedCandidates = sortedCandidates.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardListSkeleton count={4} />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Smart Candidate Search */}
      <SmartCandidateSearch
        candidates={candidates}
        onSearchResults={handleSearchResults}
        onSearching={handleSearching}
      />

      {/* Advanced Filters */}
      <motion.div variants={staggerItemVariants}>
        <CandidateFiltersPanel
          candidates={candidates}
          filters={advancedFilters}
          onFiltersChange={(f) => {
            setAdvancedFilters(f);
            setCurrentPage(1);
          }}
        />
      </motion.div>

      {/* Results Header with Sorting and Pagination Info */}
      <motion.div variants={staggerItemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            {hasSearched ? (
              <>
                Found <span className="font-medium text-foreground">{sortedCandidates.length}</span> matching candidates
              </>
            ) : (
              <>
                Candidate Pool: <span className="font-medium text-foreground">{sortedCandidates.length}</span> candidates
              </>
            )}
            {sortedCandidates.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                (Showing {startIndex + 1}-{Math.min(endIndex, sortedCandidates.length)} of {sortedCandidates.length})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Near Me Filter */}
          <label className="flex items-center gap-2 cursor-pointer select-none border border-border rounded-lg px-3 py-1.5 hover:bg-accent/50 transition-colors">
            <Checkbox
              checked={showNearMe}
              onCheckedChange={(checked) => {
                if (!recruiterLocation) {
                  toast({
                    title: "Location not set",
                    description: "Please update your location in your profile settings to use this filter.",
                    variant: "destructive",
                  });
                  return;
                }
                setShowNearMe(!!checked);
                setCurrentPage(1);
              }}
            />
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">Near Me</span>
          </label>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {hasSearched && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
              Clear Search
            </Button>
          )}
        </div>
      </motion.div>

      {/* Candidate Results */}
      <motion.div variants={staggerItemVariants} className="grid gap-4">
        {isSearching ? (
          <CardListSkeleton count={3} />
        ) : paginatedCandidates.length === 0 ? (
          hasSearched ? (
            <EmptyState
              icon={UserSearch}
              title="No matching candidates"
              description="We couldn't find any candidates matching your search criteria. Try adjusting your search terms."
              action={{
                label: "Clear Search",
                onClick: clearSearch,
                icon: X,
              }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No candidates available"
              description="There are no candidates in the database yet. Check back later as new professionals join the platform."
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>New candidates are added daily</span>
              </div>
            </EmptyState>
          )
        ) : (
          paginatedCandidates.map((candidate, index) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              index={index}
              isSaved={savedCandidateIds.has(candidate.id)}
              note={savedCandidateNotes[candidate.id]}
              onView={onViewCandidate}
              onSave={onSaveCandidate}
              onMessage={onMessageCandidate}
              onSaveNote={onSaveNote}
            />
          ))
        )}
      </motion.div>

      {/* Pagination Controls */}
      {sortedCandidates.length > CANDIDATES_PER_PAGE && (
        <motion.div 
          variants={staggerItemVariants} 
          className="flex items-center justify-center gap-4 pt-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FindCandidatesTab;
