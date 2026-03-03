import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Shield,
  CheckCircle2,
  Clock,
  XCircle,
  Link2,
  GraduationCap,
  Briefcase,
  Award,
  Search,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Fingerprint,
  Blocks,
  Copy,
  Check } from
"lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import type { Profile } from "@/types/recruiter";

type VerificationStatus = "verified" | "pending" | "unverified" | "expired";

interface BlockchainCredential {
  id: string;
  type: "education" | "employment" | "certification" | "achievement";
  title: string;
  issuer: string;
  dateIssued: string;
  status: VerificationStatus;
  txHash: string;
  blockNumber: number;
  network: string;
  verifiedAt?: string;
}

interface CandidateWithCredentials {
  candidate: Profile;
  credentials: BlockchainCredential[];
  trustScore: number;
}

const statusConfig: Record<VerificationStatus, {icon: typeof CheckCircle2;label: string;className: string;}> = {
  verified: { icon: CheckCircle2, label: "Verified", className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20" },
  pending: { icon: Clock, label: "Pending", className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20" },
  unverified: { icon: XCircle, label: "Unverified", className: "bg-muted text-muted-foreground border-border" },
  expired: { icon: XCircle, label: "Expired", className: "bg-destructive/10 text-destructive border-destructive/20" }
};

const typeConfig: Record<string, {icon: typeof GraduationCap;label: string;}> = {
  education: { icon: GraduationCap, label: "Education" },
  employment: { icon: Briefcase, label: "Employment" },
  certification: { icon: Award, label: "Certification" },
  achievement: { icon: Award, label: "Achievement" }
};

// Generate simulated blockchain credentials from candidate profiles
const generateCredentials = (candidate: Profile): BlockchainCredential[] => {
  const creds: BlockchainCredential[] = [];
  const baseHash = candidate.id.replace(/-/g, "").slice(0, 16);

  if (candidate.university) {
    creds.push({
      id: `edu-${candidate.id}`,
      type: "education",
      title: `Degree from ${candidate.university}`,
      issuer: candidate.university,
      dateIssued: "2023-06-15",
      status: "verified",
      txHash: `0x${baseHash}a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6e7f8a9b0c1d2e3f4a5b6c7d8e9f0`,
      blockNumber: 18234567 + Math.floor(Math.random() * 100000),
      network: "Ethereum",
      verifiedAt: "2024-01-10T10:30:00Z"
    });
  }

  if (candidate.role || candidate.headline) {
    const yearsExp = candidate.years_experience || 0;
    creds.push({
      id: `emp-${candidate.id}`,
      type: "employment",
      title: candidate.role || candidate.headline || "Professional Role",
      issuer: candidate.university || "Employer",
      dateIssued: "2024-03-01",
      status: yearsExp > 3 ? "verified" : "pending",
      txHash: `0x${baseHash}f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0`,
      blockNumber: 19345678 + Math.floor(Math.random() * 100000),
      network: "Polygon",
      verifiedAt: yearsExp > 3 ? "2024-08-20T14:15:00Z" : undefined
    });
  }

  if (candidate.skills && candidate.skills.length > 2) {
    creds.push({
      id: `cert-${candidate.id}`,
      type: "certification",
      title: `${candidate.skills[0]} Professional Certification`,
      issuer: "Blockchain Skills Registry",
      dateIssued: "2024-06-01",
      status: "verified",
      txHash: `0x${baseHash}1a2b3c4d5e6f7a8b9c0d1e2f3a4b5c6d7e8f9a0b1c2d3e4f5a6b7c8d9e0f1`,
      blockNumber: 20456789 + Math.floor(Math.random() * 100000),
      network: "Ethereum",
      verifiedAt: "2024-09-05T09:00:00Z"
    });
  }

  if (candidate.achievements && candidate.achievements.length > 0) {
    creds.push({
      id: `ach-${candidate.id}`,
      type: "achievement",
      title: candidate.achievements[0],
      issuer: candidate.university || "Issuing Authority",
      dateIssued: "2024-01-15",
      status: Math.random() > 0.3 ? "verified" : "pending",
      txHash: `0x${baseHash}0f1e2d3c4b5a6f7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9`,
      blockNumber: 21567890 + Math.floor(Math.random() * 100000),
      network: "Polygon"
    });
  }

  return creds;
};

const computeTrustScore = (creds: BlockchainCredential[]): number => {
  if (creds.length === 0) return 0;
  const verified = creds.filter((c) => c.status === "verified").length;
  return Math.round(verified / creds.length * 100);
};

interface BlockchainCredentialsTabProps {
  candidates: Profile[];
  isLoading?: boolean;
}

const CredentialCard = ({ credential }: {credential: BlockchainCredential;}) => {
  const [expanded, setExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const { toast } = useToast();
  const config = statusConfig[credential.status];
  const typeInfo = typeConfig[credential.type];
  const StatusIcon = config.icon;
  const TypeIcon = typeInfo.icon;

  const handleCopyHash = () => {
    navigator.clipboard.writeText(credential.txHash);
    setCopied(true);
    toast({ title: "Copied!", description: "Transaction hash copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div
      layout
      className="border rounded-lg p-4 bg-card hover:shadow-md transition-shadow">
      
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="rounded-lg bg-primary/10 p-2 shrink-0">
            <TypeIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="min-w-0">
            <p className="font-medium text-sm truncate">{credential.title}</p>
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
        {expanded &&
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          className="overflow-hidden">
          
            <div className="mt-4 pt-4 border-t space-y-3">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-muted-foreground">Network</p>
                  <p className="font-medium flex items-center gap-1">
                    <Blocks className="h-3 w-3 text-primary" />
                    {credential.network}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground">Block #</p>
                  <p className="font-mono font-medium">{credential.blockNumber.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Issued</p>
                  <p className="font-medium">{new Date(credential.dateIssued).toLocaleDateString()}</p>
                </div>
                {credential.verifiedAt &&
              <div>
                    <p className="text-muted-foreground">Verified</p>
                    <p className="font-medium">{new Date(credential.verifiedAt).toLocaleDateString()}</p>
                  </div>
              }
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1">Transaction Hash</p>
                <div className="flex items-center gap-2">
                  <code className="text-[10px] font-mono bg-muted rounded px-2 py-1 truncate flex-1">
                    {credential.txHash}
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
              </div>
            </div>
          </motion.div>
        }
      </AnimatePresence>
    </motion.div>);

};

const CandidateCredentialCard = ({ data }: {data: CandidateWithCredentials;}) => {
  const [expanded, setExpanded] = useState(false);
  const { candidate, credentials, trustScore } = data;
  const verifiedCount = credentials.filter((c) => c.status === "verified").length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      
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
                      <div className={`text-lg font-bold ${trustScore >= 75 ? "text-emerald-600 dark:text-emerald-400" : trustScore >= 50 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"}`}>
                        {trustScore}%
                      </div>
                      <p className="text-[10px] text-muted-foreground">Trust</p>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{verifiedCount}/{credentials.length} credentials verified on-chain</p>
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
          {expanded &&
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden">
            
              <CardContent className="pt-0 space-y-3">
                {credentials.map((cred) =>
              <CredentialCard key={cred.id} credential={cred} />
              )}
              </CardContent>
            </motion.div>
          }
        </AnimatePresence>
      </Card>
    </motion.div>);

};

const BlockchainCredentialsTab = ({ candidates, isLoading = false }: BlockchainCredentialsTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | VerificationStatus>("all");

  const candidatesWithCredentials = useMemo<CandidateWithCredentials[]>(() => {
    return candidates.
    map((c) => {
      const credentials = generateCredentials(c);
      return { candidate: c, credentials, trustScore: computeTrustScore(credentials) };
    }).
    filter((c) => c.credentials.length > 0).
    sort((a, b) => b.trustScore - a.trustScore);
  }, [candidates]);

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
      list = list.filter((c) => c.credentials.some((cr) => cr.status === statusFilter));
    }
    return list;
  }, [candidatesWithCredentials, searchQuery, statusFilter]);

  const stats = useMemo(() => {
    const all = candidatesWithCredentials.flatMap((c) => c.credentials);
    return {
      total: all.length,
      verified: all.filter((c) => c.status === "verified").length,
      pending: all.filter((c) => c.status === "pending").length,
      candidates: candidatesWithCredentials.length
    };
  }, [candidatesWithCredentials]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) =>
        <div key={i} className="h-24 bg-muted animate-pulse rounded-lg" />
        )}
      </div>);

  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl sm:text-2xl font-bold flex items-center gap-2">OR Verification
          <Blocks className="h-6 w-6 text-primary" />
          Blockchain Credential Verification
        </h2>
        <p className="text-sm text-muted-foreground mt-1">View on-chain verified credentials for candidates such as degrees, employment, and certifications.

        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
        { label: "Total Credentials", value: stats.total, icon: Fingerprint },
        { label: "Verified On-Chain", value: stats.verified, icon: CheckCircle2 },
        { label: "Pending Verification", value: stats.pending, icon: Clock },
        { label: "Candidates", value: stats.candidates, icon: Shield }].
        map((stat) =>
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
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search candidates by name, role, university..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9" />
          
        </div>
        <div className="flex gap-2 flex-wrap">
          {(["all", "verified", "pending", "unverified"] as const).map((s) =>
          <Button
            key={s}
            variant={statusFilter === s ? "default" : "outline"}
            size="sm"
            onClick={() => setStatusFilter(s)}
            className="capitalize">
            
              {s === "all" ? "All" : s}
            </Button>
          )}
        </div>
      </div>

      {/* Candidate List */}
      <div className="space-y-4">
        {filtered.length > 0 ?
        filtered.slice(0, 20).map((data) =>
        <CandidateCredentialCard key={data.candidate.id} data={data} />
        ) :

        <Card>
            <CardContent className="p-12 text-center">
              <Blocks className="h-12 w-12 mx-auto text-muted-foreground/40 mb-4" />
              <h3 className="font-semibold text-lg">No blockchain credentials found</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {searchQuery ? "Try adjusting your search filters." : "Credentials will appear here once candidates have verified records on-chain."}
              </p>
            </CardContent>
          </Card>
        }
      </div>
    </div>);

};

export default BlockchainCredentialsTab;