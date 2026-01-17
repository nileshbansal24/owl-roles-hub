import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import {
  MapPin,
  GraduationCap,
  Briefcase,
  Clock,
  Download,
  FileText,
  Award,
  Star,
  User,
  Building2,
  BookOpen,
  Trophy,
  Lightbulb,
  Tag,
  Printer,
  MessageSquare,
  Plus,
  Trash2,
  Loader2,
  StickyNote,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface RecruiterNote {
  id: string;
  note: string;
  created_at: string;
  updated_at: string;
}

interface ExperienceItem {
  year: string;
  role: string;
  institution: string;
  description: string;
  isCurrent: boolean;
}

interface EducationItem {
  degree: string;
  institution: string;
  years: string;
}

interface ResearchPaper {
  title: string;
  authors: string;
  date: string;
}

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  role: string | null;
  bio: string | null;
  years_experience: number | null;
  location: string | null;
  headline: string | null;
  skills: string[] | null;
  user_type: string | null;
  resume_url?: string | null;
  // Note: phone field intentionally excluded for recruiter privacy
  experience?: ExperienceItem[] | null;
  education?: EducationItem[] | null;
  research_papers?: ResearchPaper[] | null;
  achievements?: string[] | null;
  subjects?: string[] | null;
  teaching_philosophy?: string | null;
  professional_summary?: string | null;
}

// HTML escape function to prevent XSS attacks
const escapeHtml = (text: string | null | undefined): string => {
  if (!text) return '';
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
};

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string | null;
  status: string;
  created_at: string;
  jobs: {
    title: string;
    institute: string;
  };
  profiles: Profile | null;
}

interface ApplicantDetailModalProps {
  application: Application | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStatusUpdate: (appId: string, status: string) => void;
}

type CategoryType = "gold" | "silver" | "bronze" | "fresher";

const getCandidateCategory = (profile: Profile | null): CategoryType => {
  if (!profile) return "fresher";
  
  const role = profile.role?.toLowerCase() || "";
  const headline = profile.headline?.toLowerCase() || "";
  const experience = profile.years_experience || 0;
  const combinedText = `${role} ${headline}`;
  
  // Gold: HOD, Dean, VC, PVC (higher authority)
  const goldKeywords = ["hod", "head of department", "dean", "vice chancellor", "vc", "pvc", "pro vice chancellor", "director", "principal", "registrar"];
  if (goldKeywords.some(keyword => combinedText.includes(keyword))) {
    return "gold";
  }
  
  // Silver: Professors, Managers
  const silverKeywords = ["professor", "manager", "senior lecturer", "associate professor", "coordinator", "lead", "head"];
  if (silverKeywords.some(keyword => combinedText.includes(keyword)) && !combinedText.includes("assistant")) {
    return "silver";
  }
  
  // Bronze: Assistant Professor
  const bronzeKeywords = ["assistant professor", "lecturer", "instructor", "teaching assistant", "research associate"];
  if (bronzeKeywords.some(keyword => combinedText.includes(keyword))) {
    return "bronze";
  }
  
  // If they have experience but no matching role, categorize by experience
  if (experience >= 10) return "silver";
  if (experience >= 3) return "bronze";
  
  // Fresher: No experience or entry level
  return "fresher";
};

const getCategoryStyles = (category: CategoryType) => {
  switch (category) {
    case "gold":
      return {
        bg: "bg-gradient-to-r from-yellow-400 to-amber-500",
        text: "text-yellow-900",
        border: "border-yellow-500",
        icon: <Award className="h-4 w-4" />,
        label: "Gold",
        description: "Senior Leadership",
      };
    case "silver":
      return {
        bg: "bg-gradient-to-r from-gray-300 to-slate-400",
        text: "text-gray-900",
        border: "border-gray-400",
        icon: <Star className="h-4 w-4" />,
        label: "Silver",
        description: "Professor / Manager",
      };
    case "bronze":
      return {
        bg: "bg-gradient-to-r from-orange-400 to-amber-600",
        text: "text-orange-900",
        border: "border-orange-500",
        icon: <Briefcase className="h-4 w-4" />,
        label: "Bronze",
        description: "Assistant Professor",
      };
    case "fresher":
    default:
      return {
        bg: "bg-gradient-to-r from-gray-700 to-gray-900",
        text: "text-white",
        border: "border-gray-700",
        icon: <User className="h-4 w-4" />,
        label: "Fresher",
        description: "Entry Level",
      };
  }
};

