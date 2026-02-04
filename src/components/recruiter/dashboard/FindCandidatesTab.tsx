import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, X, UserSearch, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import CandidateCard from "./CandidateCard";
import SmartCandidateSearch from "./SmartCandidateSearch";
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
}

const CANDIDATES_PER_PAGE = 5;

const FindCandidatesTab = ({
  candidates,
  savedCandidateIds,
  savedCandidateNotes,
  onViewCandidate,
  onSaveCandidate,
  onMessageCandidate,
  onSaveNote,
  isLoading = false,
}: FindCandidatesTabProps) => {
  const [searchResults, setSearchResults] = useState<Profile[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const handleSearchResults = useCallback((results: Profile[]) => {
    setSearchResults(results);
    setHasSearched(true);
    setCurrentPage(1); // Reset to first page on new search
  }, []);

  const handleSearching = useCallback((searching: boolean) => {
    setIsSearching(searching);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults(null);
    setHasSearched(false);
    setCurrentPage(1);
  }, []);

  // Show search results if available, otherwise show all candidates
  const displayedCandidates = searchResults !== null ? searchResults : candidates;
  
  // Pagination logic
  const totalPages = Math.ceil(displayedCandidates.length / CANDIDATES_PER_PAGE);
  const startIndex = (currentPage - 1) * CANDIDATES_PER_PAGE;
  const endIndex = startIndex + CANDIDATES_PER_PAGE;
  const paginatedCandidates = displayedCandidates.slice(startIndex, endIndex);

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

      {/* Results Header with Pagination Info */}
      <motion.div variants={staggerItemVariants} className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            {hasSearched ? (
              <>
                Found <span className="font-medium text-foreground">{displayedCandidates.length}</span> matching candidates
              </>
            ) : (
              <>
                Candidate Pool: <span className="font-medium text-foreground">{displayedCandidates.length}</span> candidates
              </>
            )}
            {displayedCandidates.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                (Showing {startIndex + 1}-{Math.min(endIndex, displayedCandidates.length)} of {displayedCandidates.length})
              </span>
            )}
          </p>
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
      {displayedCandidates.length > CANDIDATES_PER_PAGE && (
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
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <Button
                key={page}
                variant={currentPage === page ? "default" : "outline"}
                size="sm"
                className="w-8 h-8 p-0"
                onClick={() => setCurrentPage(page)}
              >
                {page}
              </Button>
            ))}
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
