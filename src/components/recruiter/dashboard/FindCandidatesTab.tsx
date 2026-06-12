import { useState, useCallback, useMemo } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Users, X, UserSearch, Sparkles, ChevronLeft, ChevronRight, ArrowUpDown, Clock, User, Briefcase, MapPin } from "lucide-react";
import { getCandidateCategory, calculateCompleteness } from "@/types/recruiter";
import { useToast } from "@/hooks/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import CandidateCard from "./CandidateCard";
import SmartCandidateSearch from "./SmartCandidateSearch";
import { Checkbox } from "@/components/ui/checkbox";
import CandidateFiltersPanel, { type CandidateFilters, defaultFilters } from "./CandidateFiltersPanel";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import TabHeader from "./TabHeader";
import { CardListSkeleton } from "@/components/ui/loading-skeleton";
import { staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import type { Profile } from "@/types/recruiter";

interface FindCandidatesTabProps {
  candidates: Profile[];
  savedCandidateIds: Set<string>;
  savedCandidateNotes: Record<string, string>;
  savedCandidateStatuses?: Record<string, string>;
  onViewCandidate: (candidate: Profile) => void;
  onSaveCandidate: (candidateId: string) => void;
  onMessageCandidate: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
  onSetStatus?: (candidateId: string, status: string) => void | Promise<void>;
  isLoading?: boolean;
  recruiterLocation?: string | null;
}

const CANDIDATES_PER_PAGE = 5;

type SortOption = "recent" | "experience-desc" | "experience-asc" | "name-asc" | "name-desc";

const sortOptions: { value: SortOption; label: string; icon: React.ReactNode }[] = [
  { value: "recent", label: "Most Recent", icon: <Clock className="h-4 w-4" /> },
  { value: "experience-desc", label: "Experience (High to Low)", icon: <Briefcase className="h-4 w-4" /> },
  { value: "experience-asc", label: "Experience (Low to High)", icon: <Briefcase className="h-4 w-4" /> },
  { value: "name-asc", label: "Name (A-Z)", icon: <User className="h-4 w-4" /> },
  { value: "name-desc", label: "Name (Z-A)", icon: <User className="h-4 w-4" /> },
];

const FindCandidatesTab = ({
  candidates,
  savedCandidateIds,
  savedCandidateNotes,
  savedCandidateStatuses,
  onViewCandidate,
  onSaveCandidate,
  onMessageCandidate,
  onSaveNote,
  onSetStatus,
  isLoading = false,
  recruiterLocation,
}: FindCandidatesTabProps) => {
  const { toast } = useToast();
  const [searchResults, setSearchResults] = useState<Profile[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [showNearMe, setShowNearMe] = useState(false);
  const [advancedFilters, setAdvancedFilters] = useState<CandidateFilters>(defaultFilters);

  const handleSearchResults = useCallback((results: Profile[]) => {
    setSearchResults(results);
    setHasSearched(true);
    setCurrentPage(1);
  }, []);

  const handleSearching = useCallback((searching: boolean) => {
    setIsSearching(searching);
  }, []);

  const clearSearch = useCallback(() => {
    setSearchResults(null);
    setHasSearched(false);
    setCurrentPage(1);
  }, []);

  const handleSortChange = useCallback((value: SortOption) => {
    setSortBy(value);
    setCurrentPage(1);
  }, []);

  // Helper: extract location tokens for proximity matching
  const getLocationTokens = useCallback((location: string | null): string[] => {
    if (!location) return [];
    return location
      .toLowerCase()
      .split(/[,\-\/\|]+/)
      .map(t => t.trim())
      .filter(t => t.length > 1);
  }, []);

  const recruiterTokens = useMemo(() => getLocationTokens(recruiterLocation ?? null), [recruiterLocation, getLocationTokens]);

  // Detect whether any advanced filter has been changed from defaults
  const hasActiveFilters = useMemo(
    () => JSON.stringify(advancedFilters) !== JSON.stringify(defaultFilters),
    [advancedFilters]
  );

  // Only reveal the candidate pool once the recruiter has searched or filtered
  const showResults = hasSearched || hasActiveFilters || showNearMe;

  // Show search results if available, otherwise show all candidates
  const baseCandidates = searchResults !== null ? searchResults : candidates;

  // Apply "near me" filter
  const nearMeFiltered = useMemo(() => {
    if (!showNearMe || recruiterTokens.length === 0) return baseCandidates;
    return baseCandidates.filter(c => {
      const candidateTokens = getLocationTokens(c.location);
      return candidateTokens.some(ct => recruiterTokens.some(rt => ct.includes(rt) || rt.includes(ct)));
    });
  }, [baseCandidates, showNearMe, recruiterTokens, getLocationTokens]);

  // Apply advanced filters
  const filteredCandidates = useMemo(() => {
    let result = nearMeFiltered;

    // Experience range filter
    const [minExp, maxExp] = advancedFilters.experienceRange;
    if (minExp !== 0 || maxExp !== 30) {
      result = result.filter(c => {
        const exp = c.years_experience || 0;
        return exp >= minExp && (maxExp === 30 ? true : exp <= maxExp);
      });
    }

    // Skills filter
    if (advancedFilters.selectedSkills.length > 0) {
      result = result.filter(c => {
        const candidateSkills = (c.skills || []).map(s => s.trim().toLowerCase());
        return advancedFilters.selectedSkills.some(skill => candidateSkills.includes(skill));
      });
    }

    // Salary range filter
    const [minSal, maxSal] = advancedFilters.salaryRange;
    if (minSal !== 0 || maxSal !== 50) {
      result = result.filter(c => {
        const salary = (c as any).expected_salary || (c as any).current_salary || 0;
        const salaryLPA = salary >= 10000 ? Math.round(salary / 100000) : salary;
        return salaryLPA >= minSal && (maxSal === 50 ? true : salaryLPA <= maxSal);
      });
    }

    // Education level filter
    if (advancedFilters.educationLevel !== "all") {
      result = result.filter(c => {
        const bio = (c.bio || "").toLowerCase();
        const headline = (c.headline || "").toLowerCase();
        const role = (c.role || "").toLowerCase();
        const summary = (c.professional_summary || "").toLowerCase();
        const text = `${bio} ${headline} ${role} ${summary}`;
        
        switch (advancedFilters.educationLevel) {
          case "phd":
            return /\b(ph\.?d|doctorate|doctoral)\b/.test(text);
          case "postdoc":
            return /\b(post.?doc|postdoctoral)\b/.test(text);
          case "masters":
            return /\b(master'?s?|m\.?s\.?|m\.?a\.?|m\.?tech|m\.?sc|mba)\b/.test(text);
          case "bachelors":
            return /\b(bachelor'?s?|b\.?s\.?|b\.?a\.?|b\.?tech|b\.?sc|b\.?e\.?)\b/.test(text);
          case "diploma":
            return /\b(diploma|certificate|certification)\b/.test(text);
          default:
            return true;
        }
      });
    }

    // Designation filter
    if (advancedFilters.selectedDesignations.length > 0) {
      result = result.filter(c => {
        const text = `${c.role || ""} ${c.headline || ""}`.toLowerCase();
        return advancedFilters.selectedDesignations.some(d => text.includes(d.toLowerCase()));
      });
    }

    // Department / Subject filter
    if (advancedFilters.selectedDepartments.length > 0) {
      result = result.filter(c => {
        const subjects = (c.subjects || []).map(s => s.trim());
        return advancedFilters.selectedDepartments.some(d => subjects.includes(d));
      });
    }

    // Location filter
    if (advancedFilters.selectedLocations.length > 0) {
      result = result.filter(c => {
        const loc = c.location?.trim() || "";
        return advancedFilters.selectedLocations.includes(loc);
      });
    }

    // University filter
    if (advancedFilters.selectedUniversities.length > 0) {
      result = result.filter(c => {
        const uni = c.university?.trim() || "";
        return advancedFilters.selectedUniversities.includes(uni);
      });
    }

    // Profile freshness filter
    if (advancedFilters.profileFreshness !== "all") {
      const days = parseInt(advancedFilters.profileFreshness, 10);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - days);
      result = result.filter(c => {
        if (!c.updated_at) return false;
        return new Date(c.updated_at) >= cutoff;
      });
    }

    // Employment status filter
    if (advancedFilters.employmentStatus !== "all") {
      result = result.filter(c => {
        const exp = Array.isArray(c.experience) ? c.experience : [];
        if (advancedFilters.employmentStatus === "fresher") return exp.length === 0;
        const hasCurrentJob = exp.some((e: any) => e.isCurrent === true || e.current === true);
        if (advancedFilters.employmentStatus === "working") return hasCurrentJob;
        return !hasCurrentJob && exp.length > 0;
      });
    }

    // Has resume filter
    if (advancedFilters.hasResume === "yes") {
      result = result.filter(c => !!c.resume_url);
    } else if (advancedFilters.hasResume === "no") {
      result = result.filter(c => !c.resume_url);
    }

    // Has research papers filter
    if (advancedFilters.hasResearchPapers === "yes") {
      result = result.filter(c => {
        const papers = Array.isArray(c.research_papers) ? c.research_papers : [];
        return papers.length > 0;
      });
    } else if (advancedFilters.hasResearchPapers === "no") {
      result = result.filter(c => {
        const papers = Array.isArray(c.research_papers) ? c.research_papers : [];
        return papers.length === 0;
      });
    }

    // H-Index range filter
    const [minH, maxH] = advancedFilters.hIndexRange;
    if (minH !== 0 || maxH !== 50) {
      result = result.filter(c => {
        const hIndex = c.manual_h_index || (c.scopus_metrics as any)?.h_index || 0;
        return hIndex >= minH && (maxH === 50 ? true : hIndex <= maxH);
      });
    }

    // Candidate Category filter
    if (advancedFilters.candidateCategory !== "all") {
      result = result.filter(c => {
        const cat = getCandidateCategory(c);
        return cat === advancedFilters.candidateCategory;
      });
    }

    // Notice Period filter (inferred from employment status - fresher = immediate, not working = immediate, working = based on experience)
    if (advancedFilters.noticePeriod !== "all") {
      result = result.filter(c => {
        const exp = Array.isArray(c.experience) ? c.experience : [];
        const hasCurrentJob = exp.some((e: any) => e.isCurrent === true || e.current === true);
        if (advancedFilters.noticePeriod === "immediate") {
          return !hasCurrentJob; // Not working = can join immediately
        }
        // For other notice periods, only show currently working candidates
        return hasCurrentJob;
      });
    }

    // Profile Completeness filter
    if (advancedFilters.profileCompleteness > 0) {
      result = result.filter(c => {
        const completeness = calculateCompleteness(c);
        return completeness >= advancedFilters.profileCompleteness;
      });
    }

    // Publications Count filter
    const [minPub, maxPub] = advancedFilters.publicationsRange;
    if (minPub !== 0 || maxPub !== 100) {
      result = result.filter(c => {
        const papers = Array.isArray(c.research_papers) ? c.research_papers.length : 0;
        const scopusDocs = (c.scopus_metrics as any)?.document_count || 0;
        const pubCount = Math.max(papers, scopusDocs);
        return pubCount >= minPub && (maxPub === 100 ? true : pubCount <= maxPub);
      });
    }

    // Citations filter
    const [minCit, maxCit] = advancedFilters.citationsRange;
    if (minCit !== 0 || maxCit !== 1000) {
      result = result.filter(c => {
        const citations = (c.scopus_metrics as any)?.citations || 0;
        return citations >= minCit && (maxCit === 1000 ? true : citations <= maxCit);
      });
    }

    // LinkedIn filter
    if (advancedFilters.hasLinkedin === "yes") {
      result = result.filter(c => !!c.linkedin_url);
    } else if (advancedFilters.hasLinkedin === "no") {
      result = result.filter(c => !c.linkedin_url);
    }

    // ORCID filter
    if (advancedFilters.hasOrcid === "yes") {
      result = result.filter(c => !!c.orcid_id);
    } else if (advancedFilters.hasOrcid === "no") {
      result = result.filter(c => !c.orcid_id);
    }

    // Gender filter (inferred from name/bio - basic heuristic)

    // Age Group filter (inferred from years of experience as proxy)
    if (advancedFilters.ageGroup !== "all") {
      result = result.filter(c => {
        const exp = c.years_experience || 0;
        // Estimate age as ~22 + years_experience
        const estimatedAge = 22 + exp;
        switch (advancedFilters.ageGroup) {
          case "22-30": return estimatedAge >= 22 && estimatedAge <= 30;
          case "31-40": return estimatedAge >= 31 && estimatedAge <= 40;
          case "41-50": return estimatedAge >= 41 && estimatedAge <= 50;
          case "51-60": return estimatedAge >= 51 && estimatedAge <= 60;
          case "60+": return estimatedAge > 60;
          default: return true;
        }
      });
    }

    // Industry type filter (inferred from university/headline)
    if (advancedFilters.industryType !== "all") {
      result = result.filter(c => {
        const text = `${c.university || ""} ${c.headline || ""} ${c.role || ""}`.toLowerCase();
        switch (advancedFilters.industryType) {
          case "university": return /\buniversit/i.test(text);
          case "college": return /\bcollege\b/i.test(text);
          case "iit_nit": return /\b(iit|nit|iiit)\b/i.test(text);
          case "research_institute": return /\b(research|institute|lab)\b/i.test(text);
          case "edtech": return /\b(edtech|online|digital|e-learning)\b/i.test(text);
          case "school": return /\b(school|k-12|k12|secondary|primary)\b/i.test(text);
          case "corporate": return /\b(corporate|training|industry)\b/i.test(text);
          default: return true;
        }
      });
    }

    // Institution Accreditation filter
    if (advancedFilters.selectedInstitutionTypes.length > 0) {
      result = result.filter(c => {
        const text = `${c.university || ""} ${c.headline || ""} ${c.bio || ""} ${c.professional_summary || ""}`.toLowerCase();
        return advancedFilters.selectedInstitutionTypes.some(t => {
          const keyword = t.toLowerCase();
          return text.includes(keyword);
        });
      });
    }

    // Preferred Job Type filter (inferred from headline/role)
    if (advancedFilters.preferredJobType !== "all") {
      result = result.filter(c => {
        const text = `${c.role || ""} ${c.headline || ""} ${c.professional_summary || ""}`.toLowerCase();
        switch (advancedFilters.preferredJobType) {
          case "full_time": return /\b(full.?time|permanent)\b/.test(text) || !(/\b(part.?time|contract|visiting|remote|freelance)\b/.test(text));
          case "part_time": return /\b(part.?time)\b/.test(text);
          case "contract": return /\b(contract|temporary|contractual)\b/.test(text);
          case "visiting": return /\b(visiting|guest|adjunct)\b/.test(text);
          case "remote": return /\b(remote|online|virtual|work from home|wfh)\b/.test(text);
          default: return true;
        }
      });
    }

    // Has Scopus Profile filter
    if (advancedFilters.hasScopusProfile === "yes") {
      result = result.filter(c => !!c.scopus_link || !!(c.scopus_metrics as any)?.h_index);
    } else if (advancedFilters.hasScopusProfile === "no") {
      result = result.filter(c => !c.scopus_link && !(c.scopus_metrics as any)?.h_index);
    }

    // UGC NET Qualified filter (inferred from bio/headline/achievements)
    if (advancedFilters.ugcNetQualified === "yes") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.headline || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return /\b(ugc.?net|net.?qualified|net.?jrf|csir.?net|slet|set)\b/.test(text);
      });
    } else if (advancedFilters.ugcNetQualified === "no") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.headline || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return !/\b(ugc.?net|net.?qualified|net.?jrf|csir.?net|slet|set)\b/.test(text);
      });
    }

    // Teaching Experience filter
    if (advancedFilters.hasTeachingExperience === "yes") {
      result = result.filter(c => {
        const text = `${c.role || ""} ${c.headline || ""} ${c.teaching_philosophy || ""} ${c.professional_summary || ""}`.toLowerCase();
        const exp = Array.isArray(c.experience) ? c.experience : [];
        const hasTeaching = /\b(teach|professor|lecturer|instructor|faculty|academic)\b/.test(text);
        const hasTeachingExp = exp.some((e: any) => /\b(teach|professor|lecturer|instructor|faculty)\b/.test(`${e.role || ""} ${e.title || ""}`.toLowerCase()));
        return hasTeaching || hasTeachingExp || !!c.teaching_philosophy;
      });
    } else if (advancedFilters.hasTeachingExperience === "no") {
      result = result.filter(c => {
        const text = `${c.role || ""} ${c.headline || ""}`.toLowerCase();
        return !/\b(teach|professor|lecturer|instructor|faculty)\b/.test(text) && !c.teaching_philosophy;
      });
    }

    // Last Active filter
    if (advancedFilters.lastActive !== "all") {
      const now = new Date();
      let cutoff: Date;
      switch (advancedFilters.lastActive) {
        case "today": cutoff = new Date(now.setHours(0, 0, 0, 0)); break;
        case "3days": cutoff = new Date(Date.now() - 3 * 86400000); break;
        case "1week": cutoff = new Date(Date.now() - 7 * 86400000); break;
        case "2weeks": cutoff = new Date(Date.now() - 14 * 86400000); break;
        case "1month": cutoff = new Date(Date.now() - 30 * 86400000); break;
        default: cutoff = new Date(0);
      }
      result = result.filter(c => {
        if (!c.updated_at) return false;
        return new Date(c.updated_at) >= cutoff;
      });
    }

    // Functional Area filter
    if (advancedFilters.selectedFunctionalAreas.length > 0) {
      result = result.filter(c => {
        const text = `${c.role || ""} ${c.headline || ""} ${c.professional_summary || ""} ${c.teaching_philosophy || ""} ${(c.subjects || []).join(" ")}`.toLowerCase();
        return advancedFilters.selectedFunctionalAreas.some(area => text.includes(area.toLowerCase()));
      });
    }

    // Language filter
    if (advancedFilters.selectedLanguages.length > 0) {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.professional_summary || ""} ${(c.skills || []).join(" ")} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return advancedFilters.selectedLanguages.some(lang => text.includes(lang.toLowerCase()));
      });
    }

    // Patents filter
    if (advancedFilters.hasPatents === "yes") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return /\b(patent|patented|invention)\b/.test(text);
      });
    } else if (advancedFilters.hasPatents === "no") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return !/\b(patent|patented|invention)\b/.test(text);
      });
    }

    // Book/Chapter author filter
    if (advancedFilters.hasBookChapters === "yes") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return /\b(book|chapter|authored|monograph|textbook|edited volume)\b/.test(text);
      });
    } else if (advancedFilters.hasBookChapters === "no") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return !/\b(book|chapter|authored|monograph|textbook)\b/.test(text);
      });
    }

    // FDP/Workshop filter
    if (advancedFilters.hasFDPWorkshop === "yes") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return /\b(fdp|workshop|seminar|conference|symposium|faculty development)\b/.test(text);
      });
    } else if (advancedFilters.hasFDPWorkshop === "no") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return !/\b(fdp|workshop|seminar|conference|symposium|faculty development)\b/.test(text);
      });
    }

    // Administrative Experience filter
    if (advancedFilters.hasAdminExperience === "yes") {
      result = result.filter(c => {
        const text = `${c.role || ""} ${c.headline || ""} ${c.professional_summary || ""} ${c.bio || ""}`.toLowerCase();
        const exp = Array.isArray(c.experience) ? c.experience : [];
        const hasAdmin = /\b(dean|hod|head of department|principal|director|registrar|controller|coordinator|chairperson|vice chancellor|provost|warden)\b/.test(text);
        const hasAdminExp = exp.some((e: any) => /\b(dean|hod|head|principal|director|registrar|coordinator|chairperson)\b/.test(`${e.role || ""} ${e.title || ""}`.toLowerCase()));
        return hasAdmin || hasAdminExp;
      });
    }

    // International Exposure filter
    if (advancedFilters.hasInternationalExposure === "yes") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")} ${c.headline || ""}`.toLowerCase();
        return /\b(international|abroad|overseas|foreign|usa|uk|europe|canada|australia|global|postdoc abroad|visiting scholar)\b/.test(text);
      });
    }

    // Co-Authors Range filter
    const [minCoAuth, maxCoAuth] = advancedFilters.coAuthorsRange;
    if (minCoAuth !== 0 || maxCoAuth !== 50) {
      result = result.filter(c => {
        const coAuthors = (c.scopus_metrics as any)?.co_authors?.length || 0;
        return coAuthors >= minCoAuth && (maxCoAuth === 50 ? true : coAuthors <= maxCoAuth);
      });
    }

    // Teaching Experience Range filter
    const [minTeach, maxTeach] = advancedFilters.teachingExpRange;
    if (minTeach !== 0 || maxTeach !== 30) {
      result = result.filter(c => {
        const text = `${c.role || ""} ${c.headline || ""}`.toLowerCase();
        const isTeaching = /\b(teach|professor|lecturer|instructor|faculty)\b/.test(text);
        if (!isTeaching) return minTeach === 0;
        const exp = c.years_experience || 0;
        return exp >= minTeach && (maxTeach === 30 ? true : exp <= maxTeach);
      });
    }

    // PhD Supervision filter
    if (advancedFilters.hasPhDSupervision === "yes") {
      result = result.filter(c => {
        const text = `${c.bio || ""} ${c.professional_summary || ""} ${(c.achievements || []).join(" ")}`.toLowerCase();
        return /\b(ph\.?d\.?\s*supervis|doctoral\s*supervis|guided\s*ph\.?d|ph\.?d\.?\s*student|research\s*scholar|m\.?phil\s*supervis)\b/.test(text);
      });
    }

    return result;
  }, [nearMeFiltered, advancedFilters]);

  // Sort candidates
  const sortedCandidates = useMemo(() => {
    const sorted = [...filteredCandidates];
    
    switch (sortBy) {
      case "recent":
        return sorted.sort((a, b) => {
          const dateA = a.updated_at ? new Date(a.updated_at).getTime() : 0;
          const dateB = b.updated_at ? new Date(b.updated_at).getTime() : 0;
          return dateB - dateA;
        });
      case "experience-desc":
        return sorted.sort((a, b) => (b.years_experience || 0) - (a.years_experience || 0));
      case "experience-asc":
        return sorted.sort((a, b) => (a.years_experience || 0) - (b.years_experience || 0));
      case "name-asc":
        return sorted.sort((a, b) => (a.full_name || "").localeCompare(b.full_name || ""));
      case "name-desc":
        return sorted.sort((a, b) => (b.full_name || "").localeCompare(a.full_name || ""));
      default:
        return sorted;
    }
  }, [filteredCandidates, sortBy]);

  // Pagination logic
  const totalPages = Math.ceil(sortedCandidates.length / CANDIDATES_PER_PAGE);
  const startIndex = (currentPage - 1) * CANDIDATES_PER_PAGE;
  const endIndex = startIndex + CANDIDATES_PER_PAGE;
  const paginatedCandidates = sortedCandidates.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <CardListSkeleton count={4} />
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >

      {/* Smart Candidate Search */}
      <SmartCandidateSearch
        candidates={candidates}
        onSearchResults={handleSearchResults}
        onSearching={handleSearching}
      />

      {/* Advanced Filters */}
      <motion.div variants={staggerItemVariants}>
        <CandidateFiltersPanel
          candidates={candidates}
          filters={advancedFilters}
          onFiltersChange={(f) => {
            setAdvancedFilters(f);
            setCurrentPage(1);
          }}
        />
      </motion.div>

      {/* Results Header with Sorting and Pagination Info */}
      <motion.div variants={staggerItemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            {hasSearched ? (
              <>
                Found <span className="font-medium text-foreground">{sortedCandidates.length}</span> matching candidates
              </>
            ) : (
              <>
                Candidate Pool: <span className="font-medium text-foreground">{sortedCandidates.length}</span> candidates
              </>
            )}
            {sortedCandidates.length > 0 && (
              <span className="ml-2 text-muted-foreground">
                (Showing {startIndex + 1}-{Math.min(endIndex, sortedCandidates.length)} of {sortedCandidates.length})
              </span>
            )}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Near Me Filter */}
          <label className="flex items-center gap-2 cursor-pointer select-none border border-border rounded-lg px-3 py-1.5 hover:bg-accent/50 transition-colors">
            <Checkbox
              checked={showNearMe}
              onCheckedChange={(checked) => {
                if (!recruiterLocation) {
                  toast({
                    title: "Location not set",
                    description: "Please update your location in your profile settings to use this filter.",
                    variant: "destructive",
                  });
                  return;
                }
                setShowNearMe(!!checked);
                setCurrentPage(1);
              }}
            />
            <MapPin className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium text-foreground whitespace-nowrap">Near Me</span>
          </label>

          <div className="flex items-center gap-2">
            <ArrowUpDown className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={(value) => handleSortChange(value as SortOption)}>
              <SelectTrigger className="w-[200px] h-9">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                {sortOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    <div className="flex items-center gap-2">
                      {option.icon}
                      {option.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          {hasSearched && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={clearSearch}
            >
              <X className="h-4 w-4" />
              Clear Search
            </Button>
          )}
        </div>
      </motion.div>

      {/* Candidate Results */}
      <motion.div variants={staggerItemVariants} className="grid gap-4">
        {isSearching ? (
          <CardListSkeleton count={3} />
        ) : paginatedCandidates.length === 0 ? (
          hasSearched ? (
            <EmptyState
              icon={UserSearch}
              title="No matches yet"
              description="Try loosening a filter or two — the right candidate might be one keyword away."
              action={{
                label: "Clear Search",
                onClick: clearSearch,
                icon: X,
              }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="The talent pool is warming up"
              description="New candidates join every day. Check back soon — or post a role to attract them faster."
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>New candidates are added daily</span>
              </div>
            </EmptyState>
          )
        ) : (
          paginatedCandidates.map((candidate, index) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              index={index}
              isSaved={savedCandidateIds.has(candidate.id)}
              note={savedCandidateNotes[candidate.id]}
              savedStatus={savedCandidateStatuses?.[candidate.id]}
              onView={onViewCandidate}
              onSave={onSaveCandidate}
              onMessage={onMessageCandidate}
              onSaveNote={onSaveNote}
              onSetStatus={onSetStatus}
            />
          ))
        )}
      </motion.div>

      {/* Pagination Controls */}
      {sortedCandidates.length > CANDIDATES_PER_PAGE && (
        <motion.div 
          variants={staggerItemVariants} 
          className="flex items-center justify-center gap-4 pt-4"
        >
          <Button
            variant="outline"
            size="sm"
            onClick={goToPreviousPage}
            disabled={currentPage === 1}
            className="gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          
          <div className="flex items-center gap-2">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let page: number;
              if (totalPages <= 5) {
                page = i + 1;
              } else if (currentPage <= 3) {
                page = i + 1;
              } else if (currentPage >= totalPages - 2) {
                page = totalPages - 4 + i;
              } else {
                page = currentPage - 2 + i;
              }
              return (
                <Button
                  key={page}
                  variant={currentPage === page ? "default" : "outline"}
                  size="sm"
                  className="w-8 h-8 p-0"
                  onClick={() => setCurrentPage(page)}
                >
                  {page}
                </Button>
              );
            })}
          </div>
          
          <Button
            variant="outline"
            size="sm"
            onClick={goToNextPage}
            disabled={currentPage === totalPages}
            className="gap-2"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

export default FindCandidatesTab;
