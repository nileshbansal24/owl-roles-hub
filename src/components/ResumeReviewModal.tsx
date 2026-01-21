import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { X, Plus, Check, Loader2, GitCompare, Edit3 } from "lucide-react";
import {
  ComparisonView,
  CurrentProfileData,
  ParsedResumeData,
  ParsedExperience,
  ParsedEducation,
  ParsedResearchPaper,
} from "./resume-review";

// Re-export for backwards compatibility
export type { ParsedResumeData, ParsedExperience, ParsedEducation, ParsedResearchPaper };

interface ResumeReviewModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  parsedData: ParsedResumeData;
  currentProfile?: CurrentProfileData;
  onSave: (data: ParsedResumeData) => void;
  saving?: boolean;
}

export function ResumeReviewModal({
  open,
  onOpenChange,
  parsedData,
  currentProfile,
  onSave,
  saving = false,
}: ResumeReviewModalProps) {
  const [data, setData] = useState<ParsedResumeData>(parsedData);
  const [newSkill, setNewSkill] = useState("");
  const [newAchievement, setNewAchievement] = useState("");
  const [viewMode, setViewMode] = useState<"compare" | "edit">(
    currentProfile ? "compare" : "edit"
  );

  const updateField = <K extends keyof ParsedResumeData>(
    field: K,
    value: ParsedResumeData[K]
  ) => {
    setData((prev) => ({ ...prev, [field]: value }));
  };

  const addSkill = () => {
    if (newSkill.trim()) {
      updateField("skills", [...(data.skills || []), newSkill.trim()]);
      setNewSkill("");
    }
  };

  const removeSkill = (index: number) => {
    updateField(
      "skills",
      (data.skills || []).filter((_, i) => i !== index)
    );
  };

  const addAchievement = () => {
    if (newAchievement.trim()) {
      updateField("achievements", [...(data.achievements || []), newAchievement.trim()]);
      setNewAchievement("");
    }
  };

  const removeAchievement = (index: number) => {
    updateField(
      "achievements",
      (data.achievements || []).filter((_, i) => i !== index)
    );
  };

  const updateExperience = (index: number, field: keyof ParsedExperience, value: string | boolean) => {
    const updated = [...(data.experience || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField("experience", updated);
  };

  const removeExperience = (index: number) => {
    updateField(
      "experience",
      (data.experience || []).filter((_, i) => i !== index)
    );
  };

  const updateEducation = (index: number, field: keyof ParsedEducation, value: string) => {
    const updated = [...(data.education || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField("education", updated);
  };

  const removeEducation = (index: number) => {
    updateField(
      "education",
      (data.education || []).filter((_, i) => i !== index)
    );
  };

  const updateResearchPaper = (index: number, field: keyof ParsedResearchPaper, value: string) => {
    const updated = [...(data.research_papers || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField("research_papers", updated);
  };

  const removeResearchPaper = (index: number) => {
    updateField(
      "research_papers",
      (data.research_papers || []).filter((_, i) => i !== index)
    );
  };

  const handleSave = () => {
    onSave(data);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Review Extracted Profile Data</DialogTitle>
          <DialogDescription>
            {viewMode === "compare"
              ? "Compare your current profile with the extracted resume data."
              : "Review and edit the information extracted from your resume before saving."}
          </DialogDescription>
        </DialogHeader>

        {/* View Mode Toggle */}
        {currentProfile && (
          <div className="px-6 pb-2">
            <div className="inline-flex items-center rounded-lg border bg-muted p-1 gap-1">
              <Button
                variant={viewMode === "compare" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-2"
                onClick={() => setViewMode("compare")}
              >
                <GitCompare className="h-4 w-4" />
                Compare
              </Button>
              <Button
                variant={viewMode === "edit" ? "secondary" : "ghost"}
                size="sm"
                className="h-8 gap-2"
                onClick={() => setViewMode("edit")}
              >
                <Edit3 className="h-4 w-4" />
                Edit
              </Button>
            </div>
          </div>
        )}

        {/* Comparison View */}
        {viewMode === "compare" && currentProfile ? (
          <div className="px-6 pb-4">
            <ComparisonView
              currentProfile={currentProfile}
              parsedData={data}
            />
          </div>
        ) : (
          /* Edit View */
          <ScrollArea className="max-h-[60vh] px-6">
            <Tabs defaultValue="basic" className="w-full">
              <TabsList className="grid w-full grid-cols-4 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="research">Research</TabsTrigger>
              </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={data.full_name || ""}
                    onChange={(e) => updateField("full_name", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Current Role</Label>
                  <Input
                    id="role"
                    value={data.role || ""}
                    onChange={(e) => updateField("role", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="headline">Professional Headline</Label>
                <Input
                  id="headline"
                  value={data.headline || ""}
                  onChange={(e) => updateField("headline", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="professional_summary">Professional Summary</Label>
                <Textarea
                  id="professional_summary"
                  value={data.professional_summary || ""}
                  onChange={(e) => updateField("professional_summary", e.target.value)}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    value={data.location || ""}
                    onChange={(e) => updateField("location", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={data.phone || ""}
                    onChange={(e) => updateField("phone", e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    value={data.email || ""}
                    onChange={(e) => updateField("email", e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {(data.skills || []).map((skill, index) => (
                    <Badge key={index} variant="secondary" className="gap-1">
                      {skill}
                      <button
                        onClick={() => removeSkill(index)}
                        className="ml-1 hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSkill())}
                  />
                  <Button type="button" size="sm" onClick={addSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label>Achievements</Label>
                <div className="space-y-2 mb-2">
                  {(data.achievements || []).map((achievement, index) => (
                    <div key={index} className="flex items-start gap-2 p-2 bg-muted rounded-md">
                      <span className="flex-1 text-sm">{achievement}</span>
                      <button
                        onClick={() => removeAchievement(index)}
                        className="text-muted-foreground hover:text-destructive"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Add an achievement..."
                    value={newAchievement}
                    onChange={(e) => setNewAchievement(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addAchievement())}
                  />
                  <Button type="button" size="sm" onClick={addAchievement}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="experience" className="space-y-4">
              {(data.experience || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No experience extracted from resume.
                </p>
              ) : (
                (data.experience || []).map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <button
                      onClick={() => removeExperience(index)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Job Title</Label>
                        <Input
                          value={exp.title || ""}
                          onChange={(e) => updateExperience(index, "title", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Company</Label>
                        <Input
                          value={exp.company || ""}
                          onChange={(e) => updateExperience(index, "company", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Location</Label>
                        <Input
                          value={exp.location || ""}
                          onChange={(e) => updateExperience(index, "location", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Date</Label>
                        <Input
                          value={exp.start_date || ""}
                          onChange={(e) => updateExperience(index, "start_date", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Date</Label>
                        <Input
                          value={exp.end_date || ""}
                          onChange={(e) => updateExperience(index, "end_date", e.target.value)}
                          placeholder={exp.current ? "Present" : ""}
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea
                        value={exp.description || ""}
                        onChange={(e) => updateExperience(index, "description", e.target.value)}
                        rows={2}
                      />
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="education" className="space-y-4">
              {(data.education || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No education extracted from resume.
                </p>
              ) : (
                (data.education || []).map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <button
                      onClick={() => removeEducation(index)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Degree</Label>
                        <Input
                          value={edu.degree || ""}
                          onChange={(e) => updateEducation(index, "degree", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Institution</Label>
                        <Input
                          value={edu.institution || ""}
                          onChange={(e) => updateEducation(index, "institution", e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Field of Study</Label>
                        <Input
                          value={edu.field || ""}
                          onChange={(e) => updateEducation(index, "field", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Year</Label>
                        <Input
                          value={edu.start_year || ""}
                          onChange={(e) => updateEducation(index, "start_year", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Year</Label>
                        <Input
                          value={edu.end_year || ""}
                          onChange={(e) => updateEducation(index, "end_year", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </TabsContent>

            <TabsContent value="research" className="space-y-4">
              {(data.research_papers || []).length === 0 ? (
                <p className="text-muted-foreground text-center py-8">
                  No research papers extracted from resume.
                </p>
              ) : (
                (data.research_papers || []).map((paper, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <button
                      onClick={() => removeResearchPaper(index)}
                      className="absolute top-2 right-2 text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                    <div className="space-y-1">
                      <Label className="text-xs">Title</Label>
                      <Input
                        value={paper.title || ""}
                        onChange={(e) => updateResearchPaper(index, "title", e.target.value)}
                      />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Journal</Label>
                        <Input
                          value={paper.journal || ""}
                          onChange={(e) => updateResearchPaper(index, "journal", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Year</Label>
                        <Input
                          value={paper.year || ""}
                          onChange={(e) => updateResearchPaper(index, "year", e.target.value)}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">DOI</Label>
                        <Input
                          value={paper.doi || ""}
                          onChange={(e) => updateResearchPaper(index, "doi", e.target.value)}
                          placeholder="10.xxxx/xxxxx"
                        />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Authors</Label>
                      <Input
                        value={paper.authors || ""}
                        onChange={(e) => updateResearchPaper(index, "authors", e.target.value)}
                      />
                    </div>
                  </div>
                ))
              )}
            </TabsContent>
          </Tabs>
        </ScrollArea>
        )}

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4 mr-2" />
                Save to Profile
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
