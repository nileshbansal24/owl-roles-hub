// CandidateCard is now a thin alias for the unified CandidateProfileCard.
// All recruiter surfaces (Find Candidates, Saved, Applications) render
// the same component for a consistent profile experience.
import CandidateProfileCard, { type CandidateProfileCardProps } from "./CandidateProfileCard";
import type { Profile } from "@/types/recruiter";

interface LegacyCandidateCardProps {
  candidate: Profile;
  index: number;
  isSaved: boolean;
  note?: string;
  savedStatus?: string;
  onView: (candidate: Profile) => void;
  onSave: (candidateId: string) => void;
  onMessage: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
  onSetStatus?: (candidateId: string, status: string) => void | Promise<void>;
  /** Folder support for saved candidates */
  currentFolder?: string;
  existingFolders?: string[];
  onSaveToFolder?: (candidateId: string, folder: string) => void | Promise<void>;
}

const CandidateCard = (props: LegacyCandidateCardProps) => {
  const mapped: CandidateProfileCardProps = props;
  return <CandidateProfileCard {...mapped} />;
};

export default CandidateCard;
