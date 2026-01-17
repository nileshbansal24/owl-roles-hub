import * as React from "react";
import { FileText, Download, Eye, Loader2, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ResumeCardProps {
  resumeUrl?: string | null;
  fileName?: string;
  fileSize?: string;
  onUpload?: () => void;
  onView?: () => void;
  uploading?: boolean;
}

export const ResumeCard = ({
  resumeUrl,
  fileName = "Resume.pdf",
  fileSize = "",
  onUpload,
  onView,
  uploading = false,
}: ResumeCardProps) => {
  if (!resumeUrl) {
    return (
      <div className="text-center py-4">
        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
          <FileText className="h-6 w-6 text-muted-foreground" />
        </div>
        <p className="text-sm text-muted-foreground mb-3">
          Upload your resume
        </p>
        {onUpload && (
          <Button
            size="sm"
            className="gap-1.5"
            onClick={onUpload}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Upload Resume
          </Button>
        )}
        <p className="text-xs text-muted-foreground mt-2">
          PDF or Word (max 10MB)
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div
        className="flex items-center gap-3 p-3 rounded-lg bg-muted/50 border border-border cursor-pointer hover:bg-muted transition-colors"
        onClick={onView}
      >
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
          <FileText className="h-5 w-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-medium text-foreground text-sm truncate">
            {fileName}
          </p>
          {fileSize && (
            <p className="text-xs text-muted-foreground">{fileSize}</p>
          )}
        </div>
        <Eye className="h-4 w-4 text-muted-foreground shrink-0" />
      </div>
      {onUpload && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-1.5"
          onClick={onUpload}
          disabled={uploading}
        >
          {uploading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Upload className="h-4 w-4" />
          )}
          Update Resume
        </Button>
      )}
    </div>
  );
};

export default ResumeCard;
