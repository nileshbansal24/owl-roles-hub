import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ExternalLink, FileSearch, Loader2, CheckCircle, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface ScopusButtonProps {
  scopusLink: string | null;
  onSave: (link: string) => Promise<void>;
  onPublicationsImported?: (papers: Array<{ title: string; authors: string; date: string }>) => void;
}

type ImportState = "idle" | "importing" | "success" | "error";

export const ScopusButton = ({ scopusLink, onSave, onPublicationsImported }: ScopusButtonProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputValue, setInputValue] = useState(scopusLink || "");
  const [isSaving, setIsSaving] = useState(false);
  const [importState, setImportState] = useState<ImportState>("idle");
  const [importedCount, setImportedCount] = useState(0);
  const { toast } = useToast();

  const validateScopusUrl = (url: string) => {
    const scopusPattern = /^https?:\/\/(www\.)?scopus\.com\//i;
    return scopusPattern.test(url) || url.startsWith("scopus.com");
  };

  const handleImportPublications = async (url: string) => {
    setImportState("importing");

    try {
      const response = await supabase.functions.invoke("fetch-scopus", {
        body: { scopusUrl: url },
      });

      if (response.error) {
        console.error("Scopus fetch error:", response.error);
        setImportState("error");
        toast({
          title: "Import failed",
          description: response.error.message || "Could not fetch publications from Scopus",
          variant: "destructive",
        });
        return false;
      }

      if (response.data?.success) {
        const count = response.data.count || 0;
        setImportedCount(count);
        setImportState("success");

        if (onPublicationsImported && response.data.publications) {
          onPublicationsImported(response.data.publications);
        }

        toast({
          title: "Publications imported!",
          description: `Successfully imported ${count} publications from Scopus.`,
        });
        return true;
      }

      setImportState("error");
      return false;
    } catch (error: any) {
      console.error("Error importing publications:", error);
      setImportState("error");
      toast({
        title: "Import failed",
        description: error.message || "Failed to import publications",
        variant: "destructive",
      });
      return false;
    }
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
      // Import publications from Scopus (this also saves the link)
      const imported = await handleImportPublications(url);
      
      if (!imported) {
        // If import failed, still try to save the link
        await onSave(url);
      }
      
      // Keep dialog open briefly to show success state
      setTimeout(() => {
        setIsDialogOpen(false);
        setImportState("idle");
      }, 2000);
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

  const handleDialogOpen = (open: boolean) => {
    setIsDialogOpen(open);
    if (!open) {
      setImportState("idle");
      setImportedCount(0);
    }
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.02, y: -1 }}
        whileTap={{ scale: 0.98 }}
        transition={{ type: "spring", stiffness: 400, damping: 25 }}
        className="flex gap-2"
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
        {scopusLink && (
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsDialogOpen(true)}
            className="text-muted-foreground hover:text-primary"
            title="Refresh publications from Scopus"
          >
            <Download className="h-4 w-4" />
          </Button>
        )}
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={handleDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileSearch className="h-5 w-5 text-primary" />
              {scopusLink ? "Update Scopus Profile" : "Link Scopus Profile"}
            </DialogTitle>
            <DialogDescription>
              {scopusLink 
                ? "Update your Scopus profile link and refresh your publications."
                : "Add your Scopus author profile to automatically import your research publications."
              }
            </DialogDescription>
          </DialogHeader>

          <AnimatePresence mode="wait">
            {importState === "importing" ? (
              <motion.div
                key="importing"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </div>
                <p className="font-medium text-foreground mb-1">
                  Fetching Publications...
                </p>
                <p className="text-sm text-muted-foreground">
                  Connecting to Scopus to import your research papers
                </p>
                <div className="flex items-center justify-center gap-2 mt-4">
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                  <span className="text-xs text-muted-foreground">This may take a moment</span>
                </div>
              </motion.div>
            ) : importState === "success" ? (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="py-8 text-center"
              >
                <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
                <p className="font-medium text-foreground mb-1">
                  Publications Imported!
                </p>
                <p className="text-sm text-muted-foreground">
                  Successfully imported {importedCount} research papers from Scopus
                </p>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
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

                <div className="rounded-lg bg-primary/5 border border-primary/20 p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium text-foreground mb-1">Auto-import Publications</p>
                      <p>Your research papers, citations, and co-authors will be automatically imported to your profile.</p>
                    </div>
                  </div>
                </div>

                {scopusLink && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
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

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    onClick={() => handleDialogOpen(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleSave}
                    disabled={isSaving || !inputValue.trim()}
                    className="flex-1 gap-2"
                  >
                    {isSaving ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Download className="h-4 w-4" />
                    )}
                    {scopusLink ? "Refresh Publications" : "Import Publications"}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </DialogContent>
      </Dialog>
    </>
  );
};
