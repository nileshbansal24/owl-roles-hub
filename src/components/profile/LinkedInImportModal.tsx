import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Linkedin,
  Briefcase,
  GraduationCap,
  Award,
  Loader2,
  CheckCircle,
  AlertCircle,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";

interface ImportableSection {
  id: string;
  label: string;
  icon: React.ReactNode;
  description: string;
  available: boolean;
}

interface LinkedInImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  linkedinUrl: string | null;
  onImport: (sections: string[]) => Promise<void>;
}

export const LinkedInImportModal = ({
  isOpen,
  onClose,
  linkedinUrl,
  onImport,
}: LinkedInImportModalProps) => {
  const [selectedSections, setSelectedSections] = useState<string[]>([]);
  const [isImporting, setIsImporting] = useState(false);
  const [importStep, setImportStep] = useState<"select" | "importing" | "complete">("select");
  const { toast } = useToast();

  const sections: ImportableSection[] = [
    {
      id: "experience",
      label: "Work Experience",
      icon: <Briefcase className="h-4 w-4" />,
      description: "Job titles, companies, and descriptions",
      available: true,
    },
    {
      id: "education",
      label: "Education",
      icon: <GraduationCap className="h-4 w-4" />,
      description: "Degrees, institutions, and dates",
      available: true,
    },
    {
      id: "skills",
      label: "Skills",
      icon: <Award className="h-4 w-4" />,
      description: "Professional skills and endorsements",
      available: true,
    },
  ];

  const toggleSection = (id: string) => {
    setSelectedSections((prev) =>
      prev.includes(id)
        ? prev.filter((s) => s !== id)
        : [...prev, id]
    );
  };

  const selectAll = () => {
    setSelectedSections(sections.filter((s) => s.available).map((s) => s.id));
  };

  const handleImport = async () => {
    if (selectedSections.length === 0) {
      toast({
        title: "No sections selected",
        description: "Please select at least one section to import",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    setImportStep("importing");

    try {
      await onImport(selectedSections);
      setImportStep("complete");
      setTimeout(() => {
        onClose();
        setImportStep("select");
        setSelectedSections([]);
      }, 2000);
    } catch (error) {
      toast({
        title: "Import Failed",
        description: "Could not import LinkedIn data. Please try again.",
        variant: "destructive",
      });
      setImportStep("select");
    } finally {
      setIsImporting(false);
    }
  };

  const handleClose = () => {
    if (!isImporting) {
      onClose();
      setImportStep("select");
      setSelectedSections([]);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-[#0077B5] flex items-center justify-center">
              <Linkedin className="h-4 w-4 text-white" />
            </div>
            Import from LinkedIn
          </DialogTitle>
          <DialogDescription>
            Select which sections you'd like to import from your LinkedIn profile.
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {importStep === "select" && (
            <motion.div
              key="select"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4 py-4"
            >
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  {selectedSections.length} of {sections.length} sections selected
                </p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-xs"
                >
                  Select All
                </Button>
              </div>

              <div className="space-y-2">
                {sections.map((section, index) => (
                  <motion.div
                    key={section.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className={`flex items-center gap-3 p-3 rounded-lg border transition-all cursor-pointer ${
                      selectedSections.includes(section.id)
                        ? "border-primary bg-primary/5"
                        : "border-border hover:border-muted-foreground/50"
                    } ${!section.available && "opacity-50 cursor-not-allowed"}`}
                    onClick={() => section.available && toggleSection(section.id)}
                  >
                    <Checkbox
                      checked={selectedSections.includes(section.id)}
                      disabled={!section.available}
                      onCheckedChange={() => toggleSection(section.id)}
                    />
                    <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                      {section.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{section.label}</p>
                      <p className="text-xs text-muted-foreground">
                        {section.description}
                      </p>
                    </div>
                    {!section.available && (
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        Coming soon
                      </span>
                    )}
                  </motion.div>
                ))}
              </div>

              <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 dark:text-blue-200">
                  Imported data will be added to your profile. You can review and edit everything before it's visible to recruiters.
                </p>
              </div>

              <div className="flex gap-2 pt-2">
                <Button
                  variant="outline"
                  onClick={handleClose}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={selectedSections.length === 0}
                  className="flex-1 bg-[#0077B5] hover:bg-[#006699]"
                >
                  Import Selected
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </motion.div>
          )}

          {importStep === "importing" && (
            <motion.div
              key="importing"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center justify-center gap-4"
            >
              <div className="relative">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                  <Loader2 className="h-12 w-12 text-[#0077B5]" />
                </motion.div>
              </div>
              <div className="text-center">
                <p className="font-medium text-foreground">Importing from LinkedIn...</p>
                <p className="text-sm text-muted-foreground mt-1">
                  This may take a few moments
                </p>
              </div>
            </motion.div>
          )}

          {importStep === "complete" && (
            <motion.div
              key="complete"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="py-12 flex flex-col items-center justify-center gap-4"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <div className="w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                  <CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" />
                </div>
              </motion.div>
              <div className="text-center">
                <p className="font-medium text-foreground">Import Complete!</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Your profile has been updated
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
};
