import { useState } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  GraduationCap,
  Briefcase,
  BookOpen,
  Trophy,
  Star,
  TrendingUp,
  FileText,
  ExternalLink,
  X,
  Award,
  Quote,
  CheckCircle2,
  XCircle,
} from "lucide-react";

interface ScopusMetrics {
  h_index: number | null;
  document_count: number | null;
  citation_count: number | null;
  co_authors?: Array<{
    name: string;
    author_id?: string;
    affiliation?: string;
  }>;
}

interface ExperienceItem {
  year: string;
  role: string;
  institution: string;
  description: string;
  isCurrent: boolean;
}

interface EducationItem {
  degree: string;
  institution: string;
  years: string;
}

interface ResearchPaper {
  title: string;
  authors: string;
  date: string;
  doi?: string;
  journal?: string;
  citations?: number;
}

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  role: string | null;
  bio: string | null;
  years_experience: number | null;
  location: string | null;
  headline: string | null;
  skills: string[] | null;
  user_type: string | null;
  resume_url?: string | null;
  email?: string | null;
  experience?: ExperienceItem[] | null;
  education?: EducationItem[] | null;
  research_papers?: ResearchPaper[] | null;
  achievements?: string[] | null;
  subjects?: string[] | null;
  professional_summary?: string | null;
  orcid_id?: string | null;
  scopus_link?: string | null;
  scopus_metrics?: ScopusMetrics | null;
  manual_h_index?: number | null;
}

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  status: string;
  created_at: string;
  jobs: {
    title: string;
    institute: string;
  };
  profiles: Profile | null;
}

