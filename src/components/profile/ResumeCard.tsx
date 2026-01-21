import * as React from "react";
import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Eye, Loader2, Upload, Sparkles, CheckCircle2 } from "lucide-react";
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
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-8 px-4"
      >
        <div className="relative w-16 h-16 mx-auto mb-4">
          <motion.div
            className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5"
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <Sparkles className="h-7 w-7 text-primary" />
          </div>
        </div>
        <p className="text-base font-semibold text-foreground mb-1">
          Analyzing Resume...
        </p>
        <p className="text-sm text-muted-foreground mb-4">
          AI is extracting your profile information
        </p>
        <div className="flex items-center justify-center gap-2">
          <Loader2 className="h-4 w-4 animate-spin text-primary" />
          <span className="text-xs text-muted-foreground">This may take a moment</span>
        </div>
      </motion.div>
    );
  }

  if (!resumeUrl) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className={cn(
          "text-center py-8 px-4 rounded-xl border-2 border-dashed transition-all duration-200",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-muted-foreground/20 hover:border-primary/40 hover:bg-secondary/30"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div className={cn(
          "w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 transition-all duration-200",
          isDragging ? "bg-primary/20 scale-110" : "bg-secondary/50"
        )}>
          <FileText className={cn(
            "h-7 w-7 transition-colors",
            isDragging ? "text-primary" : "text-muted-foreground"
          )} />
        </div>
        <p className={cn(
          "text-sm font-medium mb-1 transition-colors",
          isDragging ? "text-primary" : "text-foreground"
        )}>
          {isDragging ? "Drop your resume here" : "Upload your resume"}
        </p>
        <p className="text-xs text-muted-foreground mb-4">
          Drag & drop or click to browse
        </p>
        {onUpload && !isDragging && (
          <Button
            size="sm"
            variant="default"
            className="gap-2"
            onClick={onUpload}
            disabled={uploading}
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            Choose File
          </Button>
        )}
        <p className="text-xs text-muted-foreground mt-4">
          PDF or Word • Max 10MB
        </p>
        <div className="flex items-center justify-center gap-1.5 mt-2">
          <Sparkles className="h-3.5 w-3.5 text-primary" />
          <span className="text-xs text-primary font-medium">AI will auto-fill your profile</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={cn(
        "space-y-3 p-1 -m-1 rounded-xl transition-all duration-200",
        isDragging && "bg-primary/5 ring-2 ring-primary/50 ring-dashed"
      )}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <AnimatePresence>
        {isDragging && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-center py-2 text-sm text-primary font-medium"
          >
            Drop to replace resume
          </motion.div>
        )}
      </AnimatePresence>
      
      <motion.div
        className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-primary/5 to-transparent border border-primary/20 cursor-pointer hover:border-primary/40 hover:shadow-sm transition-all group"
        onClick={onView}
        whileHover={{ scale: 1.01 }}
        whileTap={{ scale: 0.99 }}
      >
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
          <FileText className="h-6 w-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <p className="font-semibold text-foreground text-sm truncate">
              {fileName}
            </p>
            <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
          </div>
          <p className="text-xs text-muted-foreground">
            {fileSize} • Click to preview
          </p>
        </div>
        <div className="p-2 rounded-lg bg-secondary/50 group-hover:bg-secondary transition-colors">
          <Eye className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-colors" />
        </div>
      </motion.div>
      
      {onUpload && !isDragging && (
        <Button
          variant="outline"
          size="sm"
          className="w-full gap-2 h-9"
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
    </motion.div>
  );
};

export default ResumeCard;