import { useState, type ReactNode } from "react";
import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FolderPlus, FolderInput, Trash2 } from "lucide-react";
import {
  Eye,
  Bookmark,
  BookmarkCheck,
  Mail,
  GraduationCap,
  MapPin,
  Briefcase,
  MessageSquare,
  Edit3,
  Save,
  Loader2,
  FileText,
  TrendingUp,
  ExternalLink,
  IndianRupee,
  Star,
  BookOpen,
  Download,
  Calendar,
  CheckCircle2,
  XCircle,
} from "lucide-react";
import type { Profile, Application } from "@/types/recruiter";
import { getCandidateCategory, getStatusColor } from "@/types/recruiter";
import { computeRatings } from "@/components/profile/CandidateRatingCard";
import CandidateCategoryBadge from "./CandidateCategoryBadge";

const MiniStars = ({ score, size = 12 }: { score: number; size?: number }) => (
  <div className="flex items-center gap-px">
    {[1, 2, 3, 4, 5].map((i) => {
      const fill = score >= i ? 1 : score >= i - 0.5 ? 0.5 : 0;
      return (
        <div key={i} className="relative" style={{ width: size, height: size }}>
          <Star className="absolute inset-0 text-muted-foreground/20" style={{ width: size, height: size }} />
          {fill > 0 && (
            <div className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
              <Star className="text-amber-500 fill-amber-500" style={{ width: size, height: size }} />
            </div>
          )}
        </div>
      );
    })}
  </div>
);

export interface CandidateProfileCardProps {
  /** Canonical candidate profile. */
  candidate: Profile;
  index?: number;

  /**
   * Optional application context. When provided, the card renders
   * application-pipeline UI (status badge, "Applied for…", schedule /
   * shortlist / reject actions) in addition to the standard layout.
   */
  application?: Application | null;

  /** Talent-pool actions */
  isSaved?: boolean;
  note?: string;
  /** 'saved' | 'shortlisted' | 'maybe' | 'rejected' */
  savedStatus?: string;
  onView?: (candidate: Profile) => void;
  onSave?: (candidateId: string) => void;
  onMessage?: (candidate: Profile) => void;
  onSaveNote?: (candidateId: string, note: string) => Promise<void>;
  onSetStatus?: (candidateId: string, status: string) => void | Promise<void>;
  /** Folder support for saved candidates */
  currentFolder?: string;
  existingFolders?: string[];
  onSaveToFolder?: (candidateId: string, folder: string) => void | Promise<void>;

  /** Application-pipeline actions */
  onViewApplicant?: (app: Application) => void;
  onUpdateStatus?: (appId: string, status: string) => void;
  onScheduleInterview?: (app: Application) => void;
  onDownloadResume?: (resumePath: string, applicantName: string) => void;

  /** Bulk select (Applications surface) */
  selected?: boolean;
  onToggleSelect?: (appId: string) => void;

  /** Extra slot rendered at the end of the action row */
  extraActions?: ReactNode;
}

