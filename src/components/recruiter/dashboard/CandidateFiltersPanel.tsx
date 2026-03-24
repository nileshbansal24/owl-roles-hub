import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Filter, X, ChevronDown, ChevronUp, MapPin, GraduationCap,
  Briefcase, FileText, BookOpen, Clock, Building2, UserCheck,
  Award, Shield, Linkedin, Globe, Timer, BarChart3, Users,
  CalendarDays, Building, MapPinned, Inbox, Star, Microscope
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import type { Profile } from "@/types/recruiter";

// ─── Filter model ────────────────────────────────────────────────
export interface CandidateFilters {
  experienceRange: [number, number];
  selectedSkills: string[];
  educationLevel: string;
  salaryRange: [number, number];
  selectedDesignations: string[];
  selectedDepartments: string[];
  selectedLocations: string[];
  selectedUniversities: string[];
  profileFreshness: string;
  employmentStatus: string;
  hasResume: string;
  hasResearchPapers: string;
  hIndexRange: [number, number];
  noticePeriod: string;
  candidateCategory: string;
  profileCompleteness: number;
  publicationsRange: [number, number];
  citationsRange: [number, number];
  verifiedProfile: string;
  hasLinkedin: string;
  hasOrcid: string;
  gender: string;
  // Additional Naukri-style filters
  ageGroup: string;
  industryType: string;
  preferredJobType: string;
  willingToRelocate: string;
  appliedToMyJobs: string;
  lastActive: string;
  hasScopusProfile: string;
  selectedInstitutionTypes: string[];
  ugcNetQualified: string;
  hasTeachingExperience: string;
}

export const defaultFilters: CandidateFilters = {
  experienceRange: [0, 30],
  selectedSkills: [],
  educationLevel: "all",
  salaryRange: [0, 50],
  selectedDesignations: [],
  selectedDepartments: [],
  selectedLocations: [],
  selectedUniversities: [],
  profileFreshness: "all",
  employmentStatus: "all",
  hasResume: "all",
  hasResearchPapers: "all",
  hIndexRange: [0, 50],
  noticePeriod: "all",
  candidateCategory: "all",
  profileCompleteness: 0,
  publicationsRange: [0, 100],
  citationsRange: [0, 1000],
  verifiedProfile: "all",
  hasLinkedin: "all",
  hasOrcid: "all",
  gender: "all",
  ageGroup: "all",
  industryType: "all",
  preferredJobType: "all",
  willingToRelocate: "all",
  appliedToMyJobs: "all",
  lastActive: "all",
  hasScopusProfile: "all",
  selectedInstitutionTypes: [],
  ugcNetQualified: "all",
  hasTeachingExperience: "all",
};

// ─── Static options ──────────────────────────────────────────────
const designations = [
  "Professor",
  "Associate Professor",
  "Assistant Professor",
  "Dean",
  "HOD / Head of Department",
  "Vice Chancellor",
  "Principal",
  "Lecturer",
  "Senior Lecturer",
  "Research Associate",
  "Postdoctoral Fellow",
  "Lab Instructor",
  "Teaching Assistant",
  "Visiting Faculty",
  "Adjunct Faculty",
];

const educationLevels = [
  { value: "all", label: "All Levels" },
  { value: "phd", label: "PhD / Doctorate" },
  { value: "masters", label: "Master's Degree" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "postdoc", label: "Post-Doctoral" },
  { value: "diploma", label: "Diploma / Certificate" },
];

const freshnessOptions = [
  { value: "all", label: "Any time" },
  { value: "1", label: "Last 24 hours" },
  { value: "3", label: "Last 3 days" },
  { value: "7", label: "Last 1 week" },
  { value: "14", label: "Last 2 weeks" },
  { value: "30", label: "Last 1 month" },
  { value: "90", label: "Last 3 months" },
];

const employmentStatuses = [
  { value: "all", label: "All" },
  { value: "working", label: "Currently Working" },
  { value: "not_working", label: "Not Working" },
  { value: "fresher", label: "Fresher" },
];

