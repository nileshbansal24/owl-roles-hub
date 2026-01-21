import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Linkedin, ExternalLink, Loader2, CheckCircle, AlertCircle } from "lucide-react";
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

interface LinkedInImportCardProps {
  linkedinUrl: string | null;
  onConnect: (url: string) => Promise<void>;
  onImportRequest: () => void;
}

export const LinkedInImportCard = ({
  linkedinUrl,
  onConnect,
  onImportRequest,
}: LinkedInImportCardProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [inputUrl, setInputUrl] = useState(linkedinUrl || "");
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const validateLinkedInUrl = (url: string) => {
    const linkedinPattern = /^https?:\/\/(www\.)?linkedin\.com\/(in|pub)\/[\w-]+\/?$/i;
    return linkedinPattern.test(url);
  };

  const handleConnect = async () => {
    if (!validateLinkedInUrl(inputUrl)) {
      toast({
        title: "Invalid LinkedIn URL",
        description: "Please enter a valid LinkedIn profile URL (e.g., https://linkedin.com/in/yourname)",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      await onConnect(inputUrl);
      setIsDialogOpen(false);
      toast({
        title: "LinkedIn Connected",
        description: "Your LinkedIn profile has been linked successfully",
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save LinkedIn URL",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleImportClick = () => {
    setIsDialogOpen(false);
    onImportRequest();
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300, damping: 25 }}
      >
        <Button
          variant="outline"
          onClick={() => setIsDialogOpen(true)}
          className="w-full h-auto py-3 px-4 flex items-center gap-3 bg-[#0077B5]/5 border-[#0077B5]/20 hover:bg-[#0077B5]/10 hover:border-[#0077B5]/40 transition-all group"
        >
          <div className="w-9 h-9 rounded-lg bg-[#0077B5] flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
            <Linkedin className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 text-left">
            <p className="font-medium text-foreground text-sm">
              {linkedinUrl ? "LinkedIn Connected" : "Connect to LinkedIn"}
            </p>
            <p className="text-xs text-muted-foreground">
              {linkedinUrl ? "Click to update or import profile" : "Import your professional profile"}
            </p>
          </div>
          {linkedinUrl && (
            <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          )}
        </Button>
      </motion.div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#0077B5] flex items-center justify-center">
                <Linkedin className="h-4 w-4 text-white" />
              </div>
              Connect LinkedIn Profile
            </DialogTitle>
            <DialogDescription>
              Link your LinkedIn profile to enhance your academic portfolio and import your professional data.
            </DialogDescription>
          </DialogHeader>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4 py-4"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                LinkedIn Profile URL
              </label>
              <Input
                value={inputUrl}
                onChange={(e) => setInputUrl(e.target.value)}
                placeholder="https://linkedin.com/in/yourprofile"
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Enter your full LinkedIn profile URL
              </p>
            </div>

            <AnimatePresence>
              {linkedinUrl && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="flex items-center gap-2 text-sm text-green-600 dark:text-green-400"
                >
                  <CheckCircle className="h-4 w-4" />
                  <span>Currently linked to LinkedIn</span>
                  <a
                    href={linkedinUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto hover:underline flex items-center gap-1"
                  >
                    View <ExternalLink className="h-3 w-3" />
                  </a>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="border-t border-border pt-4">
              <motion.div
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
              >
                <Button
                  variant="outline"
                  className="w-full justify-start gap-3 h-auto py-3 hover:bg-muted/50"
                  onClick={handleImportClick}
                  disabled={!inputUrl || !validateLinkedInUrl(inputUrl)}
                >
                  <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                    <ExternalLink className="h-4 w-4 text-primary" />
                  </div>
                  <div className="text-left">
                    <p className="font-medium text-sm">Import Profile Data</p>
                    <p className="text-xs text-muted-foreground">
                      Sync experience, education & skills from LinkedIn
                    </p>
                  </div>
                </Button>
              </motion.div>

              <div className="mt-3 flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <AlertCircle className="h-4 w-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  LinkedIn import requires manual verification. After connecting, you can review and edit imported data before saving.
                </p>
              </div>
            </div>

            <div className="flex gap-2 pt-2">
              <Button
                variant="outline"
                onClick={() => setIsDialogOpen(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConnect}
                disabled={isSaving || !inputUrl.trim()}
                className="flex-1 bg-[#0077B5] hover:bg-[#006699]"
              >
                {isSaving ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                {linkedinUrl ? "Update" : "Connect"}
              </Button>
            </div>
          </motion.div>
        </DialogContent>
      </Dialog>
    </>
  );
};