interface CandidateComparisonModalProps {
  applications: Application[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRemoveCandidate: (appId: string) => void;
}

const CandidateComparisonModal = ({
  applications,
  open,
  onOpenChange,
  onRemoveCandidate,
}: CandidateComparisonModalProps) => {
  // Calculate profile completeness
  const calculateCompleteness = (profile: Profile | null): number => {
    if (!profile) return 0;
    const experience = Array.isArray(profile.experience) ? profile.experience : [];
    const education = Array.isArray(profile.education) ? profile.education : [];
    const researchPapers = Array.isArray(profile.research_papers) ? profile.research_papers : [];
    const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];
    
    const fields = [
      !!profile.full_name,
      !!profile.avatar_url,
      !!(profile.role || profile.headline),
      !!profile.university,
      !!profile.location,
      !!(profile.bio || profile.professional_summary),
      experience.length > 0,
      education.length > 0,
      (profile.skills?.length || 0) > 0,
      !!profile.resume_url,
      researchPapers.length > 0,
      achievements.length > 0,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  // Get h-index from either Scopus or manual entry
  const getHIndex = (profile: Profile | null): number | null => {
    if (!profile) return null;
    return profile.scopus_metrics?.h_index ?? profile.manual_h_index ?? null;
  };

  // Get total citations
  const getTotalCitations = (profile: Profile | null): number => {
    if (!profile) return 0;
    if (profile.scopus_metrics?.citation_count) return profile.scopus_metrics.citation_count;
    // Fallback: sum paper citations
    const papers = Array.isArray(profile.research_papers) ? profile.research_papers : [];
    return papers.reduce((sum, p) => sum + (p.citations || 0), 0);
  };

  // Get document count
  const getDocumentCount = (profile: Profile | null): number => {
    if (!profile) return 0;
    if (profile.scopus_metrics?.document_count) return profile.scopus_metrics.document_count;
    const papers = Array.isArray(profile.research_papers) ? profile.research_papers : [];
    return papers.length;
  };

  // Find the best value for highlighting
  const findBestValue = (
    apps: Application[],
    getValue: (p: Profile | null) => number | null
  ): number | null => {
    const values = apps.map((a) => getValue(a.profiles)).filter((v) => v !== null) as number[];
    if (values.length === 0) return null;
    return Math.max(...values);
  };

  const bestHIndex = findBestValue(applications, getHIndex);
  const bestCitations = findBestValue(applications, getTotalCitations);
  const bestDocuments = findBestValue(applications, getDocumentCount);
  const bestExperience = findBestValue(applications, (p) => p?.years_experience ?? null);
  const bestCompleteness = findBestValue(applications, calculateCompleteness);

  if (applications.length === 0) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] max-h-[95vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="font-heading text-xl">
            Compare Candidates ({applications.length})
          </DialogTitle>
        </DialogHeader>

        <ScrollArea className="h-[calc(95vh-100px)]">
          <div className="px-6 pb-6">
            {/* Comparison Grid */}
            <div className="overflow-x-auto">
              <div
                className="grid gap-4"
                style={{
                  gridTemplateColumns: `200px repeat(${applications.length}, minmax(280px, 1fr))`,
                }}
              >
                {/* Header Row - Candidate Cards */}
                <div className="sticky left-0 bg-background z-10" />
                {applications.map((app) => (
                  <motion.div
                    key={app.id}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="relative"
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute -top-1 -right-1 h-6 w-6 p-0 rounded-full bg-destructive/10 hover:bg-destructive/20 z-10"
                      onClick={() => onRemoveCandidate(app.id)}
                    >
                      <X className="h-3 w-3 text-destructive" />
                    </Button>
                    <div className="p-4 rounded-xl bg-gradient-to-br from-primary/5 to-primary/10 border border-primary/20 text-center">
                      <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-background shadow-lg">
                        <AvatarImage src={app.profiles?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary text-primary-foreground font-bold">
                          {app.profiles?.full_name?.slice(0, 2).toUpperCase() || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <h3 className="font-heading font-semibold text-foreground truncate">
                        {app.profiles?.full_name || "Anonymous"}
                      </h3>
                      <p className="text-xs text-primary truncate">
                        {app.profiles?.role || app.profiles?.headline || "Candidate"}
                      </p>
                      <Badge variant="outline" className="mt-2 text-xs">
                        {app.status}
                      </Badge>
                    </div>
                  </motion.div>
                ))}

                {/* Profile Completeness Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  Profile Completeness
                </div>
                {applications.map((app) => {
                  const completeness = calculateCompleteness(app.profiles);
                  const isBest = completeness === bestCompleteness && bestCompleteness !== null;
                  return (
                    <div
                      key={`completeness-${app.id}`}
                      className={`p-3 rounded-lg border ${isBest ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/30"}`}
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-lg font-bold ${isBest ? "text-green-600" : ""}`}>
                          {completeness}%
                        </span>
                        {isBest && <Award className="h-4 w-4 text-green-600" />}
                      </div>
                      <Progress value={completeness} className="h-2" />
                    </div>
                  );
                })}

                {/* Experience Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <Briefcase className="h-4 w-4 mr-2 text-primary" />
                  Years Experience
                </div>
                {applications.map((app) => {
                  const exp = app.profiles?.years_experience;
                  const isBest = exp === bestExperience && bestExperience !== null;
                  return (
                    <div
                      key={`exp-${app.id}`}
                      className={`p-3 rounded-lg border ${isBest ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/30"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${isBest ? "text-green-600" : ""}`}>
                          {exp ?? "—"} {exp !== null && exp !== undefined ? "yrs" : ""}
                        </span>
                        {isBest && <Award className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                  );
                })}

                {/* H-Index Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <TrendingUp className="h-4 w-4 mr-2 text-primary" />
                  h-index
                </div>
                {applications.map((app) => {
                  const hIndex = getHIndex(app.profiles);
                  const isBest = hIndex === bestHIndex && bestHIndex !== null;
                  return (
                    <div
                      key={`hindex-${app.id}`}
                      className={`p-3 rounded-lg border ${isBest ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/30"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${isBest ? "text-green-600" : ""}`}>
                          {hIndex ?? "—"}
                        </span>
                        {isBest && <Award className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                  );
                })}

                {/* Document Count Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <BookOpen className="h-4 w-4 mr-2 text-primary" />
                  Publications
                </div>
                {applications.map((app) => {
                  const docs = getDocumentCount(app.profiles);
                  const isBest = docs === bestDocuments && bestDocuments !== null && docs > 0;
                  return (
                    <div
                      key={`docs-${app.id}`}
                      className={`p-3 rounded-lg border ${isBest ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/30"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${isBest ? "text-green-600" : ""}`}>
                          {docs || "—"}
                        </span>
                        {isBest && <Award className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                  );
                })}

                {/* Citations Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <Quote className="h-4 w-4 mr-2 text-primary" />
                  Total Citations
                </div>
                {applications.map((app) => {
                  const citations = getTotalCitations(app.profiles);
                  const isBest = citations === bestCitations && bestCitations !== null && citations > 0;
                  return (
                    <div
                      key={`citations-${app.id}`}
                      className={`p-3 rounded-lg border ${isBest ? "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-800" : "bg-muted/30"}`}
                    >
                      <div className="flex items-center justify-between">
                        <span className={`text-lg font-bold ${isBest ? "text-green-600" : ""}`}>
                          {citations || "—"}
                        </span>
                        {isBest && <Award className="h-4 w-4 text-green-600" />}
                      </div>
                    </div>
                  );
                })}

                {/* Location Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <MapPin className="h-4 w-4 mr-2 text-primary" />
                  Location
                </div>
                {applications.map((app) => (
                  <div key={`loc-${app.id}`} className="p-3 rounded-lg border bg-muted/30">
                    <span className="text-sm">{app.profiles?.location || "—"}</span>
                  </div>
                ))}

                {/* University Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                  University
                </div>
                {applications.map((app) => (
                  <div key={`uni-${app.id}`} className="p-3 rounded-lg border bg-muted/30">
                    <span className="text-sm truncate block">{app.profiles?.university || "—"}</span>
                  </div>
                ))}

                {/* Academic Identity Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <ExternalLink className="h-4 w-4 mr-2 text-primary" />
                  Academic Profiles
                </div>
                {applications.map((app) => (
                  <div key={`identity-${app.id}`} className="p-3 rounded-lg border bg-muted/30">
                    <div className="flex flex-wrap gap-1.5">
                      {app.profiles?.orcid_id ? (
                        <a
                          href={`https://orcid.org/${app.profiles.orcid_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#A6CE39]/10 text-[#A6CE39] text-xs hover:bg-[#A6CE39]/20"
                        >
                          ORCID
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <XCircle className="h-4 w-4 text-muted-foreground/50" />
                      )}
                      {app.profiles?.scopus_link ? (
                        <a
                          href={app.profiles.scopus_link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 px-2 py-1 rounded bg-[#E9711C]/10 text-[#E9711C] text-xs hover:bg-[#E9711C]/20"
                        >
                          Scopus
                          <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : null}
                    </div>
                  </div>
                ))}

                {/* Skills Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <Star className="h-4 w-4 mr-2 text-primary" />
                  Skills
                </div>
                {applications.map((app) => (
                  <div key={`skills-${app.id}`} className="p-3 rounded-lg border bg-muted/30">
                    {app.profiles?.skills && app.profiles.skills.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {app.profiles.skills.slice(0, 5).map((skill, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {skill}
                          </Badge>
                        ))}
                        {app.profiles.skills.length > 5 && (
                          <Badge variant="outline" className="text-xs">
                            +{app.profiles.skills.length - 5}
                          </Badge>
                        )}
                      </div>
                    ) : (
                      <span className="text-muted-foreground text-sm">—</span>
                    )}
                  </div>
                ))}

                {/* Education Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                  Education
                </div>
                {applications.map((app) => {
                  const education = Array.isArray(app.profiles?.education) ? app.profiles.education : [];
                  return (
                    <div key={`edu-${app.id}`} className="p-3 rounded-lg border bg-muted/30">
                      {education.length > 0 ? (
                        <div className="space-y-1.5">
                          {education.slice(0, 2).map((edu, idx) => (
                            <div key={idx} className="text-xs">
                              <p className="font-medium truncate">{edu.degree}</p>
                              <p className="text-muted-foreground truncate">{edu.institution}</p>
                            </div>
                          ))}
                          {education.length > 2 && (
                            <p className="text-xs text-muted-foreground">+{education.length - 2} more</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>
                  );
                })}

                {/* Achievements Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <Trophy className="h-4 w-4 mr-2 text-primary" />
                  Achievements
                </div>
                {applications.map((app) => {
                  const achievements = Array.isArray(app.profiles?.achievements) ? app.profiles.achievements : [];
                  return (
                    <div key={`ach-${app.id}`} className="p-3 rounded-lg border bg-muted/30">
                      {achievements.length > 0 ? (
                        <div className="space-y-1">
                          {achievements.slice(0, 2).map((ach, idx) => (
                            <div key={idx} className="flex items-start gap-1.5 text-xs">
                              <Award className="h-3 w-3 text-amber-500 flex-shrink-0 mt-0.5" />
                              <span className="line-clamp-1">{ach}</span>
                            </div>
                          ))}
                          {achievements.length > 2 && (
                            <p className="text-xs text-muted-foreground">+{achievements.length - 2} more</p>
                          )}
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-sm">—</span>
                      )}
                    </div>
                  );
                })}

                {/* Resume Row */}
                <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                  <FileText className="h-4 w-4 mr-2 text-primary" />
                  Resume
                </div>
                {applications.map((app) => (
                  <div key={`resume-${app.id}`} className="p-3 rounded-lg border bg-muted/30">
                    {app.profiles?.resume_url ? (
                      <div className="flex items-center gap-1.5 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        <span className="text-sm">Available</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <XCircle className="h-4 w-4" />
                        <span className="text-sm">Not uploaded</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default CandidateComparisonModal;
