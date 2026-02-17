import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Profile } from "@/types/recruiter";

export interface CandidateFilters {
  experienceRange: [number, number];
  selectedSkills: string[];
  educationLevel: string;
}

export const defaultFilters: CandidateFilters = {
  experienceRange: [0, 30],
  selectedSkills: [],
  educationLevel: "all",
};

interface CandidateFiltersPanelProps {
  candidates: Profile[];
  filters: CandidateFilters;
  onFiltersChange: (filters: CandidateFilters) => void;
}

const educationLevels = [
  { value: "all", label: "All Levels" },
  { value: "phd", label: "PhD / Doctorate" },
  { value: "masters", label: "Master's Degree" },
  { value: "bachelors", label: "Bachelor's Degree" },
  { value: "diploma", label: "Diploma" },
];

const CandidateFiltersPanel = ({
  candidates,
  filters,
  onFiltersChange,
}: CandidateFiltersPanelProps) => {
  const [isOpen, setIsOpen] = useState(false);

  // Extract top skills from all candidates
  const topSkills = useMemo(() => {
    const skillCount = new Map<string, number>();
    candidates.forEach((c) => {
      c.skills?.forEach((skill) => {
        const normalized = skill.trim().toLowerCase();
        if (normalized) {
          skillCount.set(normalized, (skillCount.get(normalized) || 0) + 1);
        }
      });
    });
    return Array.from(skillCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([skill]) => skill);
  }, [candidates]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (filters.experienceRange[0] !== 0 || filters.experienceRange[1] !== 30) count++;
    if (filters.selectedSkills.length > 0) count++;
    if (filters.educationLevel !== "all") count++;
    return count;
  }, [filters]);

  const handleSkillToggle = (skill: string) => {
    const updated = filters.selectedSkills.includes(skill)
      ? filters.selectedSkills.filter((s) => s !== skill)
      : [...filters.selectedSkills, skill];
    onFiltersChange({ ...filters, selectedSkills: updated });
  };

  const clearFilters = () => {
    onFiltersChange(defaultFilters);
  };

  return (
    <div className="space-y-2">
      {/* Toggle Button */}
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className="gap-2"
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilterCount > 0 && (
            <Badge variant="default" className="h-5 w-5 p-0 flex items-center justify-center text-xs rounded-full">
              {activeFilterCount}
            </Badge>
          )}
          {isOpen ? <ChevronUp className="h-3 w-3" /> : <ChevronDown className="h-3 w-3" />}
        </Button>
        {activeFilterCount > 0 && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="gap-1 text-muted-foreground">
            <X className="h-3 w-3" />
            Clear
          </Button>
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
            <div className="border border-border rounded-lg p-4 bg-card space-y-5">
              {/* Experience Range Slider */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-foreground">Experience (Years)</label>
                  <span className="text-sm text-muted-foreground">
                    {filters.experienceRange[0]} – {filters.experienceRange[1]}+ yrs
                  </span>
                </div>
                <Slider
                  min={0}
                  max={30}
                  step={1}
                  value={filters.experienceRange}
                  onValueChange={(value) =>
                    onFiltersChange({ ...filters, experienceRange: value as [number, number] })
                  }
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>0 yrs</span>
                  <span>15 yrs</span>
                  <span>30+ yrs</span>
                </div>
              </div>

              {/* Education Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">Education Level</label>
                <Select
                  value={filters.educationLevel}
                  onValueChange={(value) =>
                    onFiltersChange({ ...filters, educationLevel: value })
                  }
                >
                  <SelectTrigger className="w-full h-9">
                    <SelectValue placeholder="Select education level" />
                  </SelectTrigger>
                  <SelectContent>
                    {educationLevels.map((level) => (
                      <SelectItem key={level.value} value={level.value}>
                        {level.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Skills Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">
                  Skills {filters.selectedSkills.length > 0 && `(${filters.selectedSkills.length} selected)`}
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {topSkills.map((skill) => (
                    <label
                      key={skill}
                      className="flex items-center gap-1.5 cursor-pointer select-none"
                    >
                      <Checkbox
                        checked={filters.selectedSkills.includes(skill)}
                        onCheckedChange={() => handleSkillToggle(skill)}
                        className="h-3.5 w-3.5"
                      />
                      <span className="text-xs capitalize text-foreground">{skill}</span>
                    </label>
                  ))}
                  {topSkills.length === 0 && (
                    <p className="text-xs text-muted-foreground">No skills data available</p>
                  )}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default CandidateFiltersPanel;
