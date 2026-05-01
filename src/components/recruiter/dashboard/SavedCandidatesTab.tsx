import { motion } from "framer-motion";
import { Users, Bookmark, Search, Heart } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CandidateCard from "./CandidateCard";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/loading-skeleton";
import { staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import TabHeader from "./TabHeader";
import { Badge } from "@/components/ui/badge";
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
      <TabHeader
        icon={Bookmark}
        title="Saved Educators"
        description="Bookmark promising profiles and jot down private notes — only you can see them."
        badge={
          savedCandidates.length > 0 ? (
            <Badge variant="secondary" className="ml-1">
              {savedCandidates.length}
            </Badge>
          ) : null
        }
      />

      <motion.div variants={staggerItemVariants} className="card-elevated p-6">
        {savedCandidates.length > 0 && (
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              {withNotes.length} with notes • {withoutNotes.length} without notes
            </p>
          </div>
        )}
        
        {savedCandidates.length === 0 ? (
          <EmptyState
            icon={Heart}
            title="Your shortlist is empty"
            description="Save educators you'd like to come back to. Add private notes so you remember what made them stand out."
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
