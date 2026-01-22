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
import { X, Plus, Loader2, Save, Sparkles } from "lucide-react";

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
  academicField?: string | null;
}

// Suggestions based on academic fields
const hobbySuggestions: Record<string, string[]> = {
  default: ["Reading", "Writing", "Research", "Mentoring Students", "Attending Conferences", "Peer Reviewing"],
  science: ["Scientific Writing", "Lab Experiments", "Nature Photography", "Science Communication", "Stargazing", "Gardening"],
  engineering: ["Programming", "Building Projects", "3D Printing", "Robotics", "Open Source Contributing", "Technical Blogging"],
  arts: ["Creative Writing", "Painting", "Music", "Theater", "Poetry", "Cultural Studies"],
  humanities: ["Philosophy Discussions", "Historical Research", "Language Learning", "Documentary Films", "Museum Visits", "Archival Work"],
  business: ["Business Case Studies", "Networking", "Entrepreneurship", "Stock Market Analysis", "Podcasting", "Public Speaking"],
  medicine: ["Medical Research", "Community Health", "Yoga & Meditation", "Medical Writing", "Volunteering", "Continuing Education"],
  education: ["Curriculum Development", "EdTech Exploration", "Student Counseling", "Educational Games", "Workshop Facilitation", "Child Psychology"],
  computer: ["Coding Side Projects", "Machine Learning", "Open Source", "Tech Blogging", "Hackathons", "Gaming"],
  mathematics: ["Problem Solving", "Mathematical Puzzles", "Chess", "Data Visualization", "Statistics Projects", "Tutoring"],
  law: ["Legal Research", "Moot Court", "Debate", "Constitutional Studies", "Human Rights Advocacy", "Legal Writing"],
  agriculture: ["Organic Farming", "Sustainable Agriculture", "Beekeeping", "Plant Breeding", "Agricultural Innovation", "Rural Development"],
  architecture: ["Sketching & Design", "Urban Planning", "Sustainable Design", "Model Building", "Photography", "Interior Design"],
};

const bookSuggestions: Record<string, string[]> = {
  default: ["Thinking, Fast and Slow by Daniel Kahneman", "The Structure of Scientific Revolutions by Thomas Kuhn", "Sapiens by Yuval Noah Harari"],
  science: ["A Brief History of Time by Stephen Hawking", "The Gene by Siddhartha Mukherjee", "Silent Spring by Rachel Carson", "The Selfish Gene by Richard Dawkins"],
  engineering: ["The Pragmatic Programmer by David Thomas", "Clean Code by Robert C. Martin", "Design Patterns by Gang of Four", "The Mythical Man-Month by Fred Brooks"],
  arts: ["Ways of Seeing by John Berger", "The Story of Art by E.H. Gombrich", "On Writing by Stephen King", "Bird by Bird by Anne Lamott"],
  humanities: ["Guns, Germs, and Steel by Jared Diamond", "The Republic by Plato", "Meditations by Marcus Aurelius", "Man's Search for Meaning by Viktor Frankl"],
  business: ["Good to Great by Jim Collins", "The Lean Startup by Eric Ries", "Zero to One by Peter Thiel", "Principles by Ray Dalio"],
  medicine: ["The Emperor of All Maladies by Siddhartha Mukherjee", "When Breath Becomes Air by Paul Kalanithi", "Being Mortal by Atul Gawande"],
  education: ["Pedagogy of the Oppressed by Paulo Freire", "Mindset by Carol Dweck", "The Element by Ken Robinson", "How Children Learn by John Holt"],
  computer: ["Introduction to Algorithms by CLRS", "Artificial Intelligence: A Modern Approach by Stuart Russell", "The Art of Computer Programming by Donald Knuth"],
  mathematics: ["Gödel, Escher, Bach by Douglas Hofstadter", "How to Solve It by George Pólya", "Fermat's Enigma by Simon Singh", "The Princeton Companion to Mathematics"],
  law: ["The Rule of Law by Tom Bingham", "Justice by Michael Sandel", "The Common Law by Oliver Wendell Holmes", "Law's Empire by Ronald Dworkin"],
  agriculture: ["The One-Straw Revolution by Masanobu Fukuoka", "Dirt by David Montgomery", "The Omnivore's Dilemma by Michael Pollan", "Farmers of Forty Centuries by F.H. King"],
  architecture: ["Towards a New Architecture by Le Corbusier", "A Pattern Language by Christopher Alexander", "The Architecture of Happiness by Alain de Botton", "Learning from Las Vegas by Robert Venturi"],
};

