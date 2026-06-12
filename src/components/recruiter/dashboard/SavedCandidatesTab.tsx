import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { Bookmark, Search, Heart, Folder, Inbox } from "lucide-react";
import { useNavigate } from "react-router-dom";
import CandidateCard from "./CandidateCard";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton } from "@/components/ui/loading-skeleton";
import { staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import TabHeader from "./TabHeader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import type { Profile } from "@/types/recruiter";

interface SavedCandidatesTabProps {
  candidates: Profile[];
  savedCandidateIds: Set<string>;
  savedCandidateNotes: Record<string, string>;
  savedCandidateStatuses?: Record<string, string>;
  savedCandidateFolders?: Record<string, string>;
  onViewCandidate: (candidate: Profile) => void;
  onSaveCandidate: (candidateId: string) => void;
  onSaveCandidateToFolder?: (candidateId: string, folder: string) => void | Promise<void>;
  onMessageCandidate: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
  onSetStatus?: (candidateId: string, status: string) => void | Promise<void>;
  isLoading?: boolean;
}

const ALL_KEY = "__all__";
const UNCATEGORIZED_KEY = "__uncategorized__";

const SavedCandidatesTab = ({
  candidates,
  savedCandidateIds,
  savedCandidateNotes,
  savedCandidateStatuses = {},
  savedCandidateFolders = {},
  onViewCandidate,
  onSaveCandidate,
  onSaveCandidateToFolder,
  onMessageCandidate,
  onSaveNote,
  onSetStatus,
  isLoading = false,
}: SavedCandidatesTabProps) => {
  const navigate = useNavigate();
  const [activeFolder, setActiveFolder] = useState<string>(ALL_KEY);

  const savedCandidates = useMemo(
    () => candidates.filter((c) => savedCandidateIds.has(c.id)),
    [candidates, savedCandidateIds],
  );

  const folders = useMemo(
    () => Array.from(new Set(Object.values(savedCandidateFolders).filter(Boolean))).sort(),
    [savedCandidateFolders],
  );

  const folderCounts = useMemo(() => {
    const counts: Record<string, number> = { [ALL_KEY]: savedCandidates.length, [UNCATEGORIZED_KEY]: 0 };
    folders.forEach((f) => (counts[f] = 0));
    savedCandidates.forEach((c) => {
      const f = savedCandidateFolders[c.id];
      if (f && counts[f] !== undefined) counts[f]++;
      else counts[UNCATEGORIZED_KEY]++;
    });
    return counts;
  }, [savedCandidates, folders, savedCandidateFolders]);

  const visible = useMemo(() => {
    if (activeFolder === ALL_KEY) return savedCandidates;
    if (activeFolder === UNCATEGORIZED_KEY) {
      return savedCandidates.filter((c) => !savedCandidateFolders[c.id]);
    }
    return savedCandidates.filter((c) => savedCandidateFolders[c.id] === activeFolder);
  }, [savedCandidates, savedCandidateFolders, activeFolder]);

  if (isLoading) {
    return <CardListSkeleton count={3} />;
  }

  const FolderPill = ({
    value,
    label,
    icon: Icon,
    count,
  }: {
    value: string;
    label: string;
    icon: typeof Folder;
    count: number;
  }) => {
    const active = activeFolder === value;
    return (
      <Button
        type="button"
        variant={active ? "default" : "outline"}
        size="sm"
        className="gap-1.5 shrink-0"
        onClick={() => setActiveFolder(value)}
      >
        <Icon className="h-3.5 w-3.5" />
        <span className="truncate max-w-[160px]">{label}</span>
        <Badge
          variant={active ? "secondary" : "outline"}
          className="ml-1 h-4 px-1.5 text-[10px]"
        >
          {count}
        </Badge>
      </Button>
    );
  };

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
        description="Organize saved candidates into folders. Only you can see this list."
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
            description="Save candidates you'd like to come back to, then sort them into custom folders."
            action={{
              label: "Find Candidates",
              onClick: () => navigate("/recruiter-dashboard?tab=resdex"),
              icon: Search,
            }}
            className="py-8"
          >
            <p className="text-xs text-muted-foreground mt-2">
              Tip: Click the bookmark icon on any candidate to save them into a folder.
            </p>
          </EmptyState>
        </motion.div>
      ) : (
        <motion.div variants={staggerItemVariants} className="space-y-4">
          {/* Folder pills */}
          <ScrollArea className="w-full whitespace-nowrap">
            <div className="flex items-center gap-2 pb-2">
              <FolderPill value={ALL_KEY} label="All" icon={Bookmark} count={folderCounts[ALL_KEY] || 0} />
              {folders.map((f) => (
                <FolderPill key={f} value={f} label={f} icon={Folder} count={folderCounts[f] || 0} />
              ))}
              <FolderPill
                value={UNCATEGORIZED_KEY}
                label="Uncategorized"
                icon={Inbox}
                count={folderCounts[UNCATEGORIZED_KEY] || 0}
              />
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          {visible.length === 0 ? (
            <div className="card-elevated p-6">
              <EmptyState
                icon={Folder}
                title="This folder is empty"
                description="No candidates have been added to this folder yet."
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
                    currentFolder={savedCandidateFolders[candidate.id]}
                    existingFolders={folders}
                    onView={onViewCandidate}
                    onSave={onSaveCandidate}
                    onSaveToFolder={onSaveCandidateToFolder}
                    onMessage={onMessageCandidate}
                    onSaveNote={onSaveNote}
                    onSetStatus={onSetStatus}
                  />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      )}
    </motion.div>
  );
};

export default SavedCandidatesTab;