const CandidateProfileCard = ({
  candidate,
  index = 0,
  application,
  isSaved = false,
  note,
  savedStatus,
  onView,
  onSave,
  onMessage,
  onSaveNote,
  onSetStatus,
  onViewApplicant,
  onUpdateStatus,
  onScheduleInterview,
  onDownloadResume,
  selected = false,
  onToggleSelect,
  extraActions,
  currentFolder,
  existingFolders = [],
  onSaveToFolder,
}: CandidateProfileCardProps) => {
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(note || "");
  const [savingNote, setSavingNote] = useState(false);
  const [folderDialogOpen, setFolderDialogOpen] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const [selectedFolderChoice, setSelectedFolderChoice] = useState<string>("");
  const [isMovingFolder, setIsMovingFolder] = useState(false);

  const isApplication = !!application;

  const handleSaveNote = async () => {
    if (!onSaveNote) return;
    setSavingNote(true);
    await onSaveNote(candidate.id, noteText);
    setSavingNote(false);
    setEditingNote(false);
  };

  const handleView = () => {
    if (isApplication && onViewApplicant && application) onViewApplicant(application);
    else if (onView) onView(candidate);
  };

  return (
    <>
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      className={`card-elevated p-3 sm:p-5 transition-all duration-200 ${
        selected ? "ring-2 ring-primary bg-primary/5" : ""
      }`}
    >
      <div className="flex flex-col md:flex-row gap-4">
        <div className="flex items-start gap-3 shrink-0">
          {isApplication && onToggleSelect && application && (
            <Checkbox
              checked={selected}
              onCheckedChange={() => onToggleSelect(application.id)}
              className="mt-2"
            />
          )}
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <Avatar className="h-16 w-16 ring-2 ring-background shadow-md">
              <AvatarImage src={candidate.avatar_url || ""} />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-heading font-bold">
                {candidate.full_name?.slice(0, 2).toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>
          </motion.div>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h4
                  className="font-heading font-semibold text-base sm:text-lg text-foreground hover:text-primary transition-colors cursor-pointer truncate"
                  onClick={handleView}
                >
                  {candidate.full_name || "Anonymous"}
                </h4>
                <CandidateCategoryBadge category={getCandidateCategory(candidate)} />
                {!isApplication && savedStatus && savedStatus !== "saved" && (
                  <Badge
                    variant="outline"
                    className={
                      savedStatus === "shortlisted"
                        ? "border-green-500/40 bg-green-500/10 text-green-700 dark:text-green-400"
                        : savedStatus === "maybe"
                        ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                        : "border-red-500/40 bg-red-500/10 text-red-700 dark:text-red-400"
                    }
                  >
                    {savedStatus === "shortlisted" ? "Shortlisted" : savedStatus === "maybe" ? "Maybe" : "Rejected"}
                  </Badge>
                )}
                {isApplication && (
                  <Badge variant="outline" className={getStatusColor(application!.status)}>
                    {application!.status}
                  </Badge>
                )}
              </div>
              <p className="text-primary font-medium text-sm sm:text-base truncate">
                {candidate.role || candidate.headline || "Academic Professional"}
              </p>
              {isApplication && (
                <p className="text-xs text-muted-foreground mt-0.5">
                  Applied for <span className="text-primary font-medium">{application!.jobs.title}</span> at {application!.jobs.institute}
                  <span className="mx-1.5">·</span>
                  {formatDistanceToNow(new Date(application!.created_at), { addSuffix: true })}
                </p>
              )}
            </div>
            <div className="flex gap-2 shrink-0 flex-wrap">
              {onSave && !isApplication && (
                <>
                  {isSaved ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="gap-1 transition-colors"
                            title={currentFolder ? `In folder: ${currentFolder}` : "Saved"}
                          >
                            <BookmarkCheck className="h-4 w-4 text-primary" />
                          </Button>
                        </motion.div>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {currentFolder && (
                          <div className="px-2 py-1.5 text-xs text-muted-foreground">
                            Folder: <span className="font-medium text-foreground">{currentFolder}</span>
                          </div>
                        )}
                        {onSaveToFolder && (
                          <DropdownMenuItem
                            onClick={() => {
                              setSelectedFolderChoice(currentFolder || existingFolders[0] || "__new__");
                              setNewFolderName("");
                              setIsMovingFolder(true);
                              setFolderDialogOpen(true);
                            }}
                          >
                            <FolderInput className="h-4 w-4 mr-2" />
                            Move to folder
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem
                          className="text-destructive focus:text-destructive"
                          onClick={() => onSave(candidate.id)}
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from saved
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : (
                    <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 transition-colors"
                        title="Save to a folder"
                        onClick={() => {
                          if (onSaveToFolder) {
                            setSelectedFolderChoice(existingFolders[0] ?? "__new__");
                            setNewFolderName("");
                            setIsMovingFolder(false);
                            setFolderDialogOpen(true);
                          } else {
                            onSave(candidate.id);
                          }
                        }}
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  )}
                </>
              )}
              {(onView || onViewApplicant) && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button variant="outline" size="sm" className="gap-1" onClick={handleView}>
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">View</span>
                  </Button>
                </motion.div>
              )}
              {onMessage && !isApplication && (
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="sm" className="gap-1" onClick={() => onMessage(candidate)}>
                    <Mail className="h-4 w-4" />
                    <span className="hidden sm:inline">Message</span>
                  </Button>
                </motion.div>
              )}
            </div>
          </div>

          {/* Quick status: Shortlist / Maybe / Reject (talent-pool only) */}
          {!isApplication && onSetStatus && (
            <div className="flex items-center gap-1.5 mt-3 flex-wrap">
              <span className="text-xs text-muted-foreground mr-1">Mark as:</span>
              {[
                { value: "shortlisted", label: "Shortlist", icon: CheckCircle2, activeCls: "bg-green-600 hover:bg-green-700 text-white border-green-600" },
                { value: "maybe", label: "Maybe", icon: Bookmark, activeCls: "bg-amber-500 hover:bg-amber-600 text-white border-amber-500" },
                { value: "rejected", label: "Reject", icon: XCircle, activeCls: "bg-red-600 hover:bg-red-700 text-white border-red-600" },
              ].map((opt) => {
                const Icon = opt.icon;
                const active = savedStatus === opt.value;
                return (
                  <Button
                    key={opt.value}
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className={`h-7 px-2.5 text-xs gap-1 ${active ? opt.activeCls : ""}`}
                    onClick={() => onSetStatus(candidate.id, active ? "saved" : opt.value)}
                  >
                    <Icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </Button>
                );
              })}
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 text-sm text-muted-foreground">
            {candidate.university && (
              <div className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span className="truncate max-w-[150px]">{candidate.university}</span>
              </div>
            )}
            {candidate.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{candidate.location}</span>
              </div>
            )}
            {candidate.years_experience != null && candidate.years_experience > 0 && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span className="font-medium text-foreground">{candidate.years_experience}</span>
                <span>Yrs Experience</span>
              </div>
            )}
            {candidate.current_salary != null && candidate.current_salary > 0 && (
              <div className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                <span>
                  Current: <span className="font-medium text-foreground">₹{(candidate.current_salary / 100000).toFixed(1)}L</span>
                </span>
              </div>
            )}
            {candidate.expected_salary != null && candidate.expected_salary > 0 && (
              <div className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                <span>
                  Expected: <span className="font-medium text-primary">₹{(candidate.expected_salary / 100000).toFixed(1)}L</span>
                </span>
              </div>
            )}
          </div>

          {/* Academic & Research Ratings */}
          {(() => {
            const ratings = computeRatings({
              education: candidate.education,
              researchPapers: candidate.research_papers,
              hIndex: candidate.scopus_metrics?.h_index || candidate.manual_h_index || null,
              citations: candidate.scopus_metrics?.citation_count || null,
              achievements: candidate.achievements,
              university: candidate.university,
            });
            return (
              <div className="flex items-center gap-4 mt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <GraduationCap className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Academic</span>
                  <MiniStars score={ratings.academicScore} />
                  <span className="text-xs font-semibold text-foreground">{ratings.academicScore}</span>
                </div>
                <div className="flex items-center gap-1">
                  <BookOpen className="h-3.5 w-3.5 text-primary" />
                  <span className="text-xs text-muted-foreground">Research</span>
                  <MiniStars score={ratings.researchScore} />
                  <span className="text-xs font-semibold text-foreground">{ratings.researchScore}</span>
                </div>
              </div>
            );
          })()}

          {candidate.professional_summary && candidate.professional_summary.trim().length > 0 && (
            <p className="mt-3 text-sm text-muted-foreground line-clamp-2 leading-relaxed">
              {candidate.professional_summary}
            </p>
          )}

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {candidate.skills.slice(0, 5).map((skill) => (
                <Badge key={skill} variant="secondary" className="hover:bg-primary/10 transition-colors cursor-default">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 5 && (
                <Badge variant="outline" className="text-muted-foreground">
                  +{candidate.skills.length - 5} more
                </Badge>
              )}
            </div>
          )}

          {/* Scopus / academic identity */}
          {(candidate.scopus_metrics || candidate.manual_h_index || candidate.orcid_id || candidate.scopus_link) && (
            <div className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50">
              {(candidate.scopus_metrics?.h_index != null || candidate.manual_h_index != null) && (
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-primary">
                    {candidate.scopus_metrics?.h_index ?? candidate.manual_h_index}
                  </span>
                  <span className="text-muted-foreground text-xs">h-index</span>
                </div>
              )}
              {candidate.scopus_metrics?.document_count != null && (
                <div className="flex items-center gap-1 text-sm">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold">{candidate.scopus_metrics.document_count}</span>
                  <span className="text-muted-foreground text-xs">docs</span>
                </div>
              )}
              {candidate.scopus_metrics?.citation_count != null && candidate.scopus_metrics.citation_count > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-semibold">{candidate.scopus_metrics.citation_count}</span>
                  <span className="text-muted-foreground text-xs">citations</span>
                </div>
              )}
              {candidate.orcid_id && (
                <a
                  href={`https://orcid.org/${candidate.orcid_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#A6CE39]/10 text-[#A6CE39] hover:bg-[#A6CE39]/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  ORCID
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
              {candidate.scopus_link && (
                <a
                  href={candidate.scopus_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-[#E9711C]/10 text-[#E9711C] hover:bg-[#E9711C]/20 transition-colors"
                  onClick={(e) => e.stopPropagation()}
                >
                  Scopus
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          )}

          {/* Application-pipeline actions */}
          {isApplication && (
            <div className="flex items-center gap-2 mt-4 pt-4 border-t border-border/50 flex-wrap">
              {candidate.resume_url && onDownloadResume && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => onDownloadResume(candidate.resume_url!, candidate.full_name || "Applicant")}
                >
                  <Download className="h-4 w-4" />
                  Resume
                </Button>
              )}
              {onMessage && (
                <Button variant="outline" size="sm" className="gap-1" onClick={() => onMessage(candidate)}>
                  <Mail className="h-4 w-4" />
                  Message
                </Button>
              )}
              {application!.status !== "rejected" && onScheduleInterview && (
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1"
                  onClick={() => onScheduleInterview(application!)}
                >
                  <Calendar className="h-4 w-4" />
                  Schedule
                </Button>
              )}
              <div className="flex-1" />
              {application!.status === "pending" && onUpdateStatus && (
                <>
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white gap-1"
                    onClick={() => onUpdateStatus(application!.id, "shortlisted")}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    Shortlist
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    className="gap-1"
                    onClick={() => onUpdateStatus(application!.id, "rejected")}
                  >
                    <XCircle className="h-4 w-4" />
                    Reject
                  </Button>
                </>
              )}
              {extraActions}
            </div>
          )}

          {/* Private notes (talent-pool only) */}
          {isSaved && !isApplication && onSaveNote && (
            <div className="mt-4 pt-4 border-t border-border/50">
              {editingNote ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <MessageSquare className="h-4 w-4" />
                    <span className="font-medium">Private Note</span>
                  </div>
                  <Textarea
                    placeholder="Add a private note about this candidate..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                    className="min-h-[80px] text-sm transition-shadow focus:shadow-md"
                    autoFocus
                  />
                  <div className="flex gap-2 justify-end">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingNote(false);
                        setNoteText(note || "");
                      }}
                      disabled={savingNote}
                    >
                      Cancel
                    </Button>
                    <Button size="sm" onClick={handleSaveNote} disabled={savingNote} className="gap-1">
                      {savingNote ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                      Save Note
                    </Button>
                  </div>
                </div>
              ) : note ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">Private Note</span>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1 h-7" onClick={() => setEditingNote(true)}>
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">{note}</p>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground w-full justify-start"
                  onClick={() => setEditingNote(true)}
                >
                  <MessageSquare className="h-4 w-4" />
                  Add private note
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
    {onSaveToFolder && (
      <SaveToFolderDialog
        open={folderDialogOpen}
        onOpenChange={setFolderDialogOpen}
        isMoving={isMovingFolder}
        candidateName={candidate.full_name || "this candidate"}
        existingFolders={existingFolders}
        selectedFolderChoice={selectedFolderChoice}
        setSelectedFolderChoice={setSelectedFolderChoice}
        newFolderName={newFolderName}
        setNewFolderName={setNewFolderName}
        onConfirm={async (folder) => {
          await onSaveToFolder(candidate.id, folder);
          setFolderDialogOpen(false);
        }}
      />
    )}
    </>
  );
};

interface SaveToFolderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  candidateName: string;
  existingFolders: string[];
  selectedFolderChoice: string;
  setSelectedFolderChoice: (value: string) => void;
  newFolderName: string;
  setNewFolderName: (value: string) => void;
  onConfirm: (folder: string) => void | Promise<void>;
  isMoving?: boolean;
}

const SaveToFolderDialog = ({
  open,
  onOpenChange,
  candidateName,
  existingFolders,
  selectedFolderChoice,
  setSelectedFolderChoice,
  newFolderName,
  setNewFolderName,
  onConfirm,
  isMoving = false,
}: SaveToFolderDialogProps) => {
  const isCreatingNew = selectedFolderChoice === "__new__" || existingFolders.length === 0;
  const folder = isCreatingNew ? newFolderName.trim() : selectedFolderChoice;
  const canConfirm = folder.length > 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-4 w-4 text-primary" />
            {isMoving ? "Move to folder" : "Save to folder"}
          </DialogTitle>
          <DialogDescription>
            {isMoving
              ? <>Move <span className="font-medium text-foreground">{candidateName}</span> to a different folder.</>
              : <>Choose a folder for <span className="font-medium text-foreground">{candidateName}</span> or create a new one.</>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {existingFolders.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Your folders</Label>
              <RadioGroup
                value={selectedFolderChoice}
                onValueChange={setSelectedFolderChoice}
                className="space-y-1 max-h-44 overflow-y-auto rounded-md border border-border/60 p-2"
              >
                {existingFolders.map((f) => (
                  <label
                    key={f}
                    htmlFor={`folder-${f}`}
                    className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer hover:bg-accent/50"
                  >
                    <RadioGroupItem value={f} id={`folder-${f}`} />
                    <span className="text-sm">{f}</span>
                  </label>
                ))}
                <label
                  htmlFor="folder-new"
                  className="flex items-center gap-2 rounded px-2 py-1.5 cursor-pointer hover:bg-accent/50 border-t border-border/40 mt-1 pt-2"
                >
                  <RadioGroupItem value="__new__" id="folder-new" />
                  <span className="text-sm font-medium text-primary">+ Create new folder</span>
                </label>
              </RadioGroup>
            </div>
          )}

          {isCreatingNew && (
            <div className="space-y-1.5">
              <Label htmlFor="new-folder-name" className="text-xs uppercase tracking-wide text-muted-foreground">
                New folder name
              </Label>
              <Input
                id="new-folder-name"
                autoFocus
                placeholder="e.g. AI Researchers, Round 2 Interviews"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && canConfirm) {
                    e.preventDefault();
                    onConfirm(folder);
                  }
                }}
              />
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button disabled={!canConfirm} onClick={() => onConfirm(folder)}>
            <FolderPlus className="h-4 w-4 mr-1.5" />
            {isMoving ? "Move" : "Save"} to {isCreatingNew ? "new folder" : `"${selectedFolderChoice}"`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateProfileCard;
