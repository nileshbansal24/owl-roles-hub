import { useState } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import VerificationBadge from "./VerificationBadge";
import {
  Shield,
  CheckCircle2,
  Clock,
  Send,
  Loader2,
  AlertCircle,
  Upload,
  FileText,
} from "lucide-react";

type VerificationStatus = "verified" | "pending" | "rejected" | "none";

interface VerificationRequestCardProps {
  userId: string;
  status: VerificationStatus;
  onStatusChange: (newStatus: VerificationStatus) => void;
}

const VerificationRequestCard = ({
  userId,
  status,
  onStatusChange,
}: VerificationRequestCardProps) => {
  const { toast } = useToast();
  const [requesting, setRequesting] = useState(false);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleRequestVerification = async () => {
    if (!proofFile) {
      toast({
        title: "Proof Required",
        description: "Please upload a proof document (ID card, letter, certificate) to verify your institution.",
        variant: "destructive",
      });
      return;
    }

    setRequesting(true);
    setUploading(true);

    try {
      // Upload proof file
      const fileExt = proofFile.name.split('.').pop();
      const filePath = `verification-proofs/${userId}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("credentials")
        .upload(filePath, proofFile);

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from("credentials")
        .getPublicUrl(filePath);

      // Insert verification request with proof
      const { error } = await supabase.from("institution_verifications").insert({
        recruiter_id: userId,
        status: "pending",
        proof_url: filePath,
        proof_file_name: proofFile.name,
      });

      if (error) {
        if (error.code === "23505") {
          // Already exists, update with proof
          await supabase
            .from("institution_verifications")
            .update({
              status: "pending",
              proof_url: filePath,
              proof_file_name: proofFile.name,
              verification_notes: null,
              verified_at: null,
            })
            .eq("recruiter_id", userId);
        } else {
          throw error;
        }
      }

      onStatusChange("pending");
      setProofFile(null);
      toast({
        title: "Verification requested!",
        description: "Your verification request with proof has been submitted for admin review.",
      });
    } catch (error: any) {
      console.error("Verification request error:", error);
      toast({
        title: "Request failed",
        description: error.message || "Failed to submit verification request",
        variant: "destructive",
      });
    } finally {
      setRequesting(false);
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" />
          Institution Verification
        </CardTitle>
        <CardDescription>
          Upload proof to verify your institution affiliation
        </CardDescription>
      </CardHeader>
      <CardContent>
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          {/* Current Status */}
          <div className="p-4 rounded-lg bg-secondary/50 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">Current Status</span>
              <VerificationBadge status={status} size="md" />
            </div>

            {status === "verified" && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-emerald-500/10 border border-emerald-500/20">
                <CheckCircle2 className="h-5 w-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Congratulations!</p>
                  <p className="text-xs text-muted-foreground">
                    Your institution has been verified. Candidates will see a verification badge on your job listings.
                  </p>
                </div>
              </div>
            )}

            {status === "pending" && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-amber-500/10 border border-amber-500/20">
                <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Under Review</p>
                  <p className="text-xs text-muted-foreground">
                    Your verification request is being reviewed by the admin. This usually takes 2-3 business days.
                  </p>
                </div>
              </div>
            )}

            {status === "rejected" && (
              <div className="flex items-start gap-2 p-3 rounded-md bg-destructive/10 border border-destructive/20">
                <AlertCircle className="h-5 w-5 text-destructive shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-medium text-foreground">Verification Rejected</p>
                  <p className="text-xs text-muted-foreground">
                    Your verification was not approved. Please upload a clearer proof document and try again.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Benefits */}
          {(status === "none" || status === "rejected") && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-foreground">Benefits of Verification:</p>
              <ul className="space-y-1.5 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Build trust with qualified candidates
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Display verification badge on job listings
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary" />
                  Higher visibility in search results
                </li>
              </ul>
            </div>
          )}

          {/* Proof Upload & Request */}
          {(status === "none" || status === "rejected") && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label className="text-sm font-medium">Upload Proof of Institution *</Label>
                <p className="text-xs text-muted-foreground">
                  Upload an ID card, employment letter, or any official document proving you belong to the mentioned institution.
                </p>
                <div className="flex items-center gap-3">
                  <Input
                    type="file"
                    accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                    onChange={(e) => setProofFile(e.target.files?.[0] || null)}
                    className="flex-1"
                  />
                </div>
                {proofFile && (
                  <div className="flex items-center gap-2 text-sm text-primary">
                    <FileText className="h-4 w-4" />
                    {proofFile.name} ({(proofFile.size / 1024).toFixed(0)} KB)
                  </div>
                )}
              </div>

              <Button
                onClick={handleRequestVerification}
                disabled={requesting || !proofFile}
                className="w-full gap-2"
              >
                {requesting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {uploading ? "Uploading Proof..." : "Submitting Request..."}
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4" />
                    {status === "rejected" ? "Re-submit Verification" : "Submit Verification Request"}
                  </>
                )}
              </Button>
            </div>
          )}
        </motion.div>
      </CardContent>
    </Card>
  );
};

export default VerificationRequestCard;
