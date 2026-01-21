import * as React from "react";
import { useState, useCallback } from "react";
import { FileText, Eye, Loader2, Upload, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface ResumeCardProps {
  resumeUrl?: string | null;
  fileName?: string;
  fileSize?: string;
  onUpload?: () => void;
  onFileDrop?: (file: File) => void;
  onView?: () => void;
  uploading?: boolean;
  parsing?: boolean;
}

export const ResumeCard = ({
  resumeUrl,
  fileName = "Resume.pdf",
  fileSize = "",
  onUpload,
  onFileDrop,
  onView,
  uploading = false,
  parsing = false,
}: ResumeCardProps) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files = e.dataTransfer.files;
    if (files.length > 0 && onFileDrop) {
      const file = files[0];
      const allowedTypes = [
        "application/pdf",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ];
      if (allowedTypes.includes(file.type)) {
        onFileDrop(file);
      }
    }
  }, [onFileDrop]);

  // Show parsing state
  if (parsing) {
    return (
      <div className="text-center py-6 px-4">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
          <Sparkles className="h-6 w-6 text-primary animate-pulse" />
        </div>
        <p className="text-sm font-medium text-foreground mb-1">
          Analyzing Resume...
        </p>
        <p className="text-xs text-muted-foreground mb-3">
          AI is extracting your profile information
        </p>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">This may take a moment</span>
        </div>
      </div>
    );
  }

  if (!resumeUrl) {
    return (
      <div
        className={cn(
          "text-center py-6 px-4 rounded-lg border-2 border-dashed transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.02]"
            : "border-muted-foreground/20 hover:border-muted-foreground/40"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={cn(
          "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 transition-colors",
          isDragging ? "bg-primary/20" : "bg-muted"
        )}>
          <FileText className={cn(
            "h-6 w-6 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <p className={cn(
          "text-sm mb-3 transition-colors",
          isDragging ? "text-primary font-medium" : "text-muted-foreground"
        )}>
          {isDragging ? "Drop your resume here" : "Drag & drop your resume"}
        </p>
        {onUpload && !isDragging && (
          <>
            <p className="text-xs text-muted-foreground mb-2">or</p>
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={onUpload}
              disabled={uploading}
            >
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              Browse Files
            </Button>
          </>
        )}
        <p className="text-xs text-muted-foreground mt-3">
          PDF or Word (max 10MB)
        </p>
        <p className="text-xs text-primary/70 mt-1">
          <Sparkles className="inline h-3 w-3 mr-1" />
          AI will auto-fill your profile
        </p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "space-y-3 p-2 -m-2 rounded-lg transition-all duration-200",
        isDragging && "bg-primary/5 ring-2 ring-primary ring-dashed"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {isDragging && (
        <div className="text-center py-2 text-sm text-primary font-medium">
          Drop to replace resume
        </div>
      )}
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
      {onUpload && !isDragging && (
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
