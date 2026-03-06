import { useState, useMemo, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  GraduationCap,
  Briefcase,
  Award,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Fingerprint,
  FileCheck,
  Star,
  Loader2,
  Ban,
  Upload,
  FileText,
  Hash,
  ShieldCheck,
  AlertTriangle,
  Download,
  RefreshCw,
  Copy,
  Check,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import type { Profile } from "@/types/recruiter";

// ─── Types ──────────────────────────────────────────────────────────

type VerificationStatus = "verified" | "pending" | "unverified" | "rejected";

interface Credential {
  id: string;
  type: "education" | "employment" | "certification" | "achievement";
  title: string;
  issuer: string;
  verificationLinks: { label: string; url: string }[];
}

interface StoredVerification {
  id: string;
  credential_type: string;
  credential_title: string;
  credential_issuer: string | null;
  status: string;
  verification_notes: string | null;
  verification_link: string | null;
  verified_at: string | null;
  candidate_id: string;
  document_hash: string | null;
  document_url: string | null;
  document_name: string | null;
  hash_algorithm: string | null;
  anchored_at: string | null;
}

interface CandidateWithCredentials {
  candidate: Profile;
  credentials: Credential[];
  verifications: Map<string, StoredVerification>;
  trustScore: number;
}

// ─── Config ─────────────────────────────────────────────────────────

const statusConfig: Record<VerificationStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
  verified: { icon: CheckCircle2, label: "Verified", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  pending: { icon: Clock, label: "Pending", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  unverified: { icon: XCircle, label: "No Document", className: "bg-muted text-muted-foreground border-border" },
  rejected: { icon: Ban, label: "Tampered", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const typeConfig: Record<string, { icon: typeof GraduationCap; label: string }> = {
  education: { icon: GraduationCap, label: "Education" },
  employment: { icon: Briefcase, label: "Employment" },
  certification: { icon: Award, label: "Certification" },
  achievement: { icon: Star, label: "Achievement" },
};

// ─── Utility: SHA-256 Hash ──────────────────────────────────────────

async function computeSHA256(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  const hashBuffer = await crypto.subtle.digest("SHA-256", buffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ─── Extract credentials from profile ───────────────────────────────

const extractCredentials = (candidate: Profile): Credential[] => {
  const creds: Credential[] = [];

  if (candidate.education && Array.isArray(candidate.education)) {
    (candidate.education as any[]).forEach((edu, i) => {
      const degree = edu.degree || edu.title || "Degree";
      const institution = edu.institution || edu.school || edu.university || candidate.university || "Institution";
      const links: { label: string; url: string }[] = [];
      if (institution !== "Institution") {
        links.push({ label: `Search ${institution}`, url: `https://www.google.com/search?q=${encodeURIComponent(institution + " university official")}` });
      }
      creds.push({ id: `edu-${candidate.id}-${i}`, type: "education", title: `${degree} — ${institution}`, issuer: institution, verificationLinks: links });
    });
  } else if (candidate.university) {
    creds.push({
      id: `edu-${candidate.id}-0`,
      type: "education",
      title: `Education at ${candidate.university}`,
      issuer: candidate.university,
      verificationLinks: [{ label: `Search ${candidate.university}`, url: `https://www.google.com/search?q=${encodeURIComponent(candidate.university + " official website")}` }],
    });
  }

  if (candidate.experience && Array.isArray(candidate.experience)) {
    (candidate.experience as any[]).forEach((exp, i) => {
      const role = exp.role || exp.title || exp.position || "Role";
      const institution = exp.institution || exp.company || exp.organization || "Employer";
      const links: { label: string; url: string }[] = [];
      if (institution !== "Employer") {
        links.push({ label: `Search ${institution}`, url: `https://www.google.com/search?q=${encodeURIComponent(institution + " official")}` });
      }
      creds.push({ id: `emp-${candidate.id}-${i}`, type: "employment", title: `${role} at ${institution}`, issuer: institution, verificationLinks: links });
    });
  }

  if (candidate.orcid_id) {
    creds.push({ id: `cert-orcid-${candidate.id}`, type: "certification", title: "ORCID Researcher ID", issuer: "ORCID", verificationLinks: [{ label: "Verify on ORCID", url: `https://orcid.org/${candidate.orcid_id}` }] });
  }

  if (candidate.scopus_link) {
    creds.push({ id: `cert-scopus-${candidate.id}`, type: "certification", title: "Scopus Author Profile", issuer: "Scopus / Elsevier", verificationLinks: [{ label: "Verify on Scopus", url: candidate.scopus_link }] });
  }

  if (candidate.achievements && candidate.achievements.length > 0) {
    candidate.achievements.forEach((ach, i) => {
      creds.push({ id: `ach-${candidate.id}-${i}`, type: "achievement", title: ach, issuer: candidate.university || "Issuing Authority", verificationLinks: [] });
    });
  }

  return creds;
};

const credKey = (type: string, title: string) => `${type}::${title}`;

const computeTrustScore = (credentials: Credential[], verifications: Map<string, StoredVerification>): number => {
  if (credentials.length === 0) return 0;
  const verified = credentials.filter((c) => {
    const v = verifications.get(credKey(c.type, c.title));
    return v?.status === "verified";
  }).length;
  return Math.round((verified / credentials.length) * 100);
};

// ─── Credential Card ────────────────────────────────────────────────

interface CredentialCardProps {
  credential: Credential;
  verification?: StoredVerification;
  candidateId: string;
  onVerificationUpdate: () => void;
}

const CredentialCard = ({ credential, verification, candidateId, onVerificationUpdate }: CredentialCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<"match" | "mismatch" | null>(null);
  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const verifyInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();

  const currentStatus = (verification?.status as VerificationStatus) || "unverified";
  const config = statusConfig[currentStatus];
  const typeInfo = typeConfig[credential.type];
  const StatusIcon = config.icon;
  const TypeIcon = typeInfo.icon;

  // Upload document and compute hash
  const handleUploadDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    setUploading(true);
    try {
      // 1. Compute SHA-256 hash
      const hash = await computeSHA256(file);

      // 2. Upload to storage
      const filePath = `${candidateId}/${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage.from("credentials").upload(filePath, file);
      if (uploadError) throw uploadError;

      // 3. Upsert verification record with hash
      if (verification?.id) {
        const { error } = await supabase
          .from("credential_verifications")
          .update({
            document_hash: hash,
            document_url: filePath,
            document_name: file.name,
            hash_algorithm: "SHA-256",
            status: "pending",
            anchored_at: new Date().toISOString(),
          })
          .eq("id", verification.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("credential_verifications").insert({
          recruiter_id: user.id,
          candidate_id: candidateId,
          credential_type: credential.type,
          credential_title: credential.title,
          credential_issuer: credential.issuer || null,
          status: "pending",
          document_hash: hash,
          document_url: filePath,
          document_name: file.name,
          hash_algorithm: "SHA-256",
          anchored_at: new Date().toISOString(),
          uploaded_by: user.id,
        });
        if (error) throw error;
      }

      toast({ title: "Document anchored", description: `SHA-256 hash: ${hash.slice(0, 16)}... stored successfully` });
      onVerificationUpdate();
    } catch (err: any) {
      console.error(err);
      toast({ title: "Upload failed", description: err.message || "Could not upload document", variant: "destructive" });
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // Verify a document against stored hash
  const handleVerifyDocument = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !verification?.document_hash) return;

    setVerifying(true);
    setVerifyResult(null);
    try {
      const hash = await computeSHA256(file);
      const matches = hash === verification.document_hash;
      setVerifyResult(matches ? "match" : "mismatch");

      if (matches) {
        // Update status to verified
        await supabase
          .from("credential_verifications")
          .update({ status: "verified", verified_at: new Date().toISOString() })
          .eq("id", verification.id);
        toast({ title: "✅ Document Verified!", description: "SHA-256 hash matches the anchored record. This document is authentic." });
        onVerificationUpdate();
      } else {
        await supabase
          .from("credential_verifications")
          .update({ status: "rejected", verified_at: new Date().toISOString() })
          .eq("id", verification.id);
        toast({ title: "⚠️ Hash Mismatch!", description: "This document does NOT match the anchored hash. It may have been tampered with.", variant: "destructive" });
        onVerificationUpdate();
      }
    } catch (err) {
      toast({ title: "Verification failed", description: "Could not verify the document", variant: "destructive" });
    } finally {
      setVerifying(false);
      if (verifyInputRef.current) verifyInputRef.current.value = "";
    }
  };

  const handleCopyHash = () => {
    if (!verification?.document_hash) return;
    navigator.clipboard.writeText(verification.document_hash);
    setCopied(true);
    toast({ title: "Copied!", description: "SHA-256 hash copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  // Download the stored document
  const handleDownloadDocument = async () => {
    if (!verification?.document_url) return;
    const { data, error } = await supabase.storage.from("credentials").createSignedUrl(verification.document_url, 60);
    if (error || !data?.signedUrl) {
      toast({ title: "Error", description: "Could not generate download link", variant: "destructive" });
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  return (
    <motion.div layout className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <TypeIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm">{credential.title}</p>
            <p className="text-xs text-muted-foreground">{credential.issuer}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge variant="outline" className={config.className}>
            <StatusIcon className="h-3 w-3 mr-1" />
            {config.label}
          </Badge>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setExpanded(!expanded)}>
            {expanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
          </Button>
        </div>
      </div>

      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mt-4 pt-4 border-t space-y-4">

              {/* External verification links */}
              {credential.verificationLinks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">External Verification</p>
                  <div className="flex flex-wrap gap-2">
                    {credential.verificationLinks.map((link, i) => (
                      <Button key={i} variant="outline" size="sm" className="text-xs gap-1.5" onClick={() => window.open(link.url, "_blank", "noopener")}>
                        <ExternalLink className="h-3 w-3" />
                        {link.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Anchored hash info */}
              {verification?.document_hash && (
                <div className="rounded-lg bg-muted/50 p-3 space-y-2">
                  <div className="flex items-center gap-2 text-xs font-medium">
                    <Hash className="h-3.5 w-3.5 text-primary" />
                    Anchored Document Hash
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-[10px] font-mono bg-background rounded px-2 py-1 truncate flex-1 border">
                      {verification.document_hash}
                    </code>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={handleCopyHash}>
                            {copied ? <Check className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>Copy hash</TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                  <div className="flex flex-wrap gap-3 text-[10px] text-muted-foreground">
                    <span>Algorithm: {verification.hash_algorithm || "SHA-256"}</span>
                    <span>File: {verification.document_name}</span>
                    {verification.anchored_at && <span>Anchored: {new Date(verification.anchored_at).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex gap-2 mt-2">
                    <Button variant="outline" size="sm" className="text-xs gap-1.5" onClick={handleDownloadDocument}>
                      <Download className="h-3 w-3" />
                      View Document
                    </Button>
                  </div>
                </div>
              )}

              {/* Verification result */}
              {verifyResult && (
                <div className={`rounded-lg p-3 flex items-center gap-2 text-sm ${verifyResult === "match" ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400" : "bg-destructive/10 text-destructive"}`}>
                  {verifyResult === "match" ? (
                    <>
                      <ShieldCheck className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Document Authentic</p>
                        <p className="text-xs opacity-80">SHA-256 hash matches the anchored record</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="h-5 w-5" />
                      <div>
                        <p className="font-medium">Document Tampered</p>
                        <p className="text-xs opacity-80">Hash does NOT match — this document may have been altered</p>
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex flex-wrap gap-2">
                {/* Upload / anchor document */}
                <div>
                  <input ref={fileInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleUploadDocument} />
                  <Button size="sm" variant="outline" className="text-xs gap-1.5" disabled={uploading} onClick={() => fileInputRef.current?.click()}>
                    {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {verification?.document_hash ? "Re-anchor Document" : "Upload & Anchor Document"}
                  </Button>
                </div>

                {/* Verify against hash */}
                {verification?.document_hash && (
                  <div>
                    <input ref={verifyInputRef} type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={handleVerifyDocument} />
                    <Button size="sm" variant="default" className="text-xs gap-1.5" disabled={verifying} onClick={() => verifyInputRef.current?.click()}>
                      {verifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />}
                      Verify Document Against Hash
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ─── Candidate Card ─────────────────────────────────────────────────

const CandidateCredentialCard = ({
  data,
  onVerificationUpdate,
}: {
  data: CandidateWithCredentials;
  onVerificationUpdate: () => void;
}) => {
  const [expanded, setExpanded] = useState(false);
  const { candidate, credentials, verifications, trustScore } = data;
  const verifiedCount = credentials.filter((c) => verifications.get(credKey(c.type, c.title))?.status === "verified").length;
  const hasAnchored = credentials.some((c) => verifications.get(credKey(c.type, c.title))?.document_hash);

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Card className="overflow-hidden">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <Avatar className="h-10 w-10 shrink-0">
                <AvatarImage src={candidate.avatar_url || ""} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {(candidate.full_name || "?").slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <CardTitle className="text-base truncate">{candidate.full_name || "Unknown"}</CardTitle>
                <CardDescription className="truncate">
                  {candidate.role || candidate.headline || "Candidate"}
                  {hasAnchored && (
                    <Badge variant="outline" className="ml-2 text-[10px] bg-primary/5 border-primary/20 text-primary">
                      <Hash className="h-2.5 w-2.5 mr-0.5" />
                      Hash Anchored
                    </Badge>
                  )}
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <div className={`text-lg font-bold ${trustScore >= 75 ? "text-emerald-600 dark:text-emerald-400" : trustScore >= 50 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                        {trustScore}%
                      </div>
                      <p className="text-[10px] text-muted-foreground">Trust</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{verifiedCount}/{credentials.length} credentials verified via document hash</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <Button variant="outline" size="sm" onClick={() => setExpanded(!expanded)}>
                {expanded ? "Hide" : "View"} ({credentials.length})
              </Button>
            </div>
          </div>
          <Progress value={trustScore} className="h-1.5 mt-3" />
        </CardHeader>

        <AnimatePresence>
          {expanded && (
            <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
              <CardContent className="pt-0 space-y-3">
                {credentials.map((cred) => (
                  <CredentialCard
                    key={cred.id}
                    credential={cred}
                    verification={verifications.get(credKey(cred.type, cred.title))}
                    candidateId={candidate.id}
                    onVerificationUpdate={onVerificationUpdate}
                  />
                ))}
              </CardContent>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
};

// ─── Main Tab ───────────────────────────────────────────────────────

interface BlockchainCredentialsTabProps {
  candidates: Profile[];
  isLoading?: boolean;
}

const BlockchainCredentialsTab = ({ candidates, isLoading = false }: BlockchainCredentialsTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VerificationStatus>("all");
  const [storedVerifications, setStoredVerifications] = useState<StoredVerification[]>([]);
  const [loadingVerifications, setLoadingVerifications] = useState(true);
  const { toast } = useToast();
  const { user } = useAuth();

  const fetchVerifications = useCallback(async () => {
    if (!user) return;
    setLoadingVerifications(true);
    const { data, error } = await supabase
      .from("credential_verifications")
      .select("id, credential_type, credential_title, credential_issuer, status, verification_notes, verification_link, verified_at, candidate_id, document_hash, document_url, document_name, hash_algorithm, anchored_at")
      .eq("recruiter_id", user.id);

    if (!error && data) {
      setStoredVerifications(data as StoredVerification[]);
    }
    setLoadingVerifications(false);
  }, [user]);

  useEffect(() => {
    fetchVerifications();
  }, [fetchVerifications]);

  const verificationsByCandidate = useMemo(() => {
    const map = new Map<string, Map<string, StoredVerification>>();
    storedVerifications.forEach((v) => {
      if (!map.has(v.candidate_id)) map.set(v.candidate_id, new Map());
      map.get(v.candidate_id)!.set(credKey(v.credential_type, v.credential_title), v);
    });
    return map;
  }, [storedVerifications]);

  const candidatesWithCredentials = useMemo<CandidateWithCredentials[]>(() => {
    return candidates
      .map((c) => {
        const credentials = extractCredentials(c);
        const verifications = verificationsByCandidate.get(c.id) || new Map<string, StoredVerification>();
        const trustScore = computeTrustScore(credentials, verifications);
        return { candidate: c, credentials, verifications, trustScore };
      })
      .filter((c) => c.credentials.length > 0)
      .sort((a, b) => b.trustScore - a.trustScore);
  }, [candidates, verificationsByCandidate]);

  const filtered = useMemo(() => {
    let list = candidatesWithCredentials;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (c) =>
          c.candidate.full_name?.toLowerCase().includes(q) ||
          c.candidate.role?.toLowerCase().includes(q) ||
          c.candidate.university?.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== "all") {
      list = list.filter((c) =>
        c.credentials.some((cr) => {
          const v = c.verifications.get(credKey(cr.type, cr.title));
          const s = (v?.status as VerificationStatus) || "unverified";
          return s === statusFilter;
        })
      );
    }
    return list;
  }, [candidatesWithCredentials, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const allStatuses = candidatesWithCredentials.flatMap((c) =>
      c.credentials.map((cr) => {
        const v = c.verifications.get(credKey(cr.type, cr.title));
        return (v?.status as VerificationStatus) || "unverified";
      })
    );
    const anchored = storedVerifications.filter((v) => v.document_hash).length;
    return {
      total: allStatuses.length,
      verified: allStatuses.filter((s) => s === "verified").length,
      anchored,
      candidates: candidatesWithCredentials.length,
    };
  }, [candidatesWithCredentials, storedVerifications]);

  if (isLoading || loadingVerifications) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">
          <FileCheck className="h-6 w-6 text-primary" />
          OR Credential Verification
        </h2>
        <p className="text-sm text-muted-foreground mt-1">
          Upload credential documents to generate SHA-256 hashes for tamper-proof verification. Re-verify any document by comparing its hash against the anchored record.
        </p>
      </div>

      {/* How it works */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4">
          <p className="text-sm font-medium mb-2 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-primary" />
            How Hash-Based Verification Works
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="rounded-full bg-primary text-primary-foreground h-5 w-5 flex items-center justify-center shrink-0 text-[10px] font-bold">1</span>
              <span><strong>Upload</strong> a credential document (degree, experience letter, certificate)</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="rounded-full bg-primary text-primary-foreground h-5 w-5 flex items-center justify-center shrink-0 text-[10px] font-bold">2</span>
              <span><strong>SHA-256 hash</strong> is computed locally and stored as an immutable anchor</span>
            </div>
            <div className="flex items-start gap-2">
              <span className="rounded-full bg-primary text-primary-foreground h-5 w-5 flex items-center justify-center shrink-0 text-[10px] font-bold">3</span>
              <span><strong>Verify</strong> any document anytime by re-hashing and comparing — detects any tampering</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Credentials", value: stats.total, icon: Fingerprint },
          { label: "Hash Verified", value: stats.verified, icon: CheckCircle2 },
          { label: "Documents Anchored", value: stats.anchored, icon: Hash },
          { label: "Candidates", value: stats.candidates, icon: Shield },
        ].map((stat) => (
          <Card key={stat.label}>
            <CardContent className="p-4 flex items-center gap-3">
              <div className="rounded-lg bg-primary/10 p-2">
                <stat.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search candidates by name, role, university..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "verified", "pending", "unverified", "rejected"] as const).map((s) => (
            <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
              {s === "all" ? "All" : s === "rejected" ? "Tampered" : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Candidate List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.slice(0, 20).map((data) => (
            <CandidateCredentialCard key={data.candidate.id} data={data} onVerificationUpdate={fetchVerifications} />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg">No credentials found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try adjusting your search filters." : "Credentials will appear here when candidates have profile data (education, experience, ORCID, etc)."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BlockchainCredentialsTab;
