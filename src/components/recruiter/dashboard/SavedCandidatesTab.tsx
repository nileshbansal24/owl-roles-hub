import { motion } from "framer-motion";
import { Users, Bookmark, Search, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CandidateCard from "./CandidateCard";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/loading-skeleton";
import { staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import type { Profile } from "@/types/recruiter";

interface SavedCandidatesTabProps {
  candidates: Profile[];
  savedCandidateIds: Set<string>;
  savedCandidateNotes: Record<string, string>;
  onViewCandidate: (candidate: Profile) => void;
  onSaveCandidate: (candidateId: string) => void;
  onMessageCandidate: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
  isLoading?: boolean;
}

const SavedCandidatesTab = ({
  candidates,
  savedCandidateIds,
  savedCandidateNotes,
  onViewCandidate,
  onSaveCandidate,
  onMessageCandidate,
  onSaveNote,
  isLoading = false,
}: SavedCandidatesTabProps) => {
  const navigate = useNavigate();
  const savedCandidates = candidates.filter((c) => savedCandidateIds.has(c.id));
  
  // Group by notes (candidates with notes first)
  const withNotes = savedCandidates.filter(c => savedCandidateNotes[c.id]);
  const withoutNotes = savedCandidates.filter(c => !savedCandidateNotes[c.id]);

  if (isLoading) {
    return <CardListSkeleton count={3} />;
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={staggerItemVariants} className="card-elevated p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-heading font-semibold text-lg flex items-center gap-2">
            <Bookmark className="h-5 w-5 text-primary" />
            Saved Candidates
            {savedCandidates.length > 0 && (
              <span className="ml-2 bg-primary/10 text-primary text-sm px-2 py-0.5 rounded-full">
                {savedCandidates.length}
              </span>
            )}
          </h3>
          {savedCandidates.length > 0 && (
            <p className="text-sm text-muted-foreground">
              {withNotes.length} with notes
            </p>
          )}
        </div>
        
        {savedCandidates.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="No saved candidates yet"
            description="Save candidates you're interested in to keep track of them. You can add private notes to remember why they stood out."
            action={{
              label: "Find Candidates",
              onClick: () => navigate("/recruiter-dashboard?tab=resdex"),
              icon: Search,
            }}
            className="py-8"
          >
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tip: Click the bookmark icon on any candidate card to save them
            </p>
          </EmptyState>
        ) : (
          <div className="grid gap-4">
            {/* Candidates with notes first */}
            {withNotes.length > 0 && (
              <>
                {withNotes.map((candidate, index) => (
                  <motion.div
                    key={candidate.id}
                    whileHover={{ y: -2 }}
                    transition={{ duration: 0.2 }}
                  >
                    <CandidateCard
                      candidate={candidate}
                      index={index}
                      isSaved={true}
                      note={savedCandidateNotes[candidate.id]}
                      onView={onViewCandidate}
                      onSave={onSaveCandidate}
                      onMessage={onMessageCandidate}
                      onSaveNote={onSaveNote}
                    />
                  </motion.div>
                ))}
              </>
            )}
            
            {/* Separator if both groups exist */}
            {withNotes.length > 0 && withoutNotes.length > 0 && (
              <div className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">
                  {withoutNotes.length} without notes
                </span>
                <div className="flex-1 h-px bg-border" />
              </div>
            )}
            
            {/* Candidates without notes */}
            {withoutNotes.map((candidate, index) => (
              <motion.div
                key={candidate.id}
                whileHover={{ y: -2 }}
                transition={{ duration: 0.2 }}
              >
                <CandidateCard
                  candidate={candidate}
                  index={withNotes.length + index}
                  isSaved={true}
                  note={savedCandidateNotes[candidate.id]}
                  onView={onViewCandidate}
                  onSave={onSaveCandidate}
                  onMessage={onMessageCandidate}
                  onSaveNote={onSaveNote}
                />
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SavedCandidatesTab;
