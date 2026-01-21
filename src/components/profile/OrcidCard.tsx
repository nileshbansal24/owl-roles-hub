import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, ExternalLink, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface OrcidCardProps {
  orcidId: string | null;
  onSave: (orcidId: string) => Promise<void>;
  isEditable?: boolean;
}

export const OrcidCard = ({ orcidId, onSave, isEditable = true }: OrcidCardProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [inputValue, setInputValue] = useState(orcidId || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const formatOrcidDisplay = (id: string) => {
    // Format as XXXX-XXXX-XXXX-XXXX
    const clean = id.replace(/[^0-9X]/gi, "");
    const parts = [];
    for (let i = 0; i < clean.length && i < 16; i += 4) {
      parts.push(clean.slice(i, i + 4));
    }
    return parts.join("-");
  };

  const validateOrcid = (id: string) => {
    const clean = id.replace(/[^0-9X]/gi, "");
    return clean.length === 16;
  };

  const handleSave = async () => {
    const formatted = formatOrcidDisplay(inputValue);
    if (!validateOrcid(inputValue)) {
      toast({
        title: "Invalid ORCID",
        description: "Please enter a valid 16-character ORCID iD",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(formatted);
      setIsEditing(false);
      toast({
        title: "ORCID Verified",
        description: "Your ORCID iD has been linked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save ORCID iD",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card rounded-xl border border-border p-4 shadow-card"
    >
      <div className="flex items-start gap-3">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 20, delay: 0.1 }}
          className="flex-shrink-0"
        >
          <div className="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
          </div>
        </motion.div>

        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-foreground flex items-center gap-2">
            ORCID iD
            <a
              href="https://orcid.org/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </h4>
          <p className="text-xs text-muted-foreground mt-0.5">
            Link your ORCID iD to verify your publications and professional activities.
          </p>

          <AnimatePresence mode="wait">
            {orcidId && !isEditing ? (
              <motion.div
                key="display"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-muted/50 rounded-lg px-3 py-2 border border-border">
                    <a
                      href={`https://orcid.org/${orcidId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm font-mono text-primary hover:underline"
                    >
                      {orcidId}
                    </a>
                  </div>
                  {isEditable && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setInputValue(orcidId);
                        setIsEditing(true);
                      }}
                    >
                      Edit
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : isEditing || !orcidId ? (
              <motion.div
                key="input"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="mt-3"
              >
                <div className="flex items-center gap-2">
                  <Input
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="0000-0002-1825-0097"
                    className="flex-1 font-mono text-sm"
                  />
                  <Button
                    size="sm"
                    onClick={handleSave}
                    disabled={isSaving || !inputValue.trim()}
                    className="bg-primary hover:bg-primary/90"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Verify"
                    )}
                  </Button>
                  {isEditing && orcidId && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setIsEditing(false);
                        setInputValue(orcidId);
                      }}
                    >
                      Cancel
                    </Button>
                  )}
                </div>
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
};
