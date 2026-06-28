import { useState, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Upload, FileText, CheckCircle, XCircle, Loader2, AlertTriangle, Users, Download } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

interface UploadResult {
  filename: string;
  success: boolean;
  email?: string;
  error?: string;
  userId?: string;
  password?: string;
  years_experience?: number;
  tier?: string;
}

const CHUNK_SIZE = 40; // files per edge function request


interface AdminMassUploadProps {
  loading?: boolean;
}

const AdminMassUpload = ({ loading }: AdminMassUploadProps) => {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [results, setResults] = useState<UploadResult[]>([]);
  const [progress, setProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const droppedFiles = Array.from(e.dataTransfer.files).filter(
      file => file.type === "application/pdf" || 
              file.type === "application/msword" ||
              file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    );

    if (droppedFiles.length > 0) {
      setFiles(prev => [...prev, ...droppedFiles]);
      setResults([]);
    }
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files);
      setFiles(prev => [...prev, ...selectedFiles]);
      setResults([]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  const processChunk = async (
    chunk: File[],
    accessToken: string,
    onResult: (r: UploadResult) => void,
  ) => {
    const formData = new FormData();
    chunk.forEach(f => formData.append("resumes", f));

    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-mass-upload`,
      {
        method: "POST",
        headers: { Authorization: `Bearer ${accessToken}` },
        body: formData,
      }
    );

    if (!response.ok || !response.body) {
      const txt = await response.text().catch(() => "");
      throw new Error(txt || `HTTP ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";
      for (const line of lines) {
        if (!line.trim()) continue;
        try {
          const evt = JSON.parse(line);
          if (evt.type === "result" && evt.result) onResult(evt.result as UploadResult);
        } catch { /* ignore partial */ }
      }
    }
    if (buffer.trim()) {
      try {
        const evt = JSON.parse(buffer);
        if (evt.type === "result" && evt.result) onResult(evt.result as UploadResult);
      } catch { /* ignore */ }
    }
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast.error("Please select files to upload");
      return;
    }

    setIsUploading(true);
    setProgress(0);
    setResults([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        toast.error("Not authenticated");
        return;
      }

      const total = files.length;
      const chunks: File[][] = [];
      for (let i = 0; i < files.length; i += CHUNK_SIZE) {
        chunks.push(files.slice(i, i + CHUNK_SIZE));
      }

      const collected: UploadResult[] = [];
      const onResult = (r: UploadResult) => {
        collected.push(r);
        setResults([...collected]);
        setProgress(Math.round((collected.length / total) * 100));
      };

      for (let i = 0; i < chunks.length; i++) {
        try {
          await processChunk(chunks[i], session.access_token, onResult);
        } catch (chunkErr) {
          console.error(`Chunk ${i} failed:`, chunkErr);
          chunks[i].forEach(f => onResult({
            filename: f.name,
            success: false,
            error: chunkErr instanceof Error ? chunkErr.message : "Chunk failed",
          }));
        }
      }

      const successCount = collected.filter(r => r.success).length;
      const failCount = collected.length - successCount;
      if (successCount > 0) toast.success(`Created ${successCount} candidate accounts`);
      if (failCount > 0) toast.warning(`${failCount} resumes failed to process`);

      setFiles([]);
    } catch (error) {
      console.error("Upload error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to upload resumes");
    } finally {
      setIsUploading(false);
    }
  };


  const successCount = results.filter(r => r.success).length;
  const failCount = results.filter(r => !r.success).length;

  const downloadCSV = () => {
    if (results.length === 0) return;

    const headers = ["Filename", "Status", "Email", "Password", "Years Experience", "Tier", "User ID", "Error"];
    const rows = results.map(r => [
      r.filename,
      r.success ? "Success" : "Failed",
      r.email || "",
      r.password || "",
      r.years_experience != null ? String(r.years_experience) : "",
      r.tier || "",
      r.userId || "",
      r.error || ""
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(","))
    ].join("\n");


    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `mass-upload-report-${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast.success("CSV report downloaded");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-64 bg-muted animate-pulse rounded-lg" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold">Mass Resume Upload</h2>
          <p className="text-muted-foreground">
            Upload multiple resumes to auto-create candidate accounts
          </p>
        </div>
        <Button
          variant="outline"
          onClick={async () => {
            if (!confirm("Reset all candidate passwords to NAME1234 format? This affects every candidate account (e.g. Mayank → MAYA1234).")) return;
            try {
              const { data: { session } } = await supabase.auth.getSession();
              if (!session) return toast.error("Not authenticated");
              const res = await fetch(
                `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/admin-reset-passwords`,
                { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } }
              );
              const data = await res.json();
              if (!res.ok) throw new Error(data.error || "Reset failed");
              toast.success(data.message || "Passwords reset");
            } catch (err) {
              toast.error(err instanceof Error ? err.message : "Reset failed");
            }
          }}
        >
          Reset All Candidate Passwords
        </Button>
      </div>

      {/* Info Card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="h-5 w-5 text-primary mt-0.5" />
            <div className="text-sm">
              <p className="font-medium">How it works:</p>
              <ul className="list-disc list-inside text-muted-foreground mt-1 space-y-1">
                <li>Upload PDF or Word resumes</li>
                <li>AI extracts profile data including email</li>
                <li>User account is created with password <strong>NAME1234</strong> (first 4 letters of first name in uppercase + 1234, e.g. Mayank → MAYA1234)</li>
                <li>Share these credentials with the candidate; they can change it later</li>
                <li>If email already exists, signup with that email is blocked</li>
                <li>Profile is populated with extracted data</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Upload Area */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Upload Resumes
          </CardTitle>
          <CardDescription>
            Drag and drop or click to select resume files (PDF, DOC, DOCX)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Drop Zone */}
          <div
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-lg p-8 text-center transition-colors",
              dragActive ? "border-primary bg-primary/5" : "border-muted-foreground/25 hover:border-primary/50",
              isUploading && "pointer-events-none opacity-50"
            )}
          >
            <input
              type="file"
              id="resume-upload"
              multiple
              accept=".pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
              disabled={isUploading}
            />
            <label htmlFor="resume-upload" className="cursor-pointer">
              <Upload className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-lg font-medium">Drop resumes here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                Supports PDF, DOC, and DOCX files
              </p>
            </label>
          </div>

          {/* Selected Files */}
          {files.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium">{files.length} file(s) selected</p>
              <div className="max-h-48 overflow-y-auto space-y-2">
                {files.map((file, index) => (
                  <div 
                    key={index} 
                    className="flex items-center justify-between p-2 bg-muted rounded-lg"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="text-sm truncate">{file.name}</span>
                      <Badge variant="outline" className="flex-shrink-0">
                        {(file.size / 1024).toFixed(0)} KB
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeFile(index)}
                      disabled={isUploading}
                    >
                      <XCircle className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Progress */}
          {isUploading && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Processing resumes...</span>
                <span>{progress}%</span>
              </div>
              <Progress value={progress} />
            </div>
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || isUploading}
            className="w-full"
            size="lg"
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Processing {files.length} Resume(s)...
              </>
            ) : (
              <>
                <Users className="h-4 w-4 mr-2" />
                Create {files.length} User Account(s)
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Results */}
      {results.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Upload Results</span>
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  {successCount > 0 && (
                    <Badge variant="default" className="bg-green-500">
                      {successCount} Success
                    </Badge>
                  )}
                  {failCount > 0 && (
                    <Badge variant="destructive">
                      {failCount} Failed
                    </Badge>
                  )}
                </div>
                <Button variant="outline" size="sm" onClick={downloadCSV}>
                  <Download className="h-4 w-4 mr-2" />
                  Download CSV
                </Button>
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {results.map((result, index) => (
                <div 
                  key={index}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    result.success ? "bg-green-500/10" : "bg-destructive/10"
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    {result.success ? (
                      <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive flex-shrink-0" />
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{result.filename}</p>
                      {result.email && (
                        <p className="text-xs text-muted-foreground">{result.email}</p>
                      )}
                      {result.password && (
                        <p className="text-xs font-mono text-muted-foreground">Password: {result.password}</p>
                      )}
                    </div>
                  </div>
                  {result.success ? (
                    <Badge variant="outline" className="text-green-500 border-green-500">
                      Created
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-destructive border-destructive text-xs">
                      {result.error}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AdminMassUpload;