const ApplicantDetailModal = ({
  application,
  open,
  onOpenChange,
  onStatusUpdate,
}: ApplicantDetailModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Notes state
  const [notes, setNotes] = useState<RecruiterNote[]>([]);
  const [newNote, setNewNote] = useState("");
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [savingNote, setSavingNote] = useState(false);
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);
  
  // Fetch notes when modal opens
  useEffect(() => {
    const fetchNotes = async () => {
      if (!application || !open || !user) return;
      
      setLoadingNotes(true);
      const { data, error } = await supabase
        .from("recruiter_notes")
        .select("id, note, created_at, updated_at")
        .eq("application_id", application.id)
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false });
      
      if (error) {
        console.error("Error fetching notes:", error);
      } else {
        setNotes((data as RecruiterNote[]) || []);
      }
      setLoadingNotes(false);
    };
    
    fetchNotes();
  }, [application?.id, open, user]);
  
  // Reset state when modal closes
  useEffect(() => {
    if (!open) {
      setNewNote("");
    }
  }, [open]);
  
  const handleAddNote = async () => {
    if (!newNote.trim() || !application || !user) return;
    
    setSavingNote(true);
    const { data, error } = await supabase
      .from("recruiter_notes")
      .insert({
        recruiter_id: user.id,
        applicant_id: application.applicant_id,
        application_id: application.id,
        note: newNote.trim(),
      })
      .select("id, note, created_at, updated_at")
      .single();
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to save note",
        variant: "destructive",
      });
    } else if (data) {
      setNotes([data as RecruiterNote, ...notes]);
      setNewNote("");
      toast({
        title: "Note saved",
        description: "Your private note has been added.",
      });
    }
    setSavingNote(false);
  };
  
  const handleDeleteNote = async (noteId: string) => {
    setDeletingNoteId(noteId);
    const { error } = await supabase
      .from("recruiter_notes")
      .delete()
      .eq("id", noteId);
    
    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete note",
        variant: "destructive",
      });
    } else {
      setNotes(notes.filter(n => n.id !== noteId));
      toast({
        title: "Note deleted",
        description: "Your note has been removed.",
      });
    }
    setDeletingNoteId(null);
  };
  
  if (!application) return null;

  const profile = application.profiles;
  const category = getCandidateCategory(profile);
  const categoryStyles = getCategoryStyles(category);

  const handleDownloadResume = () => {
    if (profile?.resume_url) {
      window.open(profile.resume_url, "_blank");
    }
  };

  const handlePrintProfile = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    // Escape all user-controlled data to prevent XSS
    const candidateName = escapeHtml(profile?.full_name) || 'Candidate';
    const role = escapeHtml(profile?.role || profile?.headline) || 'Academic Professional';
    const avatarInitials = escapeHtml(profile?.full_name?.slice(0, 2).toUpperCase()) || 'U';
    
    // Validate avatar URL - only allow http/https URLs
    const isValidUrl = (url: string | null | undefined): boolean => {
      if (!url) return false;
      try {
        const parsed = new URL(url);
        return parsed.protocol === 'http:' || parsed.protocol === 'https:';
      } catch {
        return false;
      }
    };
    
    const safeAvatarUrl = isValidUrl(profile?.avatar_url) ? profile?.avatar_url : null;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${candidateName} - Profile</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              padding: 40px;
              color: #1a1a1a;
              line-height: 1.6;
            }
            .header { 
              display: flex; 
              align-items: center; 
              gap: 20px; 
              margin-bottom: 30px;
              padding-bottom: 20px;
              border-bottom: 2px solid #e5e7eb;
            }
            .avatar { 
              width: 80px; 
              height: 80px; 
              border-radius: 50%; 
              background: #3b82f6;
              display: flex;
              align-items: center;
              justify-content: center;
              color: white;
              font-size: 28px;
              font-weight: bold;
            }
            .avatar img { width: 100%; height: 100%; border-radius: 50%; object-fit: cover; }
            .name { font-size: 24px; font-weight: bold; color: #1a1a1a; }
            .role { color: #3b82f6; font-size: 16px; margin-top: 4px; }
            .meta { color: #6b7280; font-size: 14px; margin-top: 8px; }
            .category { 
              display: inline-block;
              padding: 4px 12px;
              border-radius: 20px;
              font-size: 12px;
              font-weight: 600;
              margin-bottom: 20px;
            }
            .category-gold { background: #fbbf24; color: #78350f; }
            .category-silver { background: #d1d5db; color: #1f2937; }
            .category-bronze { background: #fb923c; color: #7c2d12; }
            .category-fresher { background: #374151; color: white; }
            .section { margin-bottom: 25px; }
            .section-title { 
              font-size: 16px; 
              font-weight: 600; 
              color: #1a1a1a; 
              margin-bottom: 12px;
              padding-bottom: 6px;
              border-bottom: 1px solid #e5e7eb;
            }
            .section-content { color: #4b5563; font-size: 14px; }
            .badge { 
              display: inline-block; 
              background: #f3f4f6; 
              padding: 4px 10px; 
              border-radius: 6px; 
              margin: 2px;
              font-size: 12px;
            }
            .timeline-item { 
              padding-left: 16px; 
              border-left: 2px solid #e5e7eb; 
              margin-bottom: 16px;
              padding-bottom: 8px;
            }
            .timeline-role { font-weight: 600; color: #1a1a1a; }
            .timeline-institution { color: #3b82f6; font-size: 14px; }
            .timeline-year { color: #9ca3af; font-size: 12px; }
            .timeline-desc { color: #6b7280; font-size: 13px; margin-top: 4px; }
            .edu-item, .paper-item { 
              background: #f9fafb; 
              padding: 12px; 
              border-radius: 8px; 
              margin-bottom: 10px;
            }
            .achievement-item { 
              display: flex; 
              align-items: flex-start; 
              gap: 8px; 
              margin-bottom: 8px; 
              font-size: 14px;
            }
            .achievement-icon { color: #f59e0b; }
            .applied-for {
              background: #f3f4f6;
              padding: 12px;
              border-radius: 8px;
              margin-bottom: 20px;
            }
            @media print {
              body { padding: 20px; }
            }
          </style>
        </head>
        <body>
          <div class="category category-${category}">${escapeHtml(categoryStyles.label)} • ${escapeHtml(categoryStyles.description)}</div>
          
          <div class="header">
            <div class="avatar">
              ${safeAvatarUrl ? `<img src="${safeAvatarUrl}" />` : avatarInitials}
            </div>
            <div>
              <div class="name">${candidateName}</div>
              <div class="role">${role}</div>
              <div class="meta">
                ${profile?.university ? `🎓 ${escapeHtml(profile.university)} • ` : ''}
                ${profile?.location ? `📍 ${escapeHtml(profile.location)} • ` : ''}
                ${profile?.years_experience ? `💼 ${profile.years_experience} Years Experience` : ''}
              </div>
            </div>
          </div>

          <div class="applied-for">
            <strong>Applied For:</strong> ${escapeHtml(application.jobs.title)} at ${escapeHtml(application.jobs.institute)}
          </div>

          ${(profile?.bio || profile?.professional_summary) ? `
            <div class="section">
              <div class="section-title">Professional Summary</div>
              <div class="section-content">${escapeHtml(profile.professional_summary || profile.bio)}</div>
            </div>
          ` : ''}

          ${profile?.teaching_philosophy ? `
            <div class="section">
              <div class="section-title">Teaching Philosophy</div>
              <div class="section-content">${escapeHtml(profile.teaching_philosophy)}</div>
            </div>
          ` : ''}

          ${Array.isArray(profile?.experience) && profile.experience.length > 0 ? `
            <div class="section">
              <div class="section-title">Work Experience</div>
              ${profile.experience.map((exp: any) => `
                <div class="timeline-item">
                  <div class="timeline-role">${escapeHtml(exp.role)}</div>
                  <div class="timeline-institution">${escapeHtml(exp.institution)}</div>
                  <div class="timeline-year">${escapeHtml(exp.year)}${exp.isCurrent ? ' (Current)' : ''}</div>
                  ${exp.description ? `<div class="timeline-desc">${escapeHtml(exp.description)}</div>` : ''}
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${Array.isArray(profile?.education) && profile.education.length > 0 ? `
            <div class="section">
              <div class="section-title">Education</div>
              ${profile.education.map((edu: any) => `
                <div class="edu-item">
                  <strong>${escapeHtml(edu.degree)}</strong><br/>
                  <span style="color: #3b82f6">${escapeHtml(edu.institution)}</span><br/>
                  <span style="color: #9ca3af; font-size: 12px">${escapeHtml(edu.years)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${Array.isArray(profile?.research_papers) && profile.research_papers.length > 0 ? `
            <div class="section">
              <div class="section-title">Research Papers (${profile.research_papers.length})</div>
              ${profile.research_papers.map((paper: any) => `
                <div class="paper-item">
                  <strong>${escapeHtml(paper.title)}</strong><br/>
                  <span style="color: #6b7280; font-size: 12px">${escapeHtml(paper.authors)}</span><br/>
                  <span style="color: #3b82f6; font-size: 12px">${escapeHtml(paper.date)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${Array.isArray(profile?.achievements) && profile.achievements.length > 0 ? `
            <div class="section">
              <div class="section-title">Achievements & Awards</div>
              ${profile.achievements.map((a: string) => `
                <div class="achievement-item">
                  <span class="achievement-icon">🏆</span>
                  <span>${escapeHtml(a)}</span>
                </div>
              `).join('')}
            </div>
          ` : ''}

          ${Array.isArray(profile?.subjects) && profile.subjects.length > 0 ? `
            <div class="section">
              <div class="section-title">Subjects Taught</div>
              <div>${profile.subjects.map((s: string) => `<span class="badge">${escapeHtml(s)}</span>`).join('')}</div>
            </div>
          ` : ''}

          ${Array.isArray(profile?.skills) && profile.skills.length > 0 ? `
            <div class="section">
              <div class="section-title">Skills</div>
              <div>${profile.skills.map((s: string) => `<span class="badge">${escapeHtml(s)}</span>`).join('')}</div>
            </div>
          ` : ''}

          ${application.cover_letter ? `
            <div class="section">
              <div class="section-title">Cover Letter</div>
              <div class="section-content" style="white-space: pre-wrap;">${escapeHtml(application.cover_letter)}</div>
            </div>
          ` : ''}

          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb; color: #9ca3af; font-size: 12px; text-align: center;">
            Generated from Candidate Profile • ${new Date().toLocaleDateString()}
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/30";
      case "reviewed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/30";
      case "shortlisted":
        return "bg-green-500/10 text-green-600 border-green-500/30";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/30";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  // Parse JSON fields safely
  const experience: ExperienceItem[] = Array.isArray(profile?.experience) ? profile.experience : [];
  const education: EducationItem[] = Array.isArray(profile?.education) ? profile.education : [];
  const researchPapers: ResearchPaper[] = Array.isArray(profile?.research_papers) ? profile.research_papers : [];
  const achievements: string[] = Array.isArray(profile?.achievements) ? profile.achievements : [];
  const subjects: string[] = Array.isArray(profile?.subjects) ? profile.subjects : [];

  // Calculate profile completeness
  const profileFields = [
    { name: "Full Name", filled: !!profile?.full_name },
    { name: "Photo", filled: !!profile?.avatar_url },
    { name: "Role/Headline", filled: !!(profile?.role || profile?.headline) },
    { name: "University", filled: !!profile?.university },
    { name: "Location", filled: !!profile?.location },
    { name: "Professional Summary", filled: !!(profile?.bio || profile?.professional_summary) },
    { name: "Work Experience", filled: experience.length > 0 },
    { name: "Education", filled: education.length > 0 },
    { name: "Skills", filled: (profile?.skills?.length || 0) > 0 },
    { name: "Resume", filled: !!profile?.resume_url },
    { name: "Research Papers", filled: researchPapers.length > 0 },
    { name: "Achievements", filled: achievements.length > 0 },
  ];
  const filledFields = profileFields.filter(f => f.filled).length;
  const completenessPercent = Math.round((filledFields / profileFields.length) * 100);
  
  const getCompletenessColor = (percent: number) => {
    if (percent >= 80) return "text-green-600";
    if (percent >= 50) return "text-amber-600";
    return "text-red-600";
  };
  
  const getProgressColor = (percent: number) => {
    if (percent >= 80) return "bg-green-500";
    if (percent >= 50) return "bg-amber-500";
    return "bg-red-500";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] p-0 overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-2 flex flex-row items-center justify-between">
          <DialogTitle className="font-heading text-xl">Applicant Profile</DialogTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handlePrintProfile}
            className="gap-2 mr-8"
          >
            <Printer className="h-4 w-4" />
            Export PDF
          </Button>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-100px)] px-6 pb-6">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="space-y-6"
          >
            {/* Profile Completeness Indicator */}
            <div className="p-4 rounded-lg bg-muted/50 border">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-sm font-medium text-foreground">Profile Completeness</h4>
                <span className={`text-lg font-bold ${getCompletenessColor(completenessPercent)}`}>
                  {completenessPercent}%
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completenessPercent}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                  className={`h-full rounded-full ${getProgressColor(completenessPercent)}`}
                />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {profileFields.map((field) => (
                  <div key={field.name} className="flex items-center gap-1.5 text-xs">
                    {field.filled ? (
                      <CheckCircle2 className="h-3.5 w-3.5 text-green-500 flex-shrink-0" />
                    ) : (
                      <Circle className="h-3.5 w-3.5 text-muted-foreground/50 flex-shrink-0" />
                    )}
                    <span className={field.filled ? "text-foreground" : "text-muted-foreground"}>
                      {field.name}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Category Badge */}
            <div className="flex justify-center">
              <div className={`inline-flex items-center gap-2 px-4 py-2 rounded-full ${categoryStyles.bg} ${categoryStyles.text} shadow-lg`}>
                {categoryStyles.icon}
                <span className="font-bold">{categoryStyles.label}</span>
                <span className="text-sm opacity-80">• {categoryStyles.description}</span>
              </div>
            </div>

            {/* Profile Header */}
            <div className="flex items-start gap-4">
              <Avatar className="h-20 w-20 border-4 border-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-heading font-bold">
                  {profile?.full_name?.slice(0, 2).toUpperCase() || "U"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-heading font-bold text-xl text-foreground">
                      {profile?.full_name || "Anonymous"}
                    </h3>
                    <p className="text-primary font-medium">
                      {profile?.role || profile?.headline || "Academic Professional"}
                    </p>
                  </div>
                  <Badge className={getStatusColor(application.status)}>
                    {application.status}
                  </Badge>
                </div>
                
                <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                  {profile?.university && (
                    <div className="flex items-center gap-1">
                      <GraduationCap className="h-4 w-4" />
                      <span>{profile.university}</span>
                    </div>
                  )}
                  {profile?.location && (
                    <div className="flex items-center gap-1">
                      <MapPin className="h-4 w-4" />
                      <span>{profile.location}</span>
                    </div>
                  )}
                  {profile?.years_experience !== null && profile?.years_experience !== undefined && (
                    <div className="flex items-center gap-1">
                      <Briefcase className="h-4 w-4" />
                      <span>{profile.years_experience} Years Experience</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <Separator />

            {/* Applied For */}
            <div className="p-4 rounded-lg bg-secondary/50">
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                <Building2 className="h-4 w-4" />
                Applied For
              </div>
              <p className="font-medium text-foreground">{application.jobs.title}</p>
              <p className="text-sm text-muted-foreground">{application.jobs.institute}</p>
              <p className="text-xs text-muted-foreground mt-1">
                <Clock className="h-3 w-3 inline mr-1" />
                {formatDistanceToNow(new Date(application.created_at), { addSuffix: true })}
              </p>
            </div>

            {/* Professional Summary / Bio */}
            {(profile?.bio || profile?.professional_summary) && (
              <div>
                <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                  <User className="h-4 w-4 text-primary" />
                  Professional Summary
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.professional_summary || profile.bio}
                </p>
              </div>
            )}

            {/* Teaching Philosophy */}
            {profile?.teaching_philosophy && (
              <div>
                <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                  <Lightbulb className="h-4 w-4 text-primary" />
                  Teaching Philosophy
                </h4>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {profile.teaching_philosophy}
                </p>
              </div>
            )}

            {/* Work Experience - Always show */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <Briefcase className="h-4 w-4 text-primary" />
                Work Experience
              </h4>
              {experience.length > 0 ? (
                <div className="space-y-4">
                  {experience.map((exp, index) => (
                    <div key={index} className="relative pl-6 pb-4 border-l-2 border-primary/20 last:pb-0">
                      <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-primary/20 border-2 border-primary" />
                      <div className="flex items-start justify-between">
                        <div>
                          <h5 className="font-medium text-foreground">{exp.role}</h5>
                          <p className="text-sm text-primary">{exp.institution}</p>
                          {exp.description && (
                            <p className="text-sm text-muted-foreground mt-1">{exp.description}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                            {exp.year}
                          </span>
                          {exp.isCurrent && (
                            <Badge variant="secondary" className="text-xs">Current</Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not provided by candidate</p>
              )}
            </div>

            {/* Education - Always show */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <GraduationCap className="h-4 w-4 text-primary" />
                Education
              </h4>
              {education.length > 0 ? (
                <div className="space-y-3">
                  {education.map((edu, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50 border">
                      <h5 className="font-medium text-foreground">{edu.degree}</h5>
                      <p className="text-sm text-primary">{edu.institution}</p>
                      <p className="text-xs text-muted-foreground">{edu.years}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not provided by candidate</p>
              )}
            </div>

            {/* Research Papers - Always show */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-primary" />
                Research Papers {researchPapers.length > 0 && `(${researchPapers.length})`}
              </h4>
              {researchPapers.length > 0 ? (
                <div className="space-y-3">
                  {researchPapers.map((paper, index) => (
                    <div key={index} className="p-3 rounded-lg bg-muted/50 border">
                      <h5 className="font-medium text-foreground text-sm">{paper.title}</h5>
                      <p className="text-xs text-muted-foreground">{paper.authors}</p>
                      <p className="text-xs text-primary mt-1">{paper.date}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not provided by candidate</p>
              )}
            </div>

            {/* Achievements - Always show */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <Trophy className="h-4 w-4 text-primary" />
                Achievements & Awards
              </h4>
              {achievements.length > 0 ? (
                <ul className="space-y-2">
                  {achievements.map((achievement, index) => (
                    <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Award className="h-4 w-4 text-amber-500 flex-shrink-0 mt-0.5" />
                      <span>{achievement}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not provided by candidate</p>
              )}
            </div>

            {/* Subjects Taught - Always show */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                <Tag className="h-4 w-4 text-primary" />
                Subjects Taught
              </h4>
              {subjects.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {subjects.map((subject, index) => (
                    <Badge key={index} variant="outline" className="bg-primary/5">
                      {subject}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not provided by candidate</p>
              )}
            </div>

            {/* Skills - Always show */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                <Star className="h-4 w-4 text-primary" />
                Skills
              </h4>
              {profile?.skills && profile.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {profile.skills.map((skill, index) => (
                    <Badge key={index} variant="secondary">
                      {skill}
                    </Badge>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground italic">Not provided by candidate</p>
              )}
            </div>

            {/* Cover Letter */}
            {application.cover_letter && (
              <div>
                <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" />
                  Cover Letter
                </h4>
                <div className="p-4 rounded-lg bg-muted/50 border">
                  <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {application.cover_letter}
                  </p>
                </div>
              </div>
            )}

            {/* Resume Section */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-2 flex items-center gap-2">
                <FileText className="h-4 w-4 text-primary" />
                Resume
              </h4>
              {profile?.resume_url ? (
                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Resume Available</p>
                      <p className="text-xs text-muted-foreground">Click to view or download</p>
                    </div>
                  </div>
                  <Button onClick={handleDownloadResume} className="gap-2">
                    <Download className="h-4 w-4" />
                    Download
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed text-center">
                  <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No resume uploaded</p>
                </div>
              )}
            </div>

            <Separator />

            {/* Private Notes Section */}
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-3 flex items-center gap-2">
                <StickyNote className="h-4 w-4 text-primary" />
                Private Notes
                <Badge variant="secondary" className="text-xs ml-2">Only visible to you</Badge>
              </h4>
              
              {/* Add new note */}
              <div className="space-y-2 mb-4">
                <Textarea
                  placeholder="Add a private note about this applicant..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  className="min-h-[80px] resize-none"
                />
                <Button 
                  onClick={handleAddNote} 
                  disabled={!newNote.trim() || savingNote}
                  size="sm"
                  className="gap-2"
                >
                  {savingNote ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Plus className="h-4 w-4" />
                  )}
                  Add Note
                </Button>
              </div>
              
              {/* Notes list */}
              {loadingNotes ? (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                </div>
              ) : notes.length === 0 ? (
                <div className="p-4 rounded-lg bg-muted/50 border border-dashed text-center">
                  <MessageSquare className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                  <p className="text-sm text-muted-foreground">No notes yet. Add your first note above.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {notes.map((note) => (
                    <div key={note.id} className="p-3 rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-foreground whitespace-pre-wrap flex-1">
                          {note.note}
                        </p>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-muted-foreground hover:text-destructive shrink-0"
                          onClick={() => handleDeleteNote(note.id)}
                          disabled={deletingNoteId === note.id}
                        >
                          {deletingNoteId === note.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        {formatDistanceToNow(new Date(note.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-2 sticky bottom-0 bg-background py-2">
              <Button
                variant="outline"
                onClick={() => onStatusUpdate(application.id, "reviewed")}
                disabled={application.status === "reviewed"}
              >
                Mark Reviewed
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => onStatusUpdate(application.id, "shortlisted")}
                disabled={application.status === "shortlisted"}
              >
                Shortlist
              </Button>
              <Button
                variant="destructive"
                onClick={() => onStatusUpdate(application.id, "rejected")}
                disabled={application.status === "rejected"}
              >
                Reject
              </Button>
            </div>
          </motion.div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};

export default ApplicantDetailModal;
