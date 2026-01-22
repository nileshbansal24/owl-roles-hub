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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
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
  Filter,
  ChevronDown,
  RotateCcw,
  Printer,
  Beaker,
  User,
  Building,
} from "lucide-react";
import { toast } from "sonner";

// Preset filter configurations
interface FilterPreset {
  id: string;
  label: string;
  icon: React.ReactNode;
  metrics: MetricKey[];
}

// Define metric categories and their items
type MetricKey = 
  | "completeness" 
  | "experience" 
  | "hindex" 
  | "publications" 
  | "citations" 
  | "location" 
  | "university" 
  | "academicProfiles" 
  | "skills" 
  | "education" 
  | "achievements" 
  | "resume";

const filterPresets: FilterPreset[] = [
  {
    id: "research",
    label: "Research Only",
    icon: <Beaker className="h-3.5 w-3.5" />,
    metrics: ["hindex", "publications", "citations", "academicProfiles"],
  },
  {
    id: "experience",
    label: "Experience Only",
    icon: <Briefcase className="h-3.5 w-3.5" />,
    metrics: ["experience", "education", "skills", "achievements"],
  },
  {
    id: "academic",
    label: "Academic Profile",
    icon: <GraduationCap className="h-3.5 w-3.5" />,
    metrics: ["education", "university", "hindex", "publications", "citations", "academicProfiles"],
  },
  {
    id: "overview",
    label: "Quick Overview",
    icon: <User className="h-3.5 w-3.5" />,
    metrics: ["completeness", "experience", "education", "skills", "resume"],
  },
  {
    id: "institution",
    label: "Institution Focus",
    icon: <Building className="h-3.5 w-3.5" />,
    metrics: ["university", "location", "education", "experience"],
  },
];

interface MetricCategory {
  id: string;
  label: string;
  icon: React.ReactNode;
  metrics: { key: MetricKey; label: string }[];
}

