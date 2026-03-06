import * as React from "react";
import { useState, useRef } from "react";
import { Upload, CheckCircle2, Loader2, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface CredentialUploadButtonProps {
  credentialType: "education" | "employment" | "certification" | "achievement";
  credentialTitle: string;
  credentialIssuer: string;
  compact?: boolean;
}

export const CredentialUploadButton = ({
  credentialType,
  credentialTitle,
  credentialIssuer,
  compact = false,
}: CredentialUploadButtonProps) => {
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [hasExisting, setHasExisting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const checkedRef = useRef(false);

  // Check if a credential doc already exists
  React.useEffect(() => {
    if (!user || checkedRef.current) return;
    checkedRef.current = true;
    supabase
      .from("credential_verifications")
      .select("id")
      .eq("candidate_id", user.id)
      .eq("credential_type", credentialType)
      .eq("credential_title", credentialTitle)
      .maybeSingle()
      .then(({ data }) => {
        if (data) setHasExisting(true);
      });
  }, [user, credentialType, credentialTitle]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "File too large", description: "Maximum file size is 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const hash = await computeSHA256(file);
      const filePath = `${user.id}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("credentials").upload(filePath, file);
      if (uploadError) throw uploadError;

      // Upsert credential verification record
      const { error } = await supabase.from("credential_verifications").upsert(
        {
          recruiter_id: user.id, // candidate acts as self-verifier
          candidate_id: user.id,
          uploaded_by: user.id,
          credential_type: credentialType,
          credential_title: credentialTitle,
          credential_issuer: credentialIssuer || null,
          status: "pending",
          document_hash: hash,
          document_url: filePath,
          document_name: file.name,
          hash_algorithm: "SHA-256",
          anchored_at: new Date().toISOString(),
        },
        { onConflict: "recruiter_id,candidate_id,credential_type,credential_title" }
      );
      if (error) throw error;

      setUploaded(true);
      setHasExisting(true);
      toast({
        title: "Certificate uploaded",
        description: `SHA-256 hash anchored for verification. Recruiters can now verify this credential.`,
      });
    } catch (err: any) {
      console.error("Credential upload error:", err);
      toast({ title: "Upload failed", description: err.message || "Could not upload certificate", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const isAnchored = hasExisting || uploaded;

  if (compact) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <div className="inline-flex">
              <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} />
              <Button
                variant="ghost"
                size="icon"
                className={`h-7 w-7 ${isAnchored ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"}`}
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
              >
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : isAnchored ? (
                  <CheckCircle2 className="h-3.5 w-3.5" />
                ) : (
                  <Upload className="h-3.5 w-3.5" />
                )}
              </Button>
            </div>
          </TooltipTrigger>
          <TooltipContent>
            {isAnchored ? "Certificate uploaded — hash anchored ✓" : "Upload certificate for verification"}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return (
    <div>
      <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUpload} />
      <Button
        variant={isAnchored ? "outline" : "ghost"}
        size="sm"
        className={`text-xs gap-1.5 ${isAnchored ? "text-emerald-600 dark:text-emerald-400 border-emerald-500/20" : ""}`}
        disabled={uploading}
        onClick={() => fileInputRef.current?.click()}
      >
        {uploading ? (
          <Loader2 className="h-3 w-3 animate-spin" />
        ) : isAnchored ? (
          <CheckCircle2 className="h-3 w-3" />
        ) : (
          <Upload className="h-3 w-3" />
        )}
        {isAnchored ? "Re-upload Certificate" : "Upload Certificate"}
      </Button>
    </div>
  );
};

export default CredentialUploadButton;
