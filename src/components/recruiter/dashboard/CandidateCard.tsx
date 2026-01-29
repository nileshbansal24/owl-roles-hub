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
      transition={{ delay: index * 0.05 }}
      className="card-elevated p-5 hover:shadow-lg transition-shadow"
    >
      <div className="flex flex-col md:flex-row gap-4">
        <Avatar className="h-16 w-16 shrink-0">
          <AvatarImage src={candidate.avatar_url || ""} />
          <AvatarFallback className="bg-primary text-primary-foreground text-lg font-heading font-bold">
            {candidate.full_name?.slice(0, 2).toUpperCase() || "U"}
          </AvatarFallback>
        </Avatar>

        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h4 className="font-heading font-semibold text-lg text-foreground">
                {candidate.full_name || "Anonymous"}
              </h4>
              <p className="text-primary font-medium">
                {candidate.role || candidate.headline || "Academic Professional"}
              </p>
            </div>
            <div className="flex gap-2 shrink-0">
              <Button
                variant="ghost"
                size="sm"
                className="gap-1"
                onClick={() => onSave(candidate.id)}
              >
                {isSaved ? (
                  <BookmarkCheck className="h-4 w-4 text-primary" />
                ) : (
                  <Bookmark className="h-4 w-4" />
                )}
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                className="gap-1"
                onClick={() => onView(candidate)}
              >
                <Eye className="h-4 w-4" />
                View
              </Button>
              <Button 
                size="sm" 
                className="gap-1"
                onClick={() => onMessage(candidate)}
              >
                <Mail className="h-4 w-4" />
                Message
              </Button>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
            {candidate.university && (
              <div className="flex items-center gap-1">
                <GraduationCap className="h-4 w-4" />
                <span>{candidate.university}</span>
              </div>
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
          </div>

          {candidate.skills && candidate.skills.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-3">
              {candidate.skills.slice(0, 5).map((skill) => (
                <Badge key={skill} variant="secondary">
                  {skill}
                </Badge>
              ))}
              {candidate.skills.length > 5 && (
                <Badge variant="outline">+{candidate.skills.length - 5} more</Badge>
              )}
            </div>
          )}

          {/* Private Notes Section */}
          {isSaved && (
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
                    className="min-h-[80px] text-sm"
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
                  </div>
                </div>
              ) : note ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MessageSquare className="h-4 w-4" />
                      <span className="font-medium">Private Note</span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="gap-1 h-7"
                      onClick={() => setEditingNote(true)}
                    >
                      <Edit3 className="h-3 w-3" />
                      Edit
                    </Button>
                  </div>
                  <p className="text-sm text-foreground bg-muted/50 p-3 rounded-md">
                    {note}
                  </p>
                </div>
              ) : (
                <Button
                  variant="ghost"
                  size="sm"
                  className="gap-2 text-muted-foreground hover:text-foreground"
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
  );
};

export default CandidateCard;
