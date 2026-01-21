import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ComparisonField, ComparisonSection } from "./ComparisonField";
import { ParsedResumeData, CurrentProfileData } from "./types";
import { AlertCircle, CheckCircle2 } from "lucide-react";

interface ComparisonViewProps {
  currentProfile: CurrentProfileData;
  parsedData: ParsedResumeData;
}

export function ComparisonView({ currentProfile, parsedData }: ComparisonViewProps) {
  // Helper to check if values are different
  const isDifferent = (current: string | null | undefined, parsed: string | undefined) => {
    const currentNorm = (current || "").trim().toLowerCase();
    const parsedNorm = (parsed || "").trim().toLowerCase();
    return parsedNorm !== "" && currentNorm !== parsedNorm;
  };

  const isArrayDifferent = (current: string[] | null | undefined, parsed: string[] | undefined) => {
    if (!parsed || parsed.length === 0) return false;
    if (!current || current.length === 0) return parsed.length > 0;
    return JSON.stringify([...current].sort()) !== JSON.stringify([...parsed].sort());
  };

  // Count changes
  const changes = {
    basic:
      (isDifferent(currentProfile.full_name, parsedData.full_name) ? 1 : 0) +
      (isDifferent(currentProfile.role, parsedData.role) ? 1 : 0) +
      (isDifferent(currentProfile.headline, parsedData.headline) ? 1 : 0) +
      (isDifferent(currentProfile.professional_summary, parsedData.professional_summary) ? 1 : 0) +
      (isDifferent(currentProfile.location, parsedData.location) ? 1 : 0) +
      (isDifferent(currentProfile.phone, parsedData.phone) ? 1 : 0) +
      (isDifferent(currentProfile.email, parsedData.email) ? 1 : 0),
    skills: isArrayDifferent(currentProfile.skills, parsedData.skills) ? 1 : 0,
    achievements: isArrayDifferent(currentProfile.achievements, parsedData.achievements) ? 1 : 0,
    experience: (parsedData.experience?.length || 0) > 0 ? 1 : 0,
    education: (parsedData.education?.length || 0) > 0 ? 1 : 0,
    research: (parsedData.research_papers?.length || 0) > 0 ? 1 : 0,
  };

  const totalChanges = Object.values(changes).reduce((a, b) => a + b, 0);

  const renderSkillBadges = (skills: string[] | null | undefined) => {
    if (!skills || skills.length === 0) return null;
    return (
      <div className="flex flex-wrap gap-1">
        {skills.slice(0, 8).map((skill, i) => (
          <Badge key={i} variant="secondary" className="text-xs">
            {skill}
          </Badge>
        ))}
        {skills.length > 8 && (
          <Badge variant="outline" className="text-xs">
            +{skills.length - 8} more
          </Badge>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Summary Header */}
      <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
        {totalChanges > 0 ? (
          <>
            <AlertCircle className="h-5 w-5 text-primary" />
            <span className="text-sm font-medium">
              {totalChanges} {totalChanges === 1 ? "section" : "sections"} will be updated
            </span>
          </>
        ) : (
          <>
            <CheckCircle2 className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              No changes detected
            </span>
          </>
        )}
      </div>

      <ScrollArea className="h-[50vh]">
        <div className="space-y-6 pr-4">
          {/* Basic Info Section */}
          <ComparisonSection title="Basic Information">
            <ComparisonField
              label="Full Name"
              currentValue={currentProfile.full_name}
              newValue={parsedData.full_name}
              hasChange={isDifferent(currentProfile.full_name, parsedData.full_name)}
            />
            <ComparisonField
              label="Current Role"
              currentValue={currentProfile.role}
              newValue={parsedData.role}
              hasChange={isDifferent(currentProfile.role, parsedData.role)}
            />
            <ComparisonField
              label="Headline"
              currentValue={currentProfile.headline}
              newValue={parsedData.headline}
              hasChange={isDifferent(currentProfile.headline, parsedData.headline)}
            />
            <ComparisonField
              label="Location"
              currentValue={currentProfile.location}
              newValue={parsedData.location}
              hasChange={isDifferent(currentProfile.location, parsedData.location)}
            />
            <ComparisonField
              label="Phone"
              currentValue={currentProfile.phone}
              newValue={parsedData.phone}
              hasChange={isDifferent(currentProfile.phone, parsedData.phone)}
            />
            <ComparisonField
              label="Email"
              currentValue={currentProfile.email}
              newValue={parsedData.email}
              hasChange={isDifferent(currentProfile.email, parsedData.email)}
            />
          </ComparisonSection>

          {/* Professional Summary */}
          <ComparisonSection title="Professional Summary">
            <ComparisonField
              label="Summary"
              currentValue={
                currentProfile.professional_summary ? (
                  <span className="line-clamp-3">{currentProfile.professional_summary}</span>
                ) : null
              }
              newValue={
                parsedData.professional_summary ? (
                  <span className="line-clamp-3">{parsedData.professional_summary}</span>
                ) : null
              }
              hasChange={isDifferent(currentProfile.professional_summary, parsedData.professional_summary)}
            />
          </ComparisonSection>

          {/* Skills */}
          <ComparisonSection title="Skills">
            <ComparisonField
              label="Skills"
              currentValue={renderSkillBadges(currentProfile.skills)}
              newValue={renderSkillBadges(parsedData.skills)}
              hasChange={isArrayDifferent(currentProfile.skills, parsedData.skills)}
            />
          </ComparisonSection>

          {/* Experience */}
          {(parsedData.experience?.length || 0) > 0 && (
            <ComparisonSection title="Work Experience">
              <ComparisonField
                label="Experience"
                currentValue={
                  currentProfile.experience && currentProfile.experience.length > 0 ? (
                    <span>{currentProfile.experience.length} position(s)</span>
                  ) : null
                }
                newValue={
                  <span className="text-primary">
                    {parsedData.experience?.length} position(s) extracted
                  </span>
                }
                hasChange={true}
              />
            </ComparisonSection>
          )}

          {/* Education */}
          {(parsedData.education?.length || 0) > 0 && (
            <ComparisonSection title="Education">
              <ComparisonField
                label="Education"
                currentValue={
                  currentProfile.education && currentProfile.education.length > 0 ? (
                    <span>{currentProfile.education.length} degree(s)</span>
                  ) : null
                }
                newValue={
                  <span className="text-primary">
                    {parsedData.education?.length} degree(s) extracted
                  </span>
                }
                hasChange={true}
              />
            </ComparisonSection>
          )}

          {/* Research Papers */}
          {(parsedData.research_papers?.length || 0) > 0 && (
            <ComparisonSection title="Research Papers">
              <ComparisonField
                label="Papers"
                currentValue={
                  currentProfile.research_papers && currentProfile.research_papers.length > 0 ? (
                    <span>{currentProfile.research_papers.length} paper(s)</span>
                  ) : null
                }
                newValue={
                  <span className="text-primary">
                    {parsedData.research_papers?.length} paper(s) extracted
                  </span>
                }
                hasChange={true}
              />
            </ComparisonSection>
          )}

          {/* Achievements */}
          {(parsedData.achievements?.length || 0) > 0 && (
            <ComparisonSection title="Achievements">
              <ComparisonField
                label="Achievements"
                currentValue={
                  currentProfile.achievements && currentProfile.achievements.length > 0 ? (
                    <span>{currentProfile.achievements.length} achievement(s)</span>
                  ) : null
                }
                newValue={
                  <span className="text-primary">
                    {parsedData.achievements?.length} achievement(s) extracted
                  </span>
                }
                hasChange={isArrayDifferent(currentProfile.achievements, parsedData.achievements)}
              />
            </ComparisonSection>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}
