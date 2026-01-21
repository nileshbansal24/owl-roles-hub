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
import { Linkedin, X, Plus, Check, Loader2, ExternalLink, Copy, ClipboardPaste } from "lucide-react";

interface LinkedInProfileData {
  full_name?: string;
  headline?: string;
  location?: string;
  professional_summary?: string;
  skills?: string[];
  experience?: Array<{
    title: string;
    company: string;
    location?: string;
    start_date?: string;
    end_date?: string;
    description?: string;
  }>;
  education?: Array<{
    degree: string;
    institution: string;
    field?: string;
    start_year?: string;
    end_year?: string;
  }>;
}

interface LinkedInImportModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  linkedinUrl?: string | null;
  onSave: (data: LinkedInProfileData) => void;
  saving?: boolean;
}

export function LinkedInImportModal({
  open,
  onOpenChange,
  linkedinUrl,
  onSave,
  saving = false,
}: LinkedInImportModalProps) {
  const [step, setStep] = useState<"instructions" | "paste" | "review">("instructions");
  const [pastedData, setPastedData] = useState("");
  const [data, setData] = useState<LinkedInProfileData>({});
  const [newSkill, setNewSkill] = useState("");

  const handlePasteData = () => {
    // Parse the pasted text into structured data
    const lines = pastedData.split("\n").filter(l => l.trim());
    const parsed: LinkedInProfileData = {
      skills: [],
      experience: [],
      education: [],
    };

    // Simple parsing - users can edit in review step
    if (lines.length > 0) {
      parsed.full_name = lines[0]?.trim();
    }
    if (lines.length > 1) {
      parsed.headline = lines[1]?.trim();
    }
    if (lines.length > 2) {
      parsed.location = lines[2]?.trim();
    }
    if (lines.length > 3) {
      parsed.professional_summary = lines.slice(3).join(" ").trim().substring(0, 500);
    }

    setData(parsed);
    setStep("review");
  };

  const updateField = <K extends keyof LinkedInProfileData>(
    field: K,
    value: LinkedInProfileData[K]
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
    updateField("skills", (data.skills || []).filter((_, i) => i !== index));
  };

  const addExperience = () => {
    updateField("experience", [...(data.experience || []), { title: "", company: "" }]);
  };

  const updateExperience = (index: number, field: string, value: string) => {
    const updated = [...(data.experience || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField("experience", updated);
  };

  const removeExperience = (index: number) => {
    updateField("experience", (data.experience || []).filter((_, i) => i !== index));
  };

  const addEducation = () => {
    updateField("education", [...(data.education || []), { degree: "", institution: "" }]);
  };

  const updateEducation = (index: number, field: string, value: string) => {
    const updated = [...(data.education || [])];
    updated[index] = { ...updated[index], [field]: value };
    updateField("education", updated);
  };

  const removeEducation = (index: number) => {
    updateField("education", (data.education || []).filter((_, i) => i !== index));
  };

  const handleClose = () => {
    setStep("instructions");
    setPastedData("");
    setData({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle className="flex items-center gap-2">
            <Linkedin className="h-5 w-5 text-[#0A66C2]" />
            Import from LinkedIn
          </DialogTitle>
          <DialogDescription>
            {step === "instructions" && "Follow the steps below to import your LinkedIn profile data."}
            {step === "paste" && "Paste your LinkedIn profile information below."}
            {step === "review" && "Review and edit the imported data before saving."}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          {step === "instructions" && (
            <div className="space-y-6 py-4">
              <div className="bg-muted/50 rounded-lg p-4 space-y-4">
                <h3 className="font-semibold text-sm">How to copy your LinkedIn data:</h3>
                <ol className="space-y-3 text-sm text-muted-foreground">
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">1</span>
                    <span>Open your LinkedIn profile in a new tab</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">2</span>
                    <span>Select and copy your name, headline, location, and about section</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">3</span>
                    <span>Click "Continue" and paste the copied text</span>
                  </li>
                  <li className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-medium">4</span>
                    <span>Review and edit the parsed information</span>
                  </li>
                </ol>
              </div>

              {linkedinUrl && (
                <Button
                  variant="outline"
                  className="w-full gap-2"
                  onClick={() => window.open(linkedinUrl, "_blank")}
                >
                  <ExternalLink className="h-4 w-4" />
                  Open Your LinkedIn Profile
                </Button>
              )}

              <Button
                variant="outline"
                className="w-full gap-2"
                onClick={() => window.open("https://www.linkedin.com/in/", "_blank")}
              >
                <Linkedin className="h-4 w-4" />
                Go to LinkedIn
              </Button>
            </div>
          )}

          {step === "paste" && (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="pastedData">Paste your LinkedIn profile text here</Label>
                <Textarea
                  id="pastedData"
                  value={pastedData}
                  onChange={(e) => setPastedData(e.target.value)}
                  placeholder="Paste your name, headline, location, and about section from LinkedIn..."
                  rows={10}
                  className="font-mono text-sm"
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Tip: Copy your profile header section including your name, title, location, and summary.
              </p>
            </div>
          )}

          {step === "review" && (
            <Tabs defaultValue="basic" className="w-full py-4">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="basic">Basic Info</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
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
                    <Label htmlFor="location">Location</Label>
                    <Input
                      id="location"
                      value={data.location || ""}
                      onChange={(e) => updateField("location", e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="headline">Headline</Label>
                  <Input
                    id="headline"
                    value={data.headline || ""}
                    onChange={(e) => updateField("headline", e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="professional_summary">About / Summary</Label>
                  <Textarea
                    id="professional_summary"
                    value={data.professional_summary || ""}
                    onChange={(e) => updateField("professional_summary", e.target.value)}
                    rows={4}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Skills</Label>
                  <div className="flex flex-wrap gap-2 mb-2">
                    {(data.skills || []).map((skill, index) => (
                      <Badge key={index} variant="secondary" className="gap-1">
                        {skill}
                        <button onClick={() => removeSkill(index)} className="ml-1 hover:text-destructive">
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
              </TabsContent>

              <TabsContent value="experience" className="space-y-4">
                {(data.experience || []).map((exp, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <button onClick={() => removeExperience(index)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Job Title</Label>
                        <Input value={exp.title || ""} onChange={(e) => updateExperience(index, "title", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Company</Label>
                        <Input value={exp.company || ""} onChange={(e) => updateExperience(index, "company", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Location</Label>
                        <Input value={exp.location || ""} onChange={(e) => updateExperience(index, "location", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Date</Label>
                        <Input value={exp.start_date || ""} onChange={(e) => updateExperience(index, "start_date", e.target.value)} placeholder="e.g., Jan 2020" />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Date</Label>
                        <Input value={exp.end_date || ""} onChange={(e) => updateExperience(index, "end_date", e.target.value)} placeholder="Present" />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">Description</Label>
                      <Textarea value={exp.description || ""} onChange={(e) => updateExperience(index, "description", e.target.value)} rows={2} />
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full gap-2" onClick={addExperience}>
                  <Plus className="h-4 w-4" />
                  Add Experience
                </Button>
              </TabsContent>

              <TabsContent value="education" className="space-y-4">
                {(data.education || []).map((edu, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-3 relative">
                    <button onClick={() => removeEducation(index)} className="absolute top-2 right-2 text-muted-foreground hover:text-destructive">
                      <X className="h-4 w-4" />
                    </button>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Degree</Label>
                        <Input value={edu.degree || ""} onChange={(e) => updateEducation(index, "degree", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Institution</Label>
                        <Input value={edu.institution || ""} onChange={(e) => updateEducation(index, "institution", e.target.value)} />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs">Field of Study</Label>
                        <Input value={edu.field || ""} onChange={(e) => updateEducation(index, "field", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">Start Year</Label>
                        <Input value={edu.start_year || ""} onChange={(e) => updateEducation(index, "start_year", e.target.value)} />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs">End Year</Label>
                        <Input value={edu.end_year || ""} onChange={(e) => updateEducation(index, "end_year", e.target.value)} />
                      </div>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full gap-2" onClick={addEducation}>
                  <Plus className="h-4 w-4" />
                  Add Education
                </Button>
              </TabsContent>
            </Tabs>
          )}
        </ScrollArea>

        <DialogFooter className="px-6 py-4 border-t">
          {step === "instructions" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={() => setStep("paste")} className="gap-2">
                <ClipboardPaste className="h-4 w-4" />
                Continue to Paste
              </Button>
            </>
          )}

          {step === "paste" && (
            <>
              <Button variant="outline" onClick={() => setStep("instructions")}>
                Back
              </Button>
              <Button onClick={handlePasteData} disabled={!pastedData.trim()} className="gap-2">
                <Check className="h-4 w-4" />
                Parse Data
              </Button>
            </>
          )}

          {step === "review" && (
            <>
              <Button variant="outline" onClick={() => setStep("paste")}>
                Back
              </Button>
              <Button onClick={() => onSave(data)} disabled={saving}>
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
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default LinkedInImportModal;