const metricCategories: MetricCategory[] = [
  {
    id: "profile",
    label: "Profile Overview",
    icon: <FileText className="h-4 w-4" />,
    metrics: [
      { key: "completeness", label: "Profile Completeness" },
      { key: "resume", label: "Resume" },
    ],
  },
  {
    id: "experience",
    label: "Experience & Education",
    icon: <Briefcase className="h-4 w-4" />,
    metrics: [
      { key: "experience", label: "Years Experience" },
      { key: "education", label: "Education" },
      { key: "skills", label: "Skills" },
      { key: "achievements", label: "Achievements" },
    ],
  },
  {
    id: "research",
    label: "Research Metrics",
    icon: <TrendingUp className="h-4 w-4" />,
    metrics: [
      { key: "hindex", label: "h-index" },
      { key: "publications", label: "Publications" },
      { key: "citations", label: "Total Citations" },
      { key: "academicProfiles", label: "Academic Profiles" },
    ],
  },
  {
    id: "general",
    label: "General Info",
    icon: <MapPin className="h-4 w-4" />,
    metrics: [
      { key: "location", label: "Location" },
      { key: "university", label: "University" },
    ],
  },
];

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
  // Filter state - all metrics visible by default
  const [visibleMetrics, setVisibleMetrics] = useState<Set<MetricKey>>(
    new Set(metricCategories.flatMap((cat) => cat.metrics.map((m) => m.key)))
  );
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const toggleMetric = (key: MetricKey) => {
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  };

  const toggleCategory = (category: MetricCategory) => {
    const categoryKeys = category.metrics.map((m) => m.key);
    const allSelected = categoryKeys.every((key) => visibleMetrics.has(key));
    
    setVisibleMetrics((prev) => {
      const next = new Set(prev);
      categoryKeys.forEach((key) => {
        if (allSelected) {
          next.delete(key);
        } else {
          next.add(key);
        }
      });
      return next;
    });
  };

  const selectAll = () => {
    setVisibleMetrics(
      new Set(metricCategories.flatMap((cat) => cat.metrics.map((m) => m.key)))
    );
  };

  const clearAll = () => {
    setVisibleMetrics(new Set());
  };

  const applyPreset = (preset: FilterPreset) => {
    setVisibleMetrics(new Set(preset.metrics));
    toast.success(`Applied "${preset.label}" preset`);
  };

  const isMetricVisible = (key: MetricKey) => visibleMetrics.has(key);

  // Sanitize HTML for print
  const escapeHtml = (str: string | null | undefined): string => {
    if (!str) return "—";
    return str
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  };

  // Print/Export PDF handler
  const handlePrint = () => {
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      toast.error("Please allow popups to export PDF");
      return;
    }

    const metricLabels: Record<MetricKey, string> = {
      completeness: "Profile Completeness",
      experience: "Years Experience",
      hindex: "h-index",
      publications: "Publications",
      citations: "Total Citations",
      location: "Location",
      university: "University",
      academicProfiles: "Academic Profiles",
      skills: "Skills",
      education: "Education",
      achievements: "Achievements",
      resume: "Resume",
    };

    const getMetricValue = (app: Application, metric: MetricKey): string => {
      const profile = app.profiles;
      if (!profile) return "—";

      switch (metric) {
        case "completeness":
          return `${calculateCompleteness(profile)}%`;
        case "experience":
          return profile.years_experience ? `${profile.years_experience} yrs` : "—";
        case "hindex":
          const hIndex = getHIndex(profile);
          return hIndex !== null ? String(hIndex) : "—";
        case "publications":
          return String(getDocumentCount(profile) || "—");
        case "citations":
          return String(getTotalCitations(profile) || "—");
        case "location":
          return escapeHtml(profile.location);
        case "university":
          return escapeHtml(profile.university);
        case "academicProfiles":
          const links: string[] = [];
          if (profile.orcid_id) links.push(`ORCID: ${profile.orcid_id}`);
          if (profile.scopus_link) links.push("Scopus: Linked");
          return links.length > 0 ? links.join(", ") : "—";
        case "skills":
          return profile.skills?.slice(0, 5).join(", ") || "—";
        case "education":
          const education = Array.isArray(profile.education) ? profile.education : [];
          return education.length > 0 
            ? education.slice(0, 2).map(e => escapeHtml(e.degree)).join(", ")
            : "—";
        case "achievements":
          const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];
          return achievements.length > 0 
            ? `${achievements.length} achievements`
            : "—";
        case "resume":
          return profile.resume_url ? "Available" : "Not uploaded";
        default:
          return "—";
      }
    };

    const visibleMetricKeys = Array.from(visibleMetrics);
    const currentDate = new Date().toLocaleDateString();

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Candidate Comparison Report</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; padding: 40px; color: #1a1a1a; }
          .header { text-align: center; margin-bottom: 32px; border-bottom: 2px solid #e5e5e5; padding-bottom: 24px; }
          .header h1 { font-size: 24px; margin-bottom: 8px; color: #111; }
          .header p { color: #666; font-size: 14px; }
          .comparison-table { width: 100%; border-collapse: collapse; margin-top: 24px; }
          .comparison-table th, .comparison-table td { border: 1px solid #e5e5e5; padding: 12px; text-align: left; vertical-align: top; }
          .comparison-table th { background: #f5f5f5; font-weight: 600; font-size: 13px; }
          .comparison-table td { font-size: 13px; }
          .candidate-header { background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%); text-align: center; padding: 16px !important; }
          .candidate-name { font-weight: 600; font-size: 14px; margin-bottom: 4px; }
          .candidate-role { font-size: 12px; color: #666; }
          .metric-label { font-weight: 500; color: #444; min-width: 140px; background: #fafafa; }
          .best-value { background: #ecfdf5 !important; color: #059669; font-weight: 600; }
          .footer { margin-top: 32px; padding-top: 16px; border-top: 1px solid #e5e5e5; font-size: 11px; color: #888; text-align: center; }
          @media print {
            body { padding: 20px; }
            .comparison-table { page-break-inside: auto; }
            .comparison-table tr { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Candidate Comparison Report</h1>
          <p>Generated on ${currentDate} • ${applications.length} candidates • ${visibleMetricKeys.length} metrics</p>
        </div>
        <table class="comparison-table">
          <thead>
            <tr>
              <th class="metric-label">Metric</th>
              ${applications.map(app => `
                <th class="candidate-header">
                  <div class="candidate-name">${escapeHtml(app.profiles?.full_name) || "Anonymous"}</div>
                  <div class="candidate-role">${escapeHtml(app.profiles?.role || app.profiles?.headline) || "Candidate"}</div>
                </th>
              `).join("")}
            </tr>
          </thead>
          <tbody>
            ${visibleMetricKeys.map(metric => {
              const values = applications.map(app => getMetricValue(app, metric));
              const numericValues = values.map(v => parseFloat(v.replace(/[^0-9.]/g, "")) || 0);
              const maxValue = Math.max(...numericValues);
              
              return `
                <tr>
                  <td class="metric-label">${metricLabels[metric]}</td>
                  ${applications.map((app, idx) => {
                    const value = values[idx];
                    const numValue = numericValues[idx];
                    const isBest = numValue > 0 && numValue === maxValue && numericValues.filter(v => v === maxValue).length === 1;
                    return `<td class="${isBest ? "best-value" : ""}">${value}</td>`;
                  }).join("")}
                </tr>
              `;
            }).join("")}
          </tbody>
        </table>
        <div class="footer">
          This report was generated from the Candidate Comparison Tool. Best values are highlighted in green.
        </div>
      </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);

    toast.success("PDF export ready - use your browser's print dialog to save");
  };

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
          <div className="flex items-center justify-between">
            <DialogTitle className="font-heading text-xl">
              Compare Candidates ({applications.length})
            </DialogTitle>
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="text-xs">
                {visibleMetrics.size} metrics shown
              </Badge>
              <Button variant="outline" size="sm" onClick={handlePrint} className="gap-2">
                <Printer className="h-4 w-4" />
                Export PDF
              </Button>
            </div>
          </div>
        </DialogHeader>

        {/* Filter Panel */}
        <div className="px-6 pb-2 space-y-3">
          {/* Preset Filter Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground font-medium">Quick filters:</span>
            {filterPresets.map((preset) => {
              const isActive = preset.metrics.every((m) => visibleMetrics.has(m)) && 
                               visibleMetrics.size === preset.metrics.length;
              return (
                <Button
                  key={preset.id}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => applyPreset(preset)}
                  className="gap-1.5 text-xs h-7"
                >
                  {preset.icon}
                  {preset.label}
                </Button>
              );
            })}
          </div>

          <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen}>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground">
                <Filter className="h-4 w-4" />
                Custom Filter
                <ChevronDown className={`h-4 w-4 transition-transform ${isFilterOpen ? "rotate-180" : ""}`} />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="mt-3">
              <div className="p-4 rounded-lg border bg-muted/30 space-y-4">
                {/* Quick actions */}
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                    <CheckCircle2 className="h-3 w-3 mr-1" />
                    Select All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={clearAll} className="text-xs">
                    <XCircle className="h-3 w-3 mr-1" />
                    Clear All
                  </Button>
                  <Button variant="ghost" size="sm" onClick={selectAll} className="text-xs">
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Reset
                  </Button>
                </div>
                
                {/* Category filters */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {metricCategories.map((category) => {
                    const categoryKeys = category.metrics.map((m) => m.key);
                    const selectedCount = categoryKeys.filter((key) => visibleMetrics.has(key)).length;
                    const allSelected = selectedCount === categoryKeys.length;
                    const someSelected = selectedCount > 0 && !allSelected;
                    
                    return (
                      <div key={category.id} className="space-y-2">
                        <div 
                          className="flex items-center gap-2 cursor-pointer hover:text-primary transition-colors"
                          onClick={() => toggleCategory(category)}
                        >
                          <Checkbox 
                            checked={allSelected}
                            className={someSelected ? "data-[state=checked]:bg-primary/50" : ""}
                          />
                          <span className="flex items-center gap-1.5 text-sm font-medium">
                            {category.icon}
                            {category.label}
                          </span>
                          <Badge variant="outline" className="text-xs ml-auto">
                            {selectedCount}/{categoryKeys.length}
                          </Badge>
                        </div>
                        <div className="pl-6 space-y-1.5">
                          {category.metrics.map((metric) => (
                            <label 
                              key={metric.key}
                              className="flex items-center gap-2 cursor-pointer text-sm text-muted-foreground hover:text-foreground transition-colors"
                            >
                              <Checkbox 
                                checked={visibleMetrics.has(metric.key)}
                                onCheckedChange={() => toggleMetric(metric.key)}
                              />
                              {metric.label}
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>
        </div>

        <ScrollArea className="h-[calc(95vh-180px)]">
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
                {isMetricVisible("completeness") && (
                  <>
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
                  </>
                )}

                {/* Experience Row */}
                {isMetricVisible("experience") && (
                  <>
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
                  </>
                )}

                {/* H-Index Row */}
                {isMetricVisible("hindex") && (
                  <>
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
                  </>
                )}

                {/* Document Count Row */}
                {isMetricVisible("publications") && (
                  <>
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
                  </>
                )}

                {/* Citations Row */}
                {isMetricVisible("citations") && (
                  <>
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
                  </>
                )}

                {/* Location Row */}
                {isMetricVisible("location") && (
                  <>
                    <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4 mr-2 text-primary" />
                      Location
                    </div>
                    {applications.map((app) => (
                      <div key={`loc-${app.id}`} className="p-3 rounded-lg border bg-muted/30">
                        <span className="text-sm">{app.profiles?.location || "—"}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* University Row */}
                {isMetricVisible("university") && (
                  <>
                    <div className="sticky left-0 bg-background z-10 flex items-center font-medium text-sm text-muted-foreground">
                      <GraduationCap className="h-4 w-4 mr-2 text-primary" />
                      University
                    </div>
                    {applications.map((app) => (
                      <div key={`uni-${app.id}`} className="p-3 rounded-lg border bg-muted/30">
                        <span className="text-sm truncate block">{app.profiles?.university || "—"}</span>
                      </div>
                    ))}
                  </>
                )}

                {/* Academic Identity Row */}
                {isMetricVisible("academicProfiles") && (
                  <>
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
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs hover:bg-emerald-500/20"
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
                              className="inline-flex items-center gap-1 px-2 py-1 rounded bg-orange-500/10 text-orange-600 dark:text-orange-400 text-xs hover:bg-orange-500/20"
                            >
                              Scopus
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : null}
                        </div>
                      </div>
                    ))}
                  </>
                )}

                {/* Skills Row */}
                {isMetricVisible("skills") && (
                  <>
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
                  </>
                )}

                {/* Education Row */}
                {isMetricVisible("education") && (
                  <>
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
                  </>
                )}

                {/* Achievements Row */}
                {isMetricVisible("achievements") && (
                  <>
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
                  </>
                )}

                {/* Resume Row */}
                {isMetricVisible("resume") && (
                  <>
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
                  </>
                )}

                {/* Empty state when no metrics selected */}
                {visibleMetrics.size === 0 && (
                  <>
                    <div className="sticky left-0 bg-background z-10" />
                    {applications.map((app) => (
                      <div key={`empty-${app.id}`} className="p-6 rounded-lg border bg-muted/30 text-center">
                        <p className="text-sm text-muted-foreground">
                          No metrics selected. Use the filter above to choose which metrics to compare.
                        </p>
                      </div>
                    ))}
                  </>
                )}
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
