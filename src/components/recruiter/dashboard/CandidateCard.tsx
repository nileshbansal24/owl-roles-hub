import { useState } from "react";
import { motion } from "framer-motion";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
} from "lucide-react";
import type { Profile } from "@/types/recruiter";

interface CandidateCardProps {
  candidate: Profile;
  index: number;
  isSaved: boolean;
  note?: string;
  onView: (candidate: Profile) => void;
  onSave: (candidateId: string) => void;
  onMessage: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
}

const CandidateCard = ({
  candidate,
  index,
  isSaved,
  note,
  onView,
  onSave,
  onMessage,
  onSaveNote,
}: CandidateCardProps) => {
  const [editingNote, setEditingNote] = useState(false);
  const [noteText, setNoteText] = useState(note || "");
  const [savingNote, setSavingNote] = useState(false);

  const handleSaveNote = async () => {
    setSavingNote(true);
    await onSaveNote(candidate.id, noteText);
    setSavingNote(false);
    setEditingNote(false);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      whileHover={{ y: -2, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
      className="card-elevated p-3 sm:p-5 transition-all duration-200"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
          <Avatar className="h-16 w-16 shrink-0 ring-2 ring-background shadow-md">
            <AvatarImage src={candidate.avatar_url || ""} />
            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-heading font-bold">
              {candidate.full_name?.slice(0, 2).toUpperCase() || "U"}
            </AvatarFallback>
          </Avatar>
        </motion.div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
            <div>
              <h4 className="font-heading font-semibold text-base sm:text-lg text-foreground hover:text-primary transition-colors cursor-pointer truncate" onClick={() => onView(candidate)}>
                {candidate.full_name || "Anonymous"}
              </h4>
              <p className="text-primary font-medium text-sm sm:text-base truncate">
                {candidate.role || candidate.headline || "Academic Professional"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-1 transition-colors"
                  onClick={() => onSave(candidate.id)}
                >
                  {isSaved ? (
                    <BookmarkCheck className="h-4 w-4 text-primary" />
                  ) : (
                    <Bookmark className="h-4 w-4" />
                  )}
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="gap-1"
                  onClick={() => onView(candidate)}
                >
                  <Eye className="h-4 w-4" />
                  <span className="hidden sm:inline">View</span>
                </Button>
              </motion.div>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button 
                  size="sm" 
                  className="gap-1"
                  onClick={() => onMessage(candidate)}
                >
                  <Mail className="h-4 w-4" />
                  <span className="hidden sm:inline">Message</span>
                </Button>
              </motion.div>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3 md:gap-4 mt-3 text-sm text-muted-foreground">
            {candidate.university && (
              <motion.div 
                className="flex items-center gap-1 hover:text-foreground transition-colors"
                whileHover={{ scale: 1.02 }}
              >
                <GraduationCap className="h-4 w-4" />
                <span className="truncate max-w-[150px]">{candidate.university}</span>
              </motion.div>
            )}
            {candidate.location && (
              <div className="flex items-center gap-1">
                <MapPin className="h-4 w-4" />
                <span>{candidate.location}</span>
              </div>
            )}
            {candidate.years_experience !== null && (
              <div className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                <span>{candidate.years_experience} Years Exp</span>
              </div>
            )}
            {candidate.current_salary != null && candidate.current_salary > 0 && (
              <div className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                <span>Current: <span className="font-medium text-foreground">₹{(candidate.current_salary / 100000).toFixed(1)}L</span></span>
              </div>
            )}
            {candidate.expected_salary != null && candidate.expected_salary > 0 && (
              <div className="flex items-center gap-1">
                <IndianRupee className="h-4 w-4" />
                <span>Expected: <span className="font-medium text-primary">₹{(candidate.expected_salary / 100000).toFixed(1)}L</span></span>
              </div>
            )}
          </div>

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {candidate.skills.slice(0, 5).map((skill, skillIndex) => (
                <motion.div
                  key={skill}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: skillIndex * 0.05 }}
                >
                  <Badge 
                    variant="secondary" 
                    className="hover:bg-primary/10 transition-colors cursor-default"
                  >
                    {skill}
                  </Badge>
                </motion.div>
              ))}
              {candidate.skills.length > 5 && (
                <Badge variant="outline" className="text-muted-foreground">
                  +{candidate.skills.length - 5} more
                </Badge>
              )}
            </div>
          )}

          {/* Scopus Metrics & Academic Identity - Compact View */}
          {(candidate.scopus_metrics || candidate.manual_h_index || candidate.orcid_id || candidate.scopus_link) && (
            <motion.div 
              className="flex flex-wrap items-center gap-3 mt-3 pt-3 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
            >
              {/* h-index */}
              {(candidate.scopus_metrics?.h_index != null || candidate.manual_h_index != null) && (
                <div className="flex items-center gap-1 text-sm">
                  <TrendingUp className="h-3.5 w-3.5 text-primary" />
                  <span className="font-semibold text-primary">
                    {candidate.scopus_metrics?.h_index ?? candidate.manual_h_index}
                  </span>
                  <span className="text-muted-foreground text-xs">h-index</span>
                </div>
              )}
              
              {/* Document count */}
              {candidate.scopus_metrics?.document_count != null && (
                <div className="flex items-center gap-1 text-sm">
                  <FileText className="h-3.5 w-3.5 text-muted-foreground" />
                  <span className="font-semibold">{candidate.scopus_metrics.document_count}</span>
                  <span className="text-muted-foreground text-xs">docs</span>
                </div>
              )}
              
              {/* Citation count */}
              {candidate.scopus_metrics?.citation_count != null && candidate.scopus_metrics.citation_count > 0 && (
                <div className="flex items-center gap-1 text-sm">
                  <svg className="h-3.5 w-3.5 text-muted-foreground" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V21" />
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3" />
                  </svg>
                  <span className="font-semibold">{candidate.scopus_metrics.citation_count}</span>
                  <span className="text-muted-foreground text-xs">citations</span>
                </div>
              )}
              
              {/* ORCID link */}
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
              
              {/* Scopus link */}
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
            </motion.div>
          )}

          {/* Private Notes Section */}
          {isSaved && (
            <motion.div 
              className="mt-4 pt-4 border-t border-border/50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
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
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button
                        size="sm"
                        onClick={handleSaveNote}
                        disabled={savingNote}
                        className="gap-1"
                      >
                        {savingNote ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Save className="h-4 w-4" />
                        )}
                        Save Note
                      </Button>
                    </motion.div>
                  </div>
                </div>
              ) : note ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">Private Note</span>
                    </div>
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="gap-1 h-7"
                        onClick={() => setEditingNote(true)}
                      >
                        <Edit3 className="h-3 w-3" />
                        Edit
                      </Button>
                    </motion.div>
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
                    {note}
                  </p>
                </div>
              ) : (
                <motion.div whileHover={{ scale: 1.01 }}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="gap-2 text-muted-foreground hover:text-foreground w-full justify-start"
                    onClick={() => setEditingNote(true)}
                  >
                    <MessageSquare className="h-4 w-4" />
                    Add private note
                  </Button>
                </motion.div>
              )}
            </motion.div>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default CandidateCard;
