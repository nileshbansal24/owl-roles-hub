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
import {
  MapPin,
  GraduationCap,
  Briefcase,
  Clock,
  Download,
  FileText,
  Mail,
  Award,
  Star,
  User,
  Building2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

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
}

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
  if (!application) return null;

  const profile = application.profiles;
  const category = getCandidateCategory(profile);
  const categoryStyles = getCategoryStyles(category);

  const handleDownloadResume = () => {
    if (profile?.resume_url) {
      window.open(profile.resume_url, "_blank");
    }
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading text-xl">Applicant Profile</DialogTitle>
        </DialogHeader>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="space-y-6"
        >
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

          {/* Bio */}
          {profile?.bio && (
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-2">About</h4>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {profile.bio}
              </p>
            </div>
          )}

          {/* Skills */}
          {profile?.skills && profile.skills.length > 0 && (
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-2">Skills</h4>
              <div className="flex flex-wrap gap-2">
                {profile.skills.map((skill, index) => (
                  <Badge key={index} variant="secondary">
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Cover Letter */}
          {application.cover_letter && (
            <div>
              <h4 className="font-heading font-semibold text-foreground mb-2">Cover Letter</h4>
              <div className="p-4 rounded-lg bg-muted/50 border">
                <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                  {application.cover_letter}
                </p>
              </div>
            </div>
          )}

          {/* Resume Section */}
          <div>
            <h4 className="font-heading font-semibold text-foreground mb-2">Resume</h4>
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

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2">
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
      </DialogContent>
    </Dialog>
  );
};

export default ApplicantDetailModal;
