import { useState, useEffect } from "react";
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
import { X, Plus, Loader2, Save } from "lucide-react";

interface PersonalDetails {
  full_name?: string | null;
  family_details?: string | null;
  email?: string | null;
  phone?: string | null;
  hobbies?: string[] | null;
  quotes?: string | null;
  recommended_books?: string[] | null;
}

interface PersonalDetailsEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  data: PersonalDetails;
  onSave: (data: PersonalDetails) => Promise<void>;
}

export function PersonalDetailsEditModal({
  open,
  onOpenChange,
  data,
  onSave,
}: PersonalDetailsEditModalProps) {
  const [formData, setFormData] = useState<PersonalDetails>(data);
  const [saving, setSaving] = useState(false);
  const [newHobby, setNewHobby] = useState("");
  const [newBook, setNewBook] = useState("");

  useEffect(() => {
    if (open) {
      setFormData(data);
    }
  }, [open, data]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onSave(formData);
      onOpenChange(false);
    } finally {
      setSaving(false);
    }
  };

  const addHobby = () => {
    if (newHobby.trim()) {
      setFormData((prev) => ({
        ...prev,
        hobbies: [...(prev.hobbies || []), newHobby.trim()],
      }));
      setNewHobby("");
    }
  };

  const removeHobby = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      hobbies: (prev.hobbies || []).filter((_, i) => i !== index),
    }));
  };

  const addBook = () => {
    if (newBook.trim()) {
      setFormData((prev) => ({
        ...prev,
        recommended_books: [...(prev.recommended_books || []), newBook.trim()],
      }));
      setNewBook("");
    }
  };

  const removeBook = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      recommended_books: (prev.recommended_books || []).filter((_, i) => i !== index),
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Edit Personal Details</DialogTitle>
          <DialogDescription>
            Update your personal information, hobbies, and preferences.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] px-6">
          <div className="space-y-6 pb-4">
            {/* Basic Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="full_name">Full Name</Label>
                <Input
                  id="full_name"
                  value={formData.full_name || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="family_details">Family Details</Label>
                <Input
                  id="family_details"
                  value={formData.family_details || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, family_details: e.target.value }))
                  }
                  placeholder="e.g., Married, 2 children"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, email: e.target.value }))
                  }
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, phone: e.target.value }))
                  }
                  placeholder="+1 234 567 8900"
                />
              </div>
            </div>

            {/* Hobbies */}
            <div className="space-y-2">
              <Label>Hobbies & Interests</Label>
              <div className="flex flex-wrap gap-2 mb-2">
                {(formData.hobbies || []).map((hobby, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 pr-1">
                    {hobby}
                    <button
                      onClick={() => removeHobby(index)}
                      className="ml-1 hover:text-destructive rounded-full p-0.5"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a hobby..."
                  value={newHobby}
                  onChange={(e) => setNewHobby(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addHobby())}
                />
                <Button type="button" size="icon" variant="outline" onClick={addHobby}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Quote */}
            <div className="space-y-2">
              <Label htmlFor="quotes">Favorite Quote</Label>
              <Textarea
                id="quotes"
                value={formData.quotes || ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, quotes: e.target.value }))
                }
                placeholder="Share a quote that inspires you..."
                rows={2}
              />
            </div>

            {/* Recommended Books */}
            <div className="space-y-2">
              <Label>Recommended Books to Read</Label>
              <div className="space-y-2 mb-2">
                {(formData.recommended_books || []).map((book, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 p-2 bg-muted rounded-md"
                  >
                    <span className="flex-1 text-sm">{book}</span>
                    <button
                      onClick={() => removeBook(index)}
                      className="text-muted-foreground hover:text-destructive"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder="Add a book recommendation..."
                  value={newBook}
                  onChange={(e) => setNewBook(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addBook())}
                />
                <Button type="button" size="icon" variant="outline" onClick={addBook}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </ScrollArea>

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
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default PersonalDetailsEditModal;
