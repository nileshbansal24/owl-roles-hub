import { useState } from "react";
import { motion } from "framer-motion";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Filter, Users, User, X, UserSearch, Sparkles } from "lucide-react";
import CandidateCard from "./CandidateCard";
import { EmptyState } from "@/components/ui/empty-state";
import { CardListSkeleton, FilterBarSkeleton } from "@/components/ui/loading-skeleton";
import { staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import type { Profile } from "@/types/recruiter";

interface FindCandidatesTabProps {
  candidates: Profile[];
  savedCandidateIds: Set<string>;
  savedCandidateNotes: Record<string, string>;
  onViewCandidate: (candidate: Profile) => void;
  onSaveCandidate: (candidateId: string) => void;
  onMessageCandidate: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
  isLoading?: boolean;
}

const FindCandidatesTab = ({
  candidates,
  savedCandidateIds,
  savedCandidateNotes,
  onViewCandidate,
  onSaveCandidate,
  onMessageCandidate,
  onSaveNote,
  isLoading = false,
}: FindCandidatesTabProps) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [roleSearchQuery, setRoleSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      searchQuery === "" ||
      candidate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLocation =
      locationFilter === "" ||
      candidate.location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      candidate.university?.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesExperience =
      experienceFilter === "" ||
      experienceFilter === "all" ||
      (candidate.years_experience !== null && 
        (experienceFilter === "0-2" && candidate.years_experience <= 2) ||
        (experienceFilter === "3-5" && candidate.years_experience >= 3 && candidate.years_experience <= 5) ||
        (experienceFilter === "5-10" && candidate.years_experience >= 5 && candidate.years_experience <= 10) ||
        (experienceFilter === "10+" && candidate.years_experience > 10));

    return matchesSearch && matchesLocation && matchesExperience;
  });

  const clearFilters = () => {
    setSearchQuery("");
    setRoleSearchQuery("");
    setLocationFilter("");
    setExperienceFilter("");
  };

  const hasActiveFilters = searchQuery || locationFilter || experienceFilter;

  if (isLoading) {
    return (
      <div className="space-y-6">
        <FilterBarSkeleton />
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
      {/* Role-Based Search - Primary */}
      <motion.div variants={staggerItemVariants} className="card-elevated p-6 border-2 border-primary/20">
        <h3 className="font-heading font-semibold text-xl mb-2 flex items-center gap-2">
          <User className="h-5 w-5 text-primary" />
          Search by Role/Position
        </h3>
        <p className="text-sm text-muted-foreground mb-4">
          Find candidates by their current role or position (e.g., Dean-Research, Professor, HOD)
        </p>
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <Input
              placeholder="Enter role to search... (e.g., Dean-Research, Professor, HOD)"
              value={roleSearchQuery}
              onChange={(e) => setRoleSearchQuery(e.target.value)}
              className="h-12 text-base transition-shadow focus:shadow-md"
            />
          </div>
          <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
            <Button 
              className="h-12 px-8 gap-2"
              onClick={() => {
                if (roleSearchQuery.trim()) {
                  setSearchQuery(roleSearchQuery);
                }
              }}
            >
              <Search className="h-5 w-5" />
              Search Candidates
            </Button>
          </motion.div>
        </div>
        {/* Quick role suggestions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm text-muted-foreground">Quick search:</span>
          {["Dean", "Professor", "HOD", "Research", "Director", "Principal", "Lecturer"].map((role) => (
            <motion.div key={role} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Badge 
                variant="outline" 
                className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-all duration-200"
                onClick={() => {
                  setRoleSearchQuery(role);
                  setSearchQuery(role);
                }}
              >
                {role}
              </Badge>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Additional Filters */}
      <motion.div variants={staggerItemVariants} className="card-elevated p-6">
        <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
          <Filter className="h-5 w-5 text-primary" />
          Refine Your Search
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div className="md:col-span-2">
            <Input
              placeholder="Search by name, skills, keywords..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-11 transition-shadow focus:shadow-md"
            />
          </div>
          <Input
            placeholder="Location / University"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-11 transition-shadow focus:shadow-md"
          />
          <Select value={experienceFilter} onValueChange={setExperienceFilter}>
            <SelectTrigger className="h-11">
              <SelectValue placeholder="Experience" />
            </SelectTrigger>
            <SelectContent className="bg-popover">
              <SelectItem value="all">All Experience</SelectItem>
              <SelectItem value="0-2">0-2 Years</SelectItem>
              <SelectItem value="3-5">3-5 Years</SelectItem>
              <SelectItem value="5-10">5-10 Years</SelectItem>
              <SelectItem value="10+">10+ Years</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <p className="text-sm text-muted-foreground">
            Showing <span className="font-medium text-foreground">{filteredCandidates.length}</span> candidates
            {searchQuery && (
              <span> matching "<span className="text-primary font-medium">{searchQuery}</span>"</span>
            )}
          </p>
          {hasActiveFilters && (
            <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <Button 
                variant="ghost" 
                size="sm" 
                className="gap-2"
                onClick={clearFilters}
              >
                <X className="h-4 w-4" />
                Clear Filters
              </Button>
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Candidate Results */}
      <motion.div variants={staggerItemVariants} className="grid gap-4">
        {filteredCandidates.length === 0 ? (
          searchQuery || hasActiveFilters ? (
            <EmptyState
              icon={UserSearch}
              title="No matching candidates"
              description={`We couldn't find any candidates matching "${searchQuery || "your filters"}". Try adjusting your search criteria or clearing filters.`}
              action={{
                label: "Clear All Filters",
                onClick: clearFilters,
                icon: X,
              }}
            />
          ) : (
            <EmptyState
              icon={Users}
              title="No candidates available"
              description="There are no candidates in the database yet. Check back later as new professionals join the platform."
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                <Sparkles className="h-4 w-4 text-primary" />
                <span>New candidates are added daily</span>
              </div>
            </EmptyState>
          )
        ) : (
          filteredCandidates.map((candidate, index) => (
            <CandidateCard
              key={candidate.id}
              candidate={candidate}
              index={index}
              isSaved={savedCandidateIds.has(candidate.id)}
              note={savedCandidateNotes[candidate.id]}
              onView={onViewCandidate}
              onSave={onSaveCandidate}
              onMessage={onMessageCandidate}
              onSaveNote={onSaveNote}
            />
          ))
        )}
      </motion.div>
    </motion.div>
  );
};

export default FindCandidatesTab;
