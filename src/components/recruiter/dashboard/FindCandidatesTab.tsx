import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, X, UserSearch, Sparkles } from "lucide-react";
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

  const handleSearchResults = useCallback((results: Profile[]) => {
    setSearchResults(results);
    setHasSearched(true);
  }, []);

  const handleSearching = useCallback((searching: boolean) => {
    setIsSearching(searching);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults(null);
    setHasSearched(false);
  }, []);

  // Show search results if available, otherwise show all candidates
  const displayedCandidates = searchResults !== null ? searchResults : candidates;

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

      {/* Results Header */}
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
                Showing <span className="font-medium text-foreground">{displayedCandidates.length}</span> candidates
              </>
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
        ) : displayedCandidates.length === 0 ? (
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
          displayedCandidates.map((candidate, index) => (
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
    </motion.div>
  );
};

export default FindCandidatesTab;
