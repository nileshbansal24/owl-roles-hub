import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bookmark, Search, Heart, Users, CheckCircle2, HelpCircle, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CandidateCard from "./CandidateCard";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/loading-skeleton";
import { staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import TabHeader from "./TabHeader";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import type { Profile } from "@/types/recruiter";

interface SavedCandidatesTabProps {
  candidates: Profile[];
  savedCandidateIds: Set<string>;
  savedCandidateNotes: Record<string, string>;
  savedCandidateStatuses?: Record<string, string>;
  onViewCandidate: (candidate: Profile) => void;
  onSaveCandidate: (candidateId: string) => void;
  onMessageCandidate: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
  onSetStatus?: (candidateId: string, status: string) => void | Promise<void>;
  isLoading?: boolean;
}

type StatusFilter = "all" | "shortlisted" | "maybe" | "saved" | "rejected";

const SavedCandidatesTab = ({
  candidates,
  savedCandidateIds,
  savedCandidateNotes,
  savedCandidateStatuses = {},
  onViewCandidate,
  onSaveCandidate,
  onMessageCandidate,
  onSaveNote,
  onSetStatus,
  isLoading = false,
}: SavedCandidatesTabProps) => {
  const navigate = useNavigate();
  const [filter, setFilter] = useState<StatusFilter>("all");

  const savedCandidates = useMemo(
    () => candidates.filter((c) => savedCandidateIds.has(c.id)),
    [candidates, savedCandidateIds],
  );

  const counts = useMemo(() => {
    const c: Record<StatusFilter, number> = { all: savedCandidates.length, shortlisted: 0, maybe: 0, saved: 0, rejected: 0 };
    savedCandidates.forEach((cand) => {
      const s = (savedCandidateStatuses[cand.id] || "saved") as StatusFilter;
      if (s in c) c[s]++;
    });
    return c;
  }, [savedCandidates, savedCandidateStatuses]);

  const visible = useMemo(() => {
    if (filter === "all") return savedCandidates;
    return savedCandidates.filter((c) => (savedCandidateStatuses[c.id] || "saved") === filter);
  }, [savedCandidates, savedCandidateStatuses, filter]);

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
        title="My Talent Board"
        description="Organise saved educators into Shortlisted, Maybe, and Rejected — only you can see this."
        badge={
          savedCandidates.length > 0 ? (
            <Badge variant="secondary" className="ml-1">{savedCandidates.length}</Badge>
          ) : null
        }
      />

      {savedCandidates.length === 0 ? (
        <motion.div variants={staggerItemVariants} className="card-elevated p-6">
          <EmptyState
            icon={Heart}
            title="Your shortlist is empty"
            description="Save educators you'd like to come back to, then mark them as Shortlisted, Maybe, or Rejected."
            action={{
              label: "Find Candidates",
              onClick: () => navigate("/recruiter-dashboard?tab=resdex"),
              icon: Search,
            }}
            className="py-8"
          >
            <p className="text-xs text-muted-foreground mt-2">
              💡 Tip: Use the Shortlist / Maybe / Reject buttons on any candidate card.
            </p>
          </EmptyState>
        </motion.div>
      ) : (
        <motion.div variants={staggerItemVariants} className="space-y-4">
          <Tabs value={filter} onValueChange={(v) => setFilter(v as StatusFilter)}>
            <TabsList className="grid grid-cols-5 w-full">
              <TabsTrigger value="all" className="gap-1.5">
                <Users className="h-3.5 w-3.5" /> All
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{counts.all}</Badge>
              </TabsTrigger>
              <TabsTrigger value="shortlisted" className="gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5" /> Shortlisted
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{counts.shortlisted}</Badge>
              </TabsTrigger>
              <TabsTrigger value="maybe" className="gap-1.5">
                <HelpCircle className="h-3.5 w-3.5" /> Maybe
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{counts.maybe}</Badge>
              </TabsTrigger>
              <TabsTrigger value="saved" className="gap-1.5">
                <Bookmark className="h-3.5 w-3.5" /> Saved
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{counts.saved}</Badge>
              </TabsTrigger>
              <TabsTrigger value="rejected" className="gap-1.5">
                <XCircle className="h-3.5 w-3.5" /> Rejected
                <Badge variant="secondary" className="ml-1 h-4 px-1.5 text-[10px]">{counts.rejected}</Badge>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={filter} className="mt-4">
              {visible.length === 0 ? (
                <div className="card-elevated p-6">
                  <EmptyState
                    icon={Bookmark}
                    title="Nothing here yet"
                    description="No candidates match this status. Try a different tab or mark candidates from Find Educators."
                    className="py-6"
                  />
                </div>
              ) : (
                <div className="grid gap-4">
                  {visible.map((candidate, index) => (
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
                        savedStatus={savedCandidateStatuses[candidate.id] || "saved"}
                        onView={onViewCandidate}
                        onSave={onSaveCandidate}
                        onMessage={onMessageCandidate}
                        onSaveNote={onSaveNote}
                        onSetStatus={onSetStatus}
                      />
                    </motion.div>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      )}
    </motion.div>
  );
};

export default SavedCandidatesTab;
