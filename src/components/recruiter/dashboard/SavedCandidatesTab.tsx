import { motion } from "framer-motion";
import { Users, Bookmark } from "lucide-react";
import CandidateCard from "./CandidateCard";
import { containerVariants, itemVariants } from "@/types/recruiter";
import type { Profile } from "@/types/recruiter";

interface SavedCandidatesTabProps {
  candidates: Profile[];
  savedCandidateIds: Set<string>;
  savedCandidateNotes: Record<string, string>;
  onViewCandidate: (candidate: Profile) => void;
  onSaveCandidate: (candidateId: string) => void;
  onMessageCandidate: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
}

const SavedCandidatesTab = ({
  candidates,
  savedCandidateIds,
  savedCandidateNotes,
  onViewCandidate,
  onSaveCandidate,
  onMessageCandidate,
  onSaveNote,
}: SavedCandidatesTabProps) => {
  const savedCandidates = candidates.filter((c) => savedCandidateIds.has(c.id));

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      <motion.div variants={itemVariants} className="card-elevated p-6">
        <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <Bookmark className="h-5 w-5 text-primary" />
          Saved Candidates ({savedCandidates.length})
        </h3>
        
        {savedCandidates.length === 0 ? (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No saved candidates yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Save candidates from the Find Candidates tab.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {savedCandidates.map((candidate, index) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                index={index}
                isSaved={true}
                note={savedCandidateNotes[candidate.id]}
                onView={onViewCandidate}
                onSave={onSaveCandidate}
                onMessage={onMessageCandidate}
                onSaveNote={onSaveNote}
              />
            ))}
          </div>
        )}
      </motion.div>
    </motion.div>
  );
};

export default SavedCandidatesTab;
