import { useState, useRef } from 'react';
import { format } from 'date-fns';
import { 
  Upload, 
  FileText, 
  CheckCircle, 
  Loader2, 
  Calendar,
  File,
  X,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { useCandidateAssignment } from '@/hooks/useEvents';
import { Event } from '@/types/events';

interface AssignmentModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  event: Event;
}

const AssignmentModal = ({ open, onOpenChange, event }: AssignmentModalProps) => {
  const { submission, loading, uploading, submitAssignment } = useCandidateAssignment(event.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFileSelect = (file: File) => {
    // Validate file type
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext && !event.allowed_file_types?.includes(ext)) {
      return; // Could add toast error here
    }
    
    // Validate file size
    const maxBytes = (event.max_file_size_mb || 10) * 1024 * 1024;
    if (file.size > maxBytes) {
      return; // Could add toast error here
    }
    
    setSelectedFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile) return;
    
    const success = await submitAssignment(selectedFile);
    if (success) {
      setSelectedFile(null);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Already submitted view
  if (submission) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              Assignment Submitted
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <FileText className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{submission.file_name}</p>
                    <p className="text-sm text-muted-foreground">
                      Submitted {format(new Date(submission.submitted_at), 'PPP p')}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {submission.score !== null && (
              <div className="text-center space-y-2">
                <div className="text-3xl font-bold text-primary">
                  {submission.score}/{submission.max_score}
                </div>
                <p className="text-muted-foreground">Score</p>
                {submission.feedback && (
                  <div className="mt-4 p-4 rounded-lg bg-muted text-left">
                    <p className="text-sm font-medium mb-1">Feedback:</p>
                    <p className="text-sm">{submission.feedback}</p>
                  </div>
                )}
              </div>
            )}

            {submission.score === null && (
              <div className="text-center py-4">
                <Badge variant="secondary">Pending Review</Badge>
                <p className="text-sm text-muted-foreground mt-2">
                  Your submission is being reviewed by the recruiter
                </p>
              </div>
            )}
          </div>
          <Button onClick={() => onOpenChange(false)} className="w-full">
            Close
          </Button>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{event.title}</DialogTitle>
          <DialogDescription>{event.description}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          {/* Deadline */}
          {event.submission_deadline && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Due: {format(new Date(event.submission_deadline), 'PPP p')}</span>
            </div>
          )}

          {/* File requirements */}
          <div className="text-sm space-y-1">
            <p className="text-muted-foreground">
              Allowed types: {event.allowed_file_types?.join(', ') || 'pdf, doc, docx'}
            </p>
            <p className="text-muted-foreground">
              Max size: {event.max_file_size_mb || 10} MB
            </p>
          </div>

          {/* Drop zone */}
          <input
            ref={fileInputRef}
            type="file"
            accept={event.allowed_file_types?.map(t => `.${t}`).join(',')}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFileSelect(file);
            }}
            className="hidden"
          />

          {selectedFile ? (
            <Card className="border-primary">
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <File className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedFile(null)}
                    className="shrink-0"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`
                border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
                ${dragOver 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-primary/50'
                }
              `}
            >
              <Upload className="h-10 w-10 mx-auto mb-4 text-muted-foreground" />
              <p className="font-medium">Click to upload or drag and drop</p>
              <p className="text-sm text-muted-foreground mt-1">
                {event.allowed_file_types?.map(t => t.toUpperCase()).join(', ')} up to {event.max_file_size_mb || 10}MB
              </p>
            </div>
          )}
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
            Cancel
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={!selectedFile || uploading} 
            className="flex-1"
          >
            {uploading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                Submit
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AssignmentModal;
