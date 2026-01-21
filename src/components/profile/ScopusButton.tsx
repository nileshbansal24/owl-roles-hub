import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, FileSearch, Loader2, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ScopusButtonProps {
  scopusLink: string | null;
  onSave: (link: string) => Promise<void>;
}

export const ScopusButton = ({ scopusLink, onSave }: ScopusButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState(scopusLink || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const validateScopusUrl = (url: string) => {
    const scopusPattern = /^https?:\/\/(www\.)?scopus\.com\//i;
    return scopusPattern.test(url) || url.startsWith("scopus.com");
  };

  const handleSave = async () => {
    let url = inputValue.trim();
    if (!url.startsWith("http")) {
      url = `https://${url}`;
    }

    if (!validateScopusUrl(url)) {
      toast({
        title: "Invalid Scopus Link",
        description: "Please enter a valid Scopus profile or author URL",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onSave(url);
      setIsDialogOpen(false);
      toast({
        title: "Scopus Link Saved",
        description: "Your Scopus profile has been linked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save Scopus link",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOpenScopus = () => {
    if (scopusLink) {
      window.open(scopusLink, "_blank");
    } else {
      setIsDialogOpen(true);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
      >
        <Button
          variant="outline"
          onClick={handleOpenScopus}
          className="gap-2 border-primary/30 hover:border-primary hover:bg-primary/5 transition-all group"
        >
          <FileSearch className="h-4 w-4 text-primary group-hover:scale-110 transition-transform" />
          <span>Scopus Research Papers</span>
          {scopusLink && (
            <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </Button>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              Link Scopus Profile
            </DialogTitle>
            <DialogDescription>
              Add your Scopus author profile to showcase your research publications and citations.
            </DialogDescription>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Scopus Profile URL
              </label>
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="https://www.scopus.com/authid/detail.uri?authorId=..."
                className="text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Find your Scopus author profile and paste the URL here
              </p>
            </div>

            <AnimatePresence>
              {scopusLink && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Scopus profile linked</span>
                  <a
                    href={scopusLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={isSaving || !inputValue.trim()}
                className="flex-1"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {scopusLink ? "Update" : "Save"}
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};
