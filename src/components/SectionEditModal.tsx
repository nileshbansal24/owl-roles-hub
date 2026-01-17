import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Trash2, Loader2 } from "lucide-react";

interface SectionEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  section: string;
  data: any;
  onSave: (section: string, data: any) => void;
}

const SectionEditModal = ({
  open,
  onOpenChange,
  section,
  data,
  onSave,
}: SectionEditModalProps) => {
  const [formData, setFormData] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data) {
      setFormData(Array.isArray(data) ? [...data] : data);
    }
  }, [data, open]);

  const handleSave = () => {
    setSaving(true);
    setTimeout(() => {
      onSave(section, formData);
      setSaving(false);
      onOpenChange(false);
    }, 500);
  };

  const addItem = () => {
    if (section === "experience") {
      setFormData([
        ...formData,
        { year: "", role: "", institution: "", description: "", isCurrent: false },
      ]);
    } else if (section === "research") {
      setFormData([...formData, { title: "", authors: "", date: "" }]);
    } else if (section === "education") {
      setFormData([...formData, { degree: "", institution: "", years: "" }]);
    } else if (section === "subjects" || section === "skills" || section === "achievements") {
      setFormData([...formData, ""]);
    }
  };

  const removeItem = (index: number) => {
    setFormData(formData.filter((_: any, i: number) => i !== index));
  };

  const updateItem = (index: number, field: string, value: any) => {
    const updated = [...formData];
    if (typeof updated[index] === "string") {
      updated[index] = value;
    } else {
      updated[index] = { ...updated[index], [field]: value };
    }
    setFormData(updated);
  };

  const getSectionTitle = () => {
    switch (section) {
      case "experience": return "Edit Work Experience";
      case "research": return "Edit Research Papers";
      case "education": return "Edit Education";
      case "subjects": return "Edit Subjects Taught";
      case "skills": return "Edit Skills";
      case "achievements": return "Edit Achievements";
      case "teaching": return "Edit Teaching Philosophy";
      default: return "Edit Section";
    }
  };

  const renderForm = () => {
    if (!formData) return null;

    if (section === "teaching") {
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Teaching Philosophy</Label>
            <Textarea
              value={formData}
              onChange={(e) => setFormData(e.target.value)}
              rows={6}
              placeholder="Describe your teaching philosophy..."
            />
          </div>
        </div>
      );
    }

    if (section === "experience") {
      return (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {formData.map((item: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-secondary/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Experience {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Role/Title</Label>
                  <Input
                    value={item.role}
                    onChange={(e) => updateItem(index, "role", e.target.value)}
                    placeholder="Assistant Professor"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Duration</Label>
                  <Input
                    value={item.year}
                    onChange={(e) => updateItem(index, "year", e.target.value)}
                    placeholder="2020 - Present"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={item.institution}
                  onChange={(e) => updateItem(index, "institution", e.target.value)}
                  placeholder="University Name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Describe your responsibilities..."
                  rows={2}
                />
              </div>
            </motion.div>
          ))}
          <Button variant="outline" onClick={addItem} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Experience
          </Button>
        </div>
      );
    }

    if (section === "research") {
      return (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {formData.map((item: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-secondary/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Paper {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={item.title}
                  onChange={(e) => updateItem(index, "title", e.target.value)}
                  placeholder="Paper title"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Authors</Label>
                  <Input
                    value={item.authors}
                    onChange={(e) => updateItem(index, "authors", e.target.value)}
                    placeholder="Author names"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Date</Label>
                  <Input
                    value={item.date}
                    onChange={(e) => updateItem(index, "date", e.target.value)}
                    placeholder="May 2021"
                  />
                </div>
              </div>
            </motion.div>
          ))}
          <Button variant="outline" onClick={addItem} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Paper
          </Button>
        </div>
      );
    }

    if (section === "education") {
      return (
        <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-2">
          {formData.map((item: any, index: number) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 rounded-lg bg-secondary/30 space-y-3"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Education {index + 1}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeItem(index)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-2">
                <Label>Degree</Label>
                <Input
                  value={item.degree}
                  onChange={(e) => updateItem(index, "degree", e.target.value)}
                  placeholder="Ph.D. in Computer Science"
                />
              </div>
              <div className="space-y-2">
                <Label>Institution</Label>
                <Input
                  value={item.institution}
                  onChange={(e) => updateItem(index, "institution", e.target.value)}
                  placeholder="Stanford University"
                />
              </div>
              <div className="space-y-2">
                <Label>Years</Label>
                <Input
                  value={item.years}
                  onChange={(e) => updateItem(index, "years", e.target.value)}
                  placeholder="2018 - 2022"
                />
              </div>
            </motion.div>
          ))}
          <Button variant="outline" onClick={addItem} className="w-full gap-2">
            <Plus className="h-4 w-4" />
            Add Education
          </Button>
        </div>
      );
    }

    // For simple string arrays (subjects, skills, achievements)
    return (
      <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
        {formData.map((item: string, index: number) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3"
          >
            <Input
              value={item}
              onChange={(e) => updateItem(index, "", e.target.value)}
              placeholder={`${section.slice(0, -1)}...`}
            />
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
              className="text-destructive hover:text-destructive shrink-0"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </motion.div>
        ))}
        <Button variant="outline" onClick={addItem} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Item
        </Button>
      </div>
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-heading">{getSectionTitle()}</DialogTitle>
        </DialogHeader>

        <div className="py-4">{renderForm()}</div>

        <div className="flex gap-3 justify-end">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Changes"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SectionEditModal;
