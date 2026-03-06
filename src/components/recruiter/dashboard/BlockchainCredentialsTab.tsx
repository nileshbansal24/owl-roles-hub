import { useState, useMemo, useEffect, useCallback } from "react";
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
  Blocks,
  Star,
  Loader2,
  FileCheck,
  Ban,
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
}

interface CandidateWithCredentials {
  candidate: Profile;
  credentials: Credential[];
  verifications: Map<string, StoredVerification>;
  trustScore: number;
}

const statusConfig: Record<VerificationStatus, { icon: typeof CheckCircle2; label: string; className: string }> = {
  verified: { icon: CheckCircle2, label: "Verified", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  pending: { icon: Clock, label: "Pending", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  unverified: { icon: XCircle, label: "Unverified", className: "bg-muted text-muted-foreground border-border" },
  rejected: { icon: Ban, label: "Rejected", className: "bg-destructive/10 text-destructive border-destructive/20" },
};

const typeConfig: Record<string, { icon: typeof GraduationCap; label: string }> = {
  education: { icon: GraduationCap, label: "Education" },
  employment: { icon: Briefcase, label: "Employment" },
  certification: { icon: Award, label: "Certification" },
  achievement: { icon: Star, label: "Achievement" },
};

// Extract real credentials from candidate profile data
const extractCredentials = (candidate: Profile): Credential[] => {
  const creds: Credential[] = [];

  // Education credentials
  if (candidate.education && Array.isArray(candidate.education)) {
    (candidate.education as any[]).forEach((edu, i) => {
      const degree = edu.degree || edu.title || "Degree";
      const institution = edu.institution || edu.school || edu.university || candidate.university || "Institution";
      const links: { label: string; url: string }[] = [];
      if (institution && institution !== "Institution") {
        links.push({ label: `Search ${institution}`, url: `https://www.google.com/search?q=${encodeURIComponent(institution + " university official")}` });
      }
      creds.push({
        id: `edu-${candidate.id}-${i}`,
        type: "education",
        title: `${degree} — ${institution}`,
        issuer: institution,
        verificationLinks: links,
      });
    });
  } else if (candidate.university) {
    creds.push({
      id: `edu-${candidate.id}-0`,
      type: "education",
      title: `Education at ${candidate.university}`,
      issuer: candidate.university,
      verificationLinks: [
        { label: `Search ${candidate.university}`, url: `https://www.google.com/search?q=${encodeURIComponent(candidate.university + " official website")}` },
      ],
    });
  }

  // Employment credentials from experience
  if (candidate.experience && Array.isArray(candidate.experience)) {
    (candidate.experience as any[]).forEach((exp, i) => {
      const role = exp.role || exp.title || exp.position || "Role";
      const institution = exp.institution || exp.company || exp.organization || "Employer";
      const links: { label: string; url: string }[] = [];
      if (institution !== "Employer") {
        links.push({ label: `Search ${institution}`, url: `https://www.google.com/search?q=${encodeURIComponent(institution + " official")}` });
      }
      creds.push({
        id: `emp-${candidate.id}-${i}`,
        type: "employment",
        title: `${role} at ${institution}`,
        issuer: institution,
        verificationLinks: links,
      });
    });
  }

  // ORCID link
  if (candidate.orcid_id) {
    creds.push({
      id: `cert-orcid-${candidate.id}`,
      type: "certification",
      title: `ORCID Researcher ID`,
      issuer: "ORCID",
      verificationLinks: [
        { label: "Verify on ORCID", url: `https://orcid.org/${candidate.orcid_id}` },
      ],
    });
  }

  // Scopus link
  if (candidate.scopus_link) {
    creds.push({
      id: `cert-scopus-${candidate.id}`,
      type: "certification",
      title: `Scopus Author Profile`,
      issuer: "Scopus / Elsevier",
      verificationLinks: [
        { label: "Verify on Scopus", url: candidate.scopus_link },
      ],
    });
  }

  // Achievements
  if (candidate.achievements && candidate.achievements.length > 0) {
    candidate.achievements.forEach((ach, i) => {
      creds.push({
        id: `ach-${candidate.id}-${i}`,
        type: "achievement",
        title: ach,
        issuer: candidate.university || "Issuing Authority",
        verificationLinks: [],
      });
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
  onUpdateStatus: (credential: Credential, status: VerificationStatus, notes: string) => Promise<void>;
}

const CredentialCard = ({ credential, verification, onUpdateStatus }: CredentialCardProps) => {
  const [expanded, setExpanded] = useState(false);
  const [notes, setNotes] = useState(verification?.verification_notes || "");
  const [saving, setSaving] = useState(false);
  const currentStatus = (verification?.status as VerificationStatus) || "unverified";
  const config = statusConfig[currentStatus];
  const typeInfo = typeConfig[credential.type];
  const StatusIcon = config.icon;
  const TypeIcon = typeInfo.icon;

  const handleStatusChange = async (newStatus: VerificationStatus) => {
    setSaving(true);
    await onUpdateStatus(credential, newStatus, notes);
    setSaving(false);
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="mt-4 pt-4 border-t space-y-4">
              {/* Verification Links */}
              {credential.verificationLinks.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Verify Externally</p>
                  <div className="flex flex-wrap gap-2">
                    {credential.verificationLinks.map((link, i) => (
                      <Button
                        key={i}
                        variant="outline"
                        size="sm"
                        className="text-xs gap-1.5"
                        onClick={() => window.open(link.url, "_blank", "noopener")}
                      >
                        <ExternalLink className="h-3 w-3" />
                        {link.label}
                      </Button>
                    ))}
                  </div>
                </div>
              )}

              {/* Verification info */}
              {verification?.verified_at && (
                <div className="text-xs text-muted-foreground">
                  Last updated: {new Date(verification.verified_at).toLocaleDateString()}
                </div>
              )}

              {/* Notes */}
              <div>
                <p className="text-xs font-medium text-muted-foreground mb-1.5">Verification Notes</p>
                <Textarea
                  placeholder="Add notes about this credential verification..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="text-xs min-h-[60px]"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  variant={currentStatus === "verified" ? "default" : "outline"}
                  className="text-xs gap-1.5"
                  disabled={saving}
                  onClick={() => handleStatusChange("verified")}
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Mark Verified
                </Button>
                <Button
                  size="sm"
                  variant={currentStatus === "pending" ? "default" : "outline"}
                  className="text-xs gap-1.5"
                  disabled={saving}
                  onClick={() => handleStatusChange("pending")}
                >
                  <Clock className="h-3.5 w-3.5" />
                  Mark Pending
                </Button>
                <Button
                  size="sm"
                  variant={currentStatus === "rejected" ? "destructive" : "outline"}
                  className="text-xs gap-1.5"
                  disabled={saving}
                  onClick={() => handleStatusChange("rejected")}
                >
                  <Ban className="h-3.5 w-3.5" />
                  Reject
                </Button>
                {saving && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
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
  onUpdateStatus,
}: {
  data: CandidateWithCredentials;
  onUpdateStatus: (candidateId: string, credential: Credential, status: VerificationStatus, notes: string) => Promise<void>;
}) => {
  const [expanded, setExpanded] = useState(false);
  const { candidate, credentials, verifications, trustScore } = data;
  const verifiedCount = credentials.filter((c) => verifications.get(credKey(c.type, c.title))?.status === "verified").length;

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
                </CardDescription>
              </div>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger>
                    <div className="text-center">
                      <div
                        className={`text-lg font-bold ${
                          trustScore >= 75
                            ? "text-emerald-600 dark:text-emerald-400"
                            : trustScore >= 50
                            ? "text-amber-600 dark:text-amber-400"
                            : "text-muted-foreground"
                        }`}
                      >
                        {trustScore}%
                      </div>
                      <p className="text-[10px] text-muted-foreground">Trust</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>
                      {verifiedCount}/{credentials.length} credentials verified
                    </p>
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
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <CardContent className="pt-0 space-y-3">
                {credentials.map((cred) => (
                  <CredentialCard
                    key={cred.id}
                    credential={cred}
                    verification={verifications.get(credKey(cred.type, cred.title))}
                    onUpdateStatus={(credential, status, notes) =>
                      onUpdateStatus(candidate.id, credential, status, notes)
                    }
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

  // Fetch stored verifications from DB
  useEffect(() => {
    if (!user) return;
    const fetchVerifications = async () => {
      setLoadingVerifications(true);
      const { data, error } = await supabase
        .from("credential_verifications")
        .select("id, credential_type, credential_title, credential_issuer, status, verification_notes, verification_link, verified_at, candidate_id")
        .eq("recruiter_id", user.id);

      if (!error && data) {
        setStoredVerifications(data as StoredVerification[]);
      }
      setLoadingVerifications(false);
    };
    fetchVerifications();
  }, [user]);

  // Build verification lookup per candidate
  const verificationsByCandidate = useMemo(() => {
    const map = new Map<string, Map<string, StoredVerification>>();
    storedVerifications.forEach((v) => {
      if (!map.has(v.candidate_id)) map.set(v.candidate_id, new Map());
      map.get(v.candidate_id)!.set(credKey(v.credential_type, v.credential_title), v);
    });
    return map;
  }, [storedVerifications]);

  // Handle status update (upsert)
  const handleUpdateStatus = useCallback(
    async (candidateId: string, credential: Credential, status: VerificationStatus, notes: string) => {
      if (!user) return;

      const existing = verificationsByCandidate.get(candidateId)?.get(credKey(credential.type, credential.title));

      if (existing) {
        const { error } = await supabase
          .from("credential_verifications")
          .update({
            status,
            verification_notes: notes || null,
            verified_at: new Date().toISOString(),
          })
          .eq("id", existing.id);

        if (error) {
          toast({ title: "Error", description: "Failed to update verification", variant: "destructive" });
          return;
        }
        setStoredVerifications((prev) =>
          prev.map((v) =>
            v.id === existing.id
              ? { ...v, status, verification_notes: notes || null, verified_at: new Date().toISOString() }
              : v
          )
        );
      } else {
        const { data, error } = await supabase
          .from("credential_verifications")
          .insert({
            recruiter_id: user.id,
            candidate_id: candidateId,
            credential_type: credential.type,
            credential_title: credential.title,
            credential_issuer: credential.issuer || null,
            status,
            verification_notes: notes || null,
            verified_at: new Date().toISOString(),
          })
          .select("id, credential_type, credential_title, credential_issuer, status, verification_notes, verification_link, verified_at, candidate_id")
          .single();

        if (error) {
          toast({ title: "Error", description: "Failed to save verification", variant: "destructive" });
          return;
        }
        if (data) setStoredVerifications((prev) => [...prev, data as StoredVerification]);
      }

      toast({ title: "Updated", description: `Credential marked as ${status}` });
    },
    [user, verificationsByCandidate, toast]
  );

  // Build enriched list
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
    const allCreds = candidatesWithCredentials.flatMap((c) =>
      c.credentials.map((cr) => {
        const v = c.verifications.get(credKey(cr.type, cr.title));
        return (v?.status as VerificationStatus) || "unverified";
      })
    );
    return {
      total: allCreds.length,
      verified: allCreds.filter((s) => s === "verified").length,
      pending: allCreds.filter((s) => s === "pending").length,
      candidates: candidatesWithCredentials.length,
    };
  }, [candidatesWithCredentials]);

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
          Review and verify candidate credentials using external links. Mark each credential as verified, pending, or rejected.
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Credentials", value: stats.total, icon: Fingerprint },
          { label: "Verified", value: stats.verified, icon: CheckCircle2 },
          { label: "Pending Review", value: stats.pending, icon: Clock },
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
          <Input
            placeholder="Search candidates by name, role, university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "verified", "pending", "unverified", "rejected"] as const).map((s) => (
            <Button
              key={s}
              variant={statusFilter === s ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(s)}
              className="capitalize"
            >
              {s === "all" ? "All" : s}
            </Button>
          ))}
        </div>
      </div>

      {/* Candidate List */}
      <div className="space-y-4">
        {filtered.length > 0 ? (
          filtered.slice(0, 20).map((data) => (
            <CandidateCredentialCard key={data.candidate.id} data={data} onUpdateStatus={handleUpdateStatus} />
          ))
        ) : (
          <Card>
            <CardContent className="p-12 text-center">
              <FileCheck className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg">No credentials found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery
                  ? "Try adjusting your search filters."
                  : "Credentials will appear here when candidates have profile data (education, experience, ORCID, etc)."}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default BlockchainCredentialsTab;