const noticePeriodOptions = [
  { value: "all", label: "Any" },
  { value: "immediate", label: "Immediate" },
  { value: "15days", label: "15 Days" },
  { value: "1month", label: "1 Month" },
  { value: "2months", label: "2 Months" },
  { value: "3months", label: "3 Months" },
  { value: "3months+", label: "More than 3 Months" },
];

const candidateCategoryOptions = [
  { value: "all", label: "All Categories" },
  { value: "gold", label: "🥇 Gold" },
  { value: "silver", label: "🥈 Silver" },
  { value: "bronze", label: "🥉 Bronze" },
  { value: "fresher", label: "🆕 Fresher" },
];

const genderOptions = [
  { value: "all", label: "All" },
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "other", label: "Other" },
];

const ageGroupOptions = [
  { value: "all", label: "Any" },
  { value: "22-30", label: "22-30 yrs" },
  { value: "31-40", label: "31-40 yrs" },
  { value: "41-50", label: "41-50 yrs" },
  { value: "51-60", label: "51-60 yrs" },
  { value: "60+", label: "60+ yrs" },
];

const industryTypeOptions = [
  { value: "all", label: "All" },
  { value: "university", label: "University" },
  { value: "college", label: "College" },
  { value: "iit_nit", label: "IIT / NIT" },
  { value: "research_institute", label: "Research Institute" },
  { value: "edtech", label: "EdTech" },
  { value: "school", label: "School / K-12" },
  { value: "corporate", label: "Corporate Training" },
];

const jobTypePreferenceOptions = [
  { value: "all", label: "Any" },
  { value: "full_time", label: "Full Time" },
  { value: "part_time", label: "Part Time" },
  { value: "contract", label: "Contract" },
  { value: "visiting", label: "Visiting" },
  { value: "remote", label: "Remote / Online" },
];

const institutionTypeOptions = [
  "Government",
  "Private",
  "Deemed University",
  "Autonomous",
  "NAAC A+",
  "NAAC A",
  "NIRF Top 100",
  "UGC Recognized",
];

const lastActiveOptions = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "3days", label: "Last 3 days" },
  { value: "1week", label: "Last 1 week" },
  { value: "2weeks", label: "Last 2 weeks" },
  { value: "1month", label: "Last 1 month" },
];

// ─── Props ───────────────────────────────────────────────────────
interface CandidateFiltersPanelProps {
  candidates: Profile[];
  filters: CandidateFilters;
  onFiltersChange: (filters: CandidateFilters) => void;
}

