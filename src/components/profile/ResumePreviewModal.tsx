import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ExternalLink, Download, Loader2, X } from "lucide-react";

interface ResumePreviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  resumeUrl: string | null;
  fileName?: string;
}

export function ResumePreviewModal({
  open,
  onOpenChange,
  resumeUrl,
  fileName = "Resume",
}: ResumePreviewModalProps) {
  const [loading, setLoading] = useState(true);

  const handleOpenNewTab = () => {
    if (resumeUrl) {
      window.open(resumeUrl, "_blank");
    }
  };

  const handleDownload = () => {
    if (resumeUrl) {
      const link = document.createElement("a");
      link.href = resumeUrl;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl h-[90vh] p-0 gap-0 flex flex-col">
        <DialogHeader className="px-4 py-3 border-b flex-row items-center justify-between space-y-0">
          <DialogTitle className="text-base font-medium truncate pr-4">
            {fileName}
          </DialogTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="gap-1.5"
            >
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Download</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleOpenNewTab}
              className="gap-1.5"
            >
              <ExternalLink className="h-4 w-4" />
              <span className="hidden sm:inline">Open</span>
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 relative bg-muted/30">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 z-10">
              <div className="flex flex-col items-center gap-2">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">Loading resume...</p>
              </div>
            </div>
          )}
          {resumeUrl ? (
            <iframe
              src={`${resumeUrl}#toolbar=0&navpanes=0`}
              className="w-full h-full border-0"
              title="Resume Preview"
              onLoad={() => setLoading(false)}
            />
          ) : (
            <div className="flex items-center justify-center h-full">
              <p className="text-muted-foreground">No resume available</p>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ResumePreviewModal;