function detectField(academicField?: string | null): string {
  if (!academicField) return "default";
  const field = academicField.toLowerCase();
  
  if (field.includes("computer") || field.includes("software") || field.includes("it") || field.includes("cse") || field.includes("information technology")) return "computer";
  if (field.includes("engineer") || field.includes("mechanical") || field.includes("electrical") || field.includes("civil") || field.includes("electronics")) return "engineering";
  if (field.includes("physics") || field.includes("chemistry") || field.includes("biology") || field.includes("science") || field.includes("biotechnology")) return "science";
  if (field.includes("math") || field.includes("statistics")) return "mathematics";
  if (field.includes("medicine") || field.includes("medical") || field.includes("health") || field.includes("nursing") || field.includes("pharmacy") || field.includes("dental")) return "medicine";
  if (field.includes("business") || field.includes("management") || field.includes("mba") || field.includes("commerce") || field.includes("finance") || field.includes("accounting")) return "business";
  if (field.includes("education") || field.includes("teaching") || field.includes("pedagogy") || field.includes("b.ed") || field.includes("m.ed")) return "education";
  if (field.includes("art") || field.includes("music") || field.includes("literature") || field.includes("english") || field.includes("creative") || field.includes("fine art")) return "arts";
  if (field.includes("history") || field.includes("philosophy") || field.includes("sociology") || field.includes("psychology") || field.includes("political") || field.includes("anthropology")) return "humanities";
  if (field.includes("law") || field.includes("legal") || field.includes("llb") || field.includes("llm") || field.includes("advocate") || field.includes("judicial")) return "law";
  if (field.includes("agricult") || field.includes("agronomy") || field.includes("horticulture") || field.includes("veterinary") || field.includes("dairy") || field.includes("forestry")) return "agriculture";
  if (field.includes("architect") || field.includes("urban planning") || field.includes("interior design") || field.includes("landscape")) return "architecture";
  
  return "default";
}

export function PersonalDetailsEditModal({
  open,
  onOpenChange,
  data,
  onSave,
  academicField,
}: PersonalDetailsEditModalProps) {
  const [formData, setFormData] = useState<PersonalDetails>(data);
  const [saving, setSaving] = useState(false);
  const [newHobby, setNewHobby] = useState("");
  const [newBook, setNewBook] = useState("");

  const detectedField = detectField(academicField);
  const suggestedHobbies = hobbySuggestions[detectedField] || hobbySuggestions.default;
  const suggestedBooks = bookSuggestions[detectedField] || bookSuggestions.default;

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

  const addHobby = (hobby?: string) => {
    const hobbyToAdd = hobby || newHobby.trim();
    if (hobbyToAdd && !(formData.hobbies || []).includes(hobbyToAdd)) {
      setFormData((prev) => ({
        ...prev,
        hobbies: [...(prev.hobbies || []), hobbyToAdd],
      }));
      if (!hobby) setNewHobby("");
    }
  };

  const removeHobby = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      hobbies: (prev.hobbies || []).filter((_, i) => i !== index),
    }));
  };

  const addBook = (book?: string) => {
    const bookToAdd = book || newBook.trim();
    if (bookToAdd && !(formData.recommended_books || []).includes(bookToAdd)) {
      setFormData((prev) => ({
        ...prev,
        recommended_books: [...(prev.recommended_books || []), bookToAdd],
      }));
      if (!book) setNewBook("");
    }
  };

  const removeBook = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      recommended_books: (prev.recommended_books || []).filter((_, i) => i !== index),
    }));
  };

  // Filter out already added items from suggestions
  const availableHobbySuggestions = suggestedHobbies.filter(
    (h) => !(formData.hobbies || []).includes(h)
  );
  const availableBookSuggestions = suggestedBooks.filter(
    (b) => !(formData.recommended_books || []).includes(b)
  );

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
                  placeholder="+91 98765 43210"
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
                <Button type="button" size="icon" variant="outline" onClick={() => addHobby()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              
              {/* Quick-fill suggestions for hobbies */}
              {availableHobbySuggestions.length > 0 && (
                <div className="mt-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Quick-fill suggestions</span>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {availableHobbySuggestions.slice(0, 6).map((hobby) => (
                      <Badge
                        key={hobby}
                        variant="outline"
                        className="cursor-pointer hover:bg-primary hover:text-primary-foreground transition-colors text-xs"
                        onClick={() => addHobby(hobby)}
                      >
                        + {hobby}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
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
                <Button type="button" size="icon" variant="outline" onClick={() => addBook()}>
                  <Plus className="h-4 w-4" />
                </Button>
              </div>

              {/* Quick-fill suggestions for books */}
              {availableBookSuggestions.length > 0 && (
                <div className="mt-3 p-3 bg-secondary/30 rounded-lg border border-border/50">
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                    <Sparkles className="h-3 w-3 text-primary" />
                    <span>Popular in your field</span>
                  </div>
                  <div className="space-y-1.5">
                    {availableBookSuggestions.slice(0, 3).map((book) => (
                      <div
                        key={book}
                        className="flex items-center gap-2 p-2 bg-background rounded-md border border-border/50 cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-colors text-sm"
                        onClick={() => addBook(book)}
                      >
                        <Plus className="h-3.5 w-3.5 text-primary shrink-0" />
                        <span className="text-foreground">{book}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
