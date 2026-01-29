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
import { Search, Filter, Users, User, X } from "lucide-react";
import CandidateCard from "./CandidateCard";
import { containerVariants, itemVariants } from "@/types/recruiter";
import type { Profile } from "@/types/recruiter";

interface FindCandidatesTabProps {
  candidates: Profile[];
  savedCandidateIds: Set<string>;
  savedCandidateNotes: Record<string, string>;
  onViewCandidate: (candidate: Profile) => void;
  onSaveCandidate: (candidateId: string) => void;
  onMessageCandidate: (candidate: Profile) => void;
  onSaveNote: (candidateId: string, note: string) => Promise<void>;
}

const FindCandidatesTab = ({
  candidates,
  savedCandidateIds,
  savedCandidateNotes,
  onViewCandidate,
  onSaveCandidate,
  onMessageCandidate,
  onSaveNote,
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

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Role-Based Search - Primary */}
      <motion.div variants={itemVariants} className="card-elevated p-6 border-2 border-primary/20">
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
              className="h-12 text-base"
            />
          </div>
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
        </div>
        {/* Quick role suggestions */}
        <div className="flex flex-wrap gap-2 mt-4">
          <span className="text-sm text-muted-foreground">Quick search:</span>
          {["Dean", "Professor", "HOD", "Research", "Director", "Principal", "Lecturer"].map((role) => (
            <Badge 
              key={role}
              variant="outline" 
              className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors"
              onClick={() => {
                setRoleSearchQuery(role);
                setSearchQuery(role);
              }}
            >
              {role}
            </Badge>
          ))}
        </div>
      </motion.div>

      {/* Additional Filters */}
      <motion.div variants={itemVariants} className="card-elevated p-6">
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
              className="h-11"
            />
          </div>
          <Input
            placeholder="Location / University"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="h-11"
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
            <Button 
              variant="ghost" 
              size="sm" 
              className="gap-2"
              onClick={clearFilters}
            >
              <X className="h-4 w-4" />
              Clear Filters
            </Button>
          )}
        </div>
      </motion.div>

      {/* Candidate Results */}
      <motion.div variants={itemVariants} className="grid gap-4">
        {filteredCandidates.length === 0 ? (
          <div className="card-elevated p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground">No candidates found matching your criteria.</p>
          </div>
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