// ─── Component ───────────────────────────────────────────────────
const CandidateFiltersPanel = ({
  candidates,
  filters,
  onFiltersChange,
}: CandidateFiltersPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Derive dynamic options from candidate pool
  const topSkills = useMemo(() => {
    const map = new Map<string, number>();
    candidates.forEach((c) =>
      c.skills?.forEach((s) => {
        const n = s.trim().toLowerCase();
        if (n) map.set(n, (map.get(n) || 0) + 1);
      })
    );
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 25)
      .map(([s]) => s);
  }, [candidates]);

  const topLocations = useMemo(() => {
    const map = new Map<string, number>();
    candidates.forEach((c) => {
      const loc = c.location?.trim();
      if (loc) map.set(loc, (map.get(loc) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([l]) => l);
  }, [candidates]);

  const topUniversities = useMemo(() => {
    const map = new Map<string, number>();
    candidates.forEach((c) => {
      const u = c.university?.trim();
      if (u) map.set(u, (map.get(u) || 0) + 1);
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([u]) => u);
  }, [candidates]);

  const topDepartments = useMemo(() => {
    const map = new Map<string, number>();
    candidates.forEach((c) => {
      c.subjects?.forEach((s) => {
        const n = s.trim();
        if (n) map.set(n, (map.get(n) || 0) + 1);
      });
    });
    return Array.from(map.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([d]) => d);
  }, [candidates]);

  // Active filter count
  const activeFilterCount = useMemo(() => {
    let c = 0;
    if (filters.experienceRange[0] !== 0 || filters.experienceRange[1] !== 30) c++;
    if (filters.selectedSkills.length > 0) c++;
    if (filters.educationLevel !== "all") c++;
    if (filters.salaryRange[0] !== 0 || filters.salaryRange[1] !== 50) c++;
    if (filters.selectedDesignations.length > 0) c++;
    if (filters.selectedDepartments.length > 0) c++;
    if (filters.selectedLocations.length > 0) c++;
    if (filters.selectedUniversities.length > 0) c++;
    if (filters.profileFreshness !== "all") c++;
    if (filters.employmentStatus !== "all") c++;
    if (filters.hasResume !== "all") c++;
    if (filters.hasResearchPapers !== "all") c++;
    if (filters.hIndexRange[0] !== 0 || filters.hIndexRange[1] !== 50) c++;
    if (filters.noticePeriod !== "all") c++;
    if (filters.candidateCategory !== "all") c++;
    if (filters.profileCompleteness > 0) c++;
    if (filters.publicationsRange[0] !== 0 || filters.publicationsRange[1] !== 100) c++;
    if (filters.citationsRange[0] !== 0 || filters.citationsRange[1] !== 1000) c++;
    if (filters.verifiedProfile !== "all") c++;
    if (filters.hasLinkedin !== "all") c++;
    if (filters.hasOrcid !== "all") c++;
    if (filters.gender !== "all") c++;
    if (filters.ageGroup !== "all") c++;
    if (filters.industryType !== "all") c++;
    if (filters.preferredJobType !== "all") c++;
    if (filters.willingToRelocate !== "all") c++;
    if (filters.appliedToMyJobs !== "all") c++;
    if (filters.lastActive !== "all") c++;
    if (filters.hasScopusProfile !== "all") c++;
    if (filters.selectedInstitutionTypes.length > 0) c++;
    if (filters.ugcNetQualified !== "all") c++;
    if (filters.hasTeachingExperience !== "all") c++;
    return c;
  }, [filters]);

  // Helpers
  const toggle = (key: keyof CandidateFilters, value: string) => {
    const arr = filters[key] as string[];
    const updated = arr.includes(value)
      ? arr.filter((v) => v !== value)
      : [...arr, value];
    onFiltersChange({ ...filters, [key]: updated });
  };

  const clearFilters = () => onFiltersChange(defaultFilters);

  // ─── Checkbox list component ────────────────────────────────
  const CheckboxList = ({
    items,
    selected,
    filterKey,
    maxVisible = 6,
  }: {
    items: string[];
    selected: string[];
    filterKey: keyof CandidateFilters;
    maxVisible?: number;
  }) => {
    const [showAll, setShowAll] = useState(false);
    const visible = showAll ? items : items.slice(0, maxVisible);
    return (
      <div className="space-y-2">
        <div className="flex flex-wrap gap-x-4 gap-y-2 max-h-48 overflow-y-auto">
          {visible.map((item) => (
            <label key={item} className="flex items-center gap-1.5 cursor-pointer select-none min-w-[140px]">
              <Checkbox
                checked={selected.includes(item)}
                onCheckedChange={() => toggle(filterKey, item)}
                className="h-3.5 w-3.5"
              />
              <span className="text-xs text-foreground truncate">{item}</span>
            </label>
          ))}
        </div>
        {items.length > maxVisible && (
          <button
            onClick={() => setShowAll(!showAll)}
            className="text-xs text-primary hover:underline"
          >
            {showAll ? "Show less" : `+${items.length - maxVisible} more`}
          </button>
        )}
      </div>
    );
  };

  // Pill selector helper
  const PillSelector = ({
    options,
    value,
    onChange,
  }: {
    options: { value: string; label: string }[];
    value: string;
    onChange: (v: string) => void;
  }) => (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(opt.value)}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
            value === opt.value
              ? "bg-primary text-primary-foreground border-primary"
              : "bg-background text-foreground border-border hover:bg-accent"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );

  return (
    <div className="space-y-2">
      {/* Toggle Button */}
      <div className="flex items-center gap-2 flex-wrap">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Advanced Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {activeFilterCount}
            </Badge>
          )}
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" /> Clear all ({activeFilterCount})
          </Button>
        )}
        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {filters.selectedDesignations.map((d) => (
              <Badge key={d} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => toggle("selectedDesignations", d)}>
                {d} <X className="h-3 w-3" />
              </Badge>
            ))}
            {filters.selectedLocations.map((l) => (
              <Badge key={l} variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => toggle("selectedLocations", l)}>
                {l} <X className="h-3 w-3" />
              </Badge>
            ))}
            {filters.employmentStatus !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => onFiltersChange({ ...filters, employmentStatus: "all" })}>
                {employmentStatuses.find(s => s.value === filters.employmentStatus)?.label} <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.profileFreshness !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => onFiltersChange({ ...filters, profileFreshness: "all" })}>
                {freshnessOptions.find(o => o.value === filters.profileFreshness)?.label} <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.candidateCategory !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => onFiltersChange({ ...filters, candidateCategory: "all" })}>
                {candidateCategoryOptions.find(o => o.value === filters.candidateCategory)?.label} <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.noticePeriod !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => onFiltersChange({ ...filters, noticePeriod: "all" })}>
                Notice: {noticePeriodOptions.find(o => o.value === filters.noticePeriod)?.label} <X className="h-3 w-3" />
              </Badge>
            )}
            {filters.gender !== "all" && (
              <Badge variant="secondary" className="text-xs gap-1 cursor-pointer" onClick={() => onFiltersChange({ ...filters, gender: "all" })}>
                {genderOptions.find(o => o.value === filters.gender)?.label} <X className="h-3 w-3" />
              </Badge>
            )}
          </div>
        )}
      </div>

      {/* Filter Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="border border-border rounded-lg bg-card">
              <Accordion type="multiple" defaultValue={["designation", "experience", "location"]} className="w-full">

                {/* ─── Designation ─────────────────────────── */}
                <AccordionItem value="designation" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <UserCheck className="h-4 w-4 text-primary" />
                      Designation
                      {filters.selectedDesignations.length > 0 && (
                        <Badge variant="default" className="h-4 text-[10px] px-1.5 rounded-full">
                          {filters.selectedDesignations.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <CheckboxList
                      items={designations}
                      selected={filters.selectedDesignations}
                      filterKey="selectedDesignations"
                      maxVisible={8}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Experience ──────────────────────────── */}
                <AccordionItem value="experience" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Experience
                      {(filters.experienceRange[0] !== 0 || filters.experienceRange[1] !== 30) && (
                        <span className="text-xs text-muted-foreground font-normal">
                          {filters.experienceRange[0]}–{filters.experienceRange[1]}+ yrs
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        {filters.experienceRange[0]} – {filters.experienceRange[1]}+ years
                      </span>
                    </div>
                    <Slider
                      min={0} max={30} step={1}
                      value={filters.experienceRange}
                      onValueChange={(v) => onFiltersChange({ ...filters, experienceRange: v as [number, number] })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0 yrs</span><span>15 yrs</span><span>30+ yrs</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Location ────────────────────────────── */}
                <AccordionItem value="location" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPin className="h-4 w-4 text-primary" />
                      Location
                      {filters.selectedLocations.length > 0 && (
                        <Badge variant="default" className="h-4 text-[10px] px-1.5 rounded-full">
                          {filters.selectedLocations.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {topLocations.length > 0 ? (
                      <CheckboxList
                        items={topLocations}
                        selected={filters.selectedLocations}
                        filterKey="selectedLocations"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">No location data available</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Candidate Category (Gold/Silver/Bronze) */}
                <AccordionItem value="category" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Award className="h-4 w-4 text-primary" />
                      Candidate Category
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={candidateCategoryOptions}
                      value={filters.candidateCategory}
                      onChange={(v) => onFiltersChange({ ...filters, candidateCategory: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Notice Period ──────────────────────── */}
                <AccordionItem value="notice" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Timer className="h-4 w-4 text-primary" />
                      Notice Period
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={noticePeriodOptions}
                      value={filters.noticePeriod}
                      onChange={(v) => onFiltersChange({ ...filters, noticePeriod: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Gender ─────────────────────────────── */}
                <AccordionItem value="gender" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Users className="h-4 w-4 text-primary" />
                      Gender
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={genderOptions}
                      value={filters.gender}
                      onChange={(v) => onFiltersChange({ ...filters, gender: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Department / Subject ────────────────── */}
                <AccordionItem value="department" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Department / Subject
                      {filters.selectedDepartments.length > 0 && (
                        <Badge variant="default" className="h-4 text-[10px] px-1.5 rounded-full">
                          {filters.selectedDepartments.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {topDepartments.length > 0 ? (
                      <CheckboxList
                        items={topDepartments}
                        selected={filters.selectedDepartments}
                        filterKey="selectedDepartments"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">No department data available</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* ─── University / Institute ─────────────── */}
                <AccordionItem value="university" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building2 className="h-4 w-4 text-primary" />
                      University / Institute
                      {filters.selectedUniversities.length > 0 && (
                        <Badge variant="default" className="h-4 text-[10px] px-1.5 rounded-full">
                          {filters.selectedUniversities.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {topUniversities.length > 0 ? (
                      <CheckboxList
                        items={topUniversities}
                        selected={filters.selectedUniversities}
                        filterKey="selectedUniversities"
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">No university data available</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Salary ─────────────────────────────── */}
                <AccordionItem value="salary" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <span className="text-primary text-sm font-bold">₹</span>
                      Annual Salary (LPA)
                      {(filters.salaryRange[0] !== 0 || filters.salaryRange[1] !== 50) && (
                        <span className="text-xs text-muted-foreground font-normal">
                          ₹{filters.salaryRange[0]}L–₹{filters.salaryRange[1] === 50 ? "50+" : filters.salaryRange[1]}L
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">
                        ₹{filters.salaryRange[0]}L – ₹{filters.salaryRange[1] === 50 ? "50+" : filters.salaryRange[1]}L
                      </span>
                    </div>
                    <Slider
                      min={0} max={50} step={1}
                      value={filters.salaryRange}
                      onValueChange={(v) => onFiltersChange({ ...filters, salaryRange: v as [number, number] })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>₹0L</span><span>₹25L</span><span>₹50L+</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Education Level ─────────────────────── */}
                <AccordionItem value="education" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <GraduationCap className="h-4 w-4 text-primary" />
                      Education Level
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <Select
                      value={filters.educationLevel}
                      onValueChange={(v) => onFiltersChange({ ...filters, educationLevel: v })}
                    >
                      <SelectTrigger className="w-full h-9">
                        <SelectValue placeholder="Select education level" />
                      </SelectTrigger>
                      <SelectContent>
                        {educationLevels.map((l) => (
                          <SelectItem key={l.value} value={l.value}>{l.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Skills ─────────────────────────────── */}
                <AccordionItem value="skills" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Skills
                      {filters.selectedSkills.length > 0 && (
                        <Badge variant="default" className="h-4 text-[10px] px-1.5 rounded-full">
                          {filters.selectedSkills.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    {topSkills.length > 0 ? (
                      <CheckboxList
                        items={topSkills}
                        selected={filters.selectedSkills}
                        filterKey="selectedSkills"
                        maxVisible={10}
                      />
                    ) : (
                      <p className="text-xs text-muted-foreground">No skills data available</p>
                    )}
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Profile Completeness ───────────────── */}
                <AccordionItem value="completeness" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <BarChart3 className="h-4 w-4 text-primary" />
                      Profile Completeness
                      {filters.profileCompleteness > 0 && (
                        <span className="text-xs text-muted-foreground font-normal">
                          ≥ {filters.profileCompleteness}%
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-3">
                    <span className="text-xs text-muted-foreground">
                      Minimum {filters.profileCompleteness}% complete
                    </span>
                    <Slider
                      min={0} max={100} step={10}
                      value={[filters.profileCompleteness]}
                      onValueChange={(v) => onFiltersChange({ ...filters, profileCompleteness: v[0] })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0%</span><span>50%</span><span>100%</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Publications Count ─────────────────── */}
                <AccordionItem value="publications" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <FileText className="h-4 w-4 text-primary" />
                      Publications Count
                      {(filters.publicationsRange[0] !== 0 || filters.publicationsRange[1] !== 100) && (
                        <span className="text-xs text-muted-foreground font-normal">
                          {filters.publicationsRange[0]}–{filters.publicationsRange[1]}+
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-3">
                    <span className="text-xs text-muted-foreground">
                      {filters.publicationsRange[0]} – {filters.publicationsRange[1]}+ papers
                    </span>
                    <Slider
                      min={0} max={100} step={1}
                      value={filters.publicationsRange}
                      onValueChange={(v) => onFiltersChange({ ...filters, publicationsRange: v as [number, number] })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0</span><span>50</span><span>100+</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Citations ──────────────────────────── */}
                <AccordionItem value="citations" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <BookOpen className="h-4 w-4 text-primary" />
                      Total Citations
                      {(filters.citationsRange[0] !== 0 || filters.citationsRange[1] !== 1000) && (
                        <span className="text-xs text-muted-foreground font-normal">
                          {filters.citationsRange[0]}–{filters.citationsRange[1]}+
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-3">
                    <span className="text-xs text-muted-foreground">
                      {filters.citationsRange[0]} – {filters.citationsRange[1]}+ citations
                    </span>
                    <Slider
                      min={0} max={1000} step={10}
                      value={filters.citationsRange}
                      onValueChange={(v) => onFiltersChange({ ...filters, citationsRange: v as [number, number] })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0</span><span>500</span><span>1000+</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Profile Freshness ──────────────────── */}
                <AccordionItem value="freshness" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-primary" />
                      Profile Freshness
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={freshnessOptions}
                      value={filters.profileFreshness}
                      onChange={(v) => onFiltersChange({ ...filters, profileFreshness: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Employment Status ──────────────────── */}
                <AccordionItem value="employment" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <UserCheck className="h-4 w-4 text-primary" />
                      Employment Status
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={employmentStatuses}
                      value={filters.employmentStatus}
                      onChange={(v) => onFiltersChange({ ...filters, employmentStatus: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── H-Index ────────────────────────────── */}
                <AccordionItem value="hindex" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <BookOpen className="h-4 w-4 text-primary" />
                      H-Index
                      {(filters.hIndexRange[0] !== 0 || filters.hIndexRange[1] !== 50) && (
                        <span className="text-xs text-muted-foreground font-normal">
                          {filters.hIndexRange[0]}–{filters.hIndexRange[1]}+
                        </span>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-3">
                    <span className="text-xs text-muted-foreground">
                      {filters.hIndexRange[0]} – {filters.hIndexRange[1]}+
                    </span>
                    <Slider
                      min={0} max={50} step={1}
                      value={filters.hIndexRange}
                      onValueChange={(v) => onFiltersChange({ ...filters, hIndexRange: v as [number, number] })}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>0</span><span>25</span><span>50+</span>
                    </div>
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Age Group ──────────────────────────── */}
                <AccordionItem value="age" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <CalendarDays className="h-4 w-4 text-primary" />
                      Age Group
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={ageGroupOptions}
                      value={filters.ageGroup}
                      onChange={(v) => onFiltersChange({ ...filters, ageGroup: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Industry / Institution Type ────────── */}
                <AccordionItem value="industry" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Building className="h-4 w-4 text-primary" />
                      Industry Type
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={industryTypeOptions}
                      value={filters.industryType}
                      onChange={(v) => onFiltersChange({ ...filters, industryType: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Institution Accreditation ──────────── */}
                <AccordionItem value="institutiontype" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Star className="h-4 w-4 text-primary" />
                      Institution Accreditation
                      {filters.selectedInstitutionTypes.length > 0 && (
                        <Badge variant="default" className="h-4 text-[10px] px-1.5 rounded-full">
                          {filters.selectedInstitutionTypes.length}
                        </Badge>
                      )}
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <CheckboxList
                      items={institutionTypeOptions}
                      selected={filters.selectedInstitutionTypes}
                      filterKey="selectedInstitutionTypes"
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Preferred Job Type ─────────────────── */}
                <AccordionItem value="jobtypepref" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Briefcase className="h-4 w-4 text-primary" />
                      Preferred Job Type
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={jobTypePreferenceOptions}
                      value={filters.preferredJobType}
                      onChange={(v) => onFiltersChange({ ...filters, preferredJobType: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Willingness to Relocate ────────────── */}
                <AccordionItem value="relocate" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <MapPinned className="h-4 w-4 text-primary" />
                      Willing to Relocate
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={[
                        { value: "all", label: "Any" },
                        { value: "yes", label: "Yes" },
                        { value: "no", label: "No" },
                      ]}
                      value={filters.willingToRelocate}
                      onChange={(v) => onFiltersChange({ ...filters, willingToRelocate: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Last Active ────────────────────────── */}
                <AccordionItem value="lastactive" className="border-b border-border px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Clock className="h-4 w-4 text-primary" />
                      Last Active
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3">
                    <PillSelector
                      options={lastActiveOptions}
                      value={filters.lastActive}
                      onChange={(v) => onFiltersChange({ ...filters, lastActive: v })}
                    />
                  </AccordionContent>
                </AccordionItem>

                {/* ─── Quick toggles ─────────────────────── */}
                <AccordionItem value="quickflags" className="px-4">
                  <AccordionTrigger className="py-3 hover:no-underline">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Shield className="h-4 w-4 text-primary" />
                      Quick Filters
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="pb-3 space-y-4">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-foreground cursor-pointer">Has Resume Attached</Label>
                      <Select value={filters.hasResume} onValueChange={(v) => onFiltersChange({ ...filters, hasResume: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-xs text-foreground cursor-pointer">Has Research Papers</Label>
                      <Select value={filters.hasResearchPapers} onValueChange={(v) => onFiltersChange({ ...filters, hasResearchPapers: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Linkedin className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-xs text-foreground cursor-pointer">Has LinkedIn Profile</Label>
                      </div>
                      <Select value={filters.hasLinkedin} onValueChange={(v) => onFiltersChange({ ...filters, hasLinkedin: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Globe className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-xs text-foreground cursor-pointer">Has ORCID ID</Label>
                      </div>
                      <Select value={filters.hasOrcid} onValueChange={(v) => onFiltersChange({ ...filters, hasOrcid: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Shield className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-xs text-foreground cursor-pointer">Verified Profile</Label>
                      </div>
                      <Select value={filters.verifiedProfile} onValueChange={(v) => onFiltersChange({ ...filters, verifiedProfile: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Verified</SelectItem>
                          <SelectItem value="no">Not Verified</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Microscope className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-xs text-foreground cursor-pointer">Has Scopus Profile</Label>
                      </div>
                      <Select value={filters.hasScopusProfile} onValueChange={(v) => onFiltersChange({ ...filters, hasScopusProfile: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Award className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-xs text-foreground cursor-pointer">UGC NET Qualified</Label>
                      </div>
                      <Select value={filters.ugcNetQualified} onValueChange={(v) => onFiltersChange({ ...filters, ugcNetQualified: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <GraduationCap className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-xs text-foreground cursor-pointer">Teaching Experience</Label>
                      </div>
                      <Select value={filters.hasTeachingExperience} onValueChange={(v) => onFiltersChange({ ...filters, hasTeachingExperience: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <Inbox className="h-3.5 w-3.5 text-primary" />
                        <Label className="text-xs text-foreground cursor-pointer">Applied to My Jobs</Label>
                      </div>
                      <Select value={filters.appliedToMyJobs} onValueChange={(v) => onFiltersChange({ ...filters, appliedToMyJobs: v })}>
                        <SelectTrigger className="w-24 h-7 text-xs">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">Any</SelectItem>
                          <SelectItem value="yes">Yes</SelectItem>
                          <SelectItem value="no">No</SelectItem>
                        </SelectContent>
                      </Select>
                  </AccordionContent>
                </AccordionItem>

              </Accordion>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateFiltersPanel;
