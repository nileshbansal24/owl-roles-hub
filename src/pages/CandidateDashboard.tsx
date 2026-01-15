import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ProfileEditModal from "@/components/ProfileEditModal";
import SectionEditModal from "@/components/SectionEditModal";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import {
  CheckCircle2,
  Download,
  Building2,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  MapPin,
  Edit2,
  ExternalLink,
  Sparkles,
  Play,
  Plus,
  Loader2,
  Clock,
  Eye,
  XCircle,
  Upload,
  Camera,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
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
  resume_url: string | null;
  phone: string | null;
}

interface Application {
  id: string;
  job_id: string;
  status: string;
  created_at: string;
  jobs: {
    title: string;
    institute: string;
    location: string;
  };
}

interface ExperienceItem {
  year: string;
  role: string;
  institution: string;
  description: string;
  isCurrent: boolean;
}

interface ResearchPaper {
  title: string;
  authors: string;
  date: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const CandidateDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [sectionEditOpen, setSectionEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);

  // Editable data
  const [experienceTimeline, setExperienceTimeline] = useState<ExperienceItem[]>([
    {
      year: "Aug 2020 - Present",
      role: "Assistant Professor",
      institution: "Your University",
      description: "Teaching and research in your field of expertise.",
      isCurrent: true,
    },
  ]);

  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);

  const [skills, setSkills] = useState([
    "Research", "Teaching", "Academic Writing", "Data Analysis"
  ]);

  const [achievements, setAchievements] = useState<string[]>([]);

  const [teachingPhilosophy, setTeachingPhilosophy] = useState(
    "Add your teaching philosophy here..."
  );

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      // Fetch profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        console.error("Error fetching profile:", profileError);
      } else if (profileData) {
        setProfile(profileData);
        if (profileData.skills) setSkills(profileData.skills);
      }

      // Fetch applications
      const { data: appsData, error: appsError } = await supabase
        .from("job_applications")
        .select(`
          *,
          jobs(title, institute, location)
        `)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });

      if (appsError) {
        console.error("Error fetching applications:", appsError);
      } else {
        setApplications(appsData as unknown as Application[] || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const handleAvatarUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    setUploadingAvatar(true);

    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, avatar_url: publicUrl } : null);
      toast({ title: "Avatar updated!", description: "Your profile picture has been changed." });
    } catch (error: any) {
      toast({ title: "Upload failed", description: error.message, variant: "destructive" });
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleResumeUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document.",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload a file smaller than 10MB.",
        variant: "destructive",
      });
      return;
    }

    setUploadingResume(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `resume.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      // Upload file to storage
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(filePath);

      // Add timestamp to bust cache
      const resumeUrl = `${publicUrl}?t=${Date.now()}`;

      // Update profile with resume URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ resume_url: resumeUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile(prev => prev ? { ...prev, resume_url: resumeUrl } : null);
      
      toast({
        title: "Resume uploaded!",
        description: "Your resume has been uploaded successfully.",
      });
    } catch (error: any) {
      console.error("Error uploading resume:", error);
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload resume.",
        variant: "destructive",
      });
    } finally {
      setUploadingResume(false);
      // Reset input
      if (resumeInputRef.current) {
        resumeInputRef.current.value = '';
      }
    }
  };

  const handleDeleteResume = async () => {
    if (!user || !profile?.resume_url) return;

    try {
      // Extract file path from URL
      const urlParts = profile.resume_url.split('/resumes/');
      if (urlParts.length > 1) {
        const filePath = urlParts[1].split('?')[0];
        
        // Delete from storage
        await supabase.storage
          .from('resumes')
          .remove([filePath]);
      }

      // Update profile
      const { error } = await supabase
        .from('profiles')
        .update({ resume_url: null })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => prev ? { ...prev, resume_url: null } : null);
      
      toast({
        title: "Resume deleted",
        description: "Your resume has been removed.",
      });
    } catch (error: any) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  const openSectionEdit = (section: string) => {
    setEditingSection(section);
    setSectionEditOpen(true);
  };

  const handleSectionUpdate = (section: string, data: any) => {
    switch (section) {
      case "experience":
        setExperienceTimeline(data);
        break;
      case "research":
        setResearchPapers(data);
        break;
      case "skills":
        setSkills(data);
        break;
      case "achievements":
        setAchievements(data);
        break;
      case "teaching":
        setTeachingPhilosophy(data);
        break;
    }
    toast({ title: "Updated", description: "Your changes have been saved." });
  };

  const getInitials = (name: string | null, email: string | undefined) => {
    if (name) {
      return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
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

  const profileCompleteness = () => {
    let score = 0;
    if (profile?.full_name) score += 15;
    if (profile?.avatar_url) score += 10;
    if (profile?.bio) score += 15;
    if (profile?.university) score += 15;
    if (profile?.role) score += 15;
    if (profile?.skills && profile.skills.length > 0) score += 10;
    if (profile?.years_experience) score += 10;
    if (profile?.resume_url) score += 10;
    return score;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          >
            <Loader2 className="h-8 w-8 text-primary" />
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4">
          {/* Profile Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="card-elevated p-6 md:p-8 mb-6"
          >
            <div className="flex flex-col md:flex-row gap-6">
              <div className="flex items-start gap-4 flex-1">
                {/* Avatar with Upload */}
                <div className="relative group">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl md:text-2xl font-heading font-bold">
                      {getInitials(profile?.full_name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <label className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                    {uploadingAvatar ? (
                      <Loader2 className="h-6 w-6 text-white animate-spin" />
                    ) : (
                      <Camera className="h-6 w-6 text-white" />
                    )}
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleAvatarUpload}
                      className="hidden"
                      disabled={uploadingAvatar}
                    />
                  </label>
                  <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground border-2 border-background px-1.5 py-0.5 text-[10px]">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  </Badge>
                </div>

                <div className="flex-1">
                  <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-1">
                    {profile?.full_name || user?.email?.split("@")[0] || "Your Name"}
                  </h1>
                  <p className="text-sm text-muted-foreground mb-2">
                    {profile?.role || profile?.headline || "Academic Professional"} 
                    {profile?.university && ` at ${profile.university}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    {profile?.years_experience !== null && (
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" />
                        <span>{profile?.years_experience || 0} Years Experience</span>
                      </div>
                    )}
                    {profile?.location && (
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{profile.location}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                {/* Profile Completeness */}
                <div className="w-full md:w-48">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-muted-foreground">Profile Strength</span>
                    <span className="text-xs font-medium text-foreground">{profileCompleteness()}%</span>
                  </div>
                  <Progress value={profileCompleteness()} className="h-2" />
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Button>
                  <Button 
                    size="sm" 
                    className="gap-1 relative"
                    disabled={uploadingResume}
                    onClick={() => resumeInputRef.current?.click()}
                  >
                    {uploadingResume ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                    {profile?.resume_url ? "Update Resume" : "Upload Resume"}
                  </Button>
                  <input
                    ref={resumeInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx"
                    onChange={handleResumeUpload}
                    className="hidden"
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="space-y-6">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="overview">Overview</TabsTrigger>
                <TabsTrigger value="applications">My Applications ({applications.length})</TabsTrigger>
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="research">Research</TabsTrigger>
              </TabsList>
            </motion.div>

            <TabsContent value="overview">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid lg:grid-cols-3 gap-6"
              >
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Bio */}
                  <motion.div variants={itemVariants} className="card-elevated p-6 group relative">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-semibold text-lg text-foreground">About Me</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => setEditModalOpen(true)}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile?.bio || "Tell us about yourself and your academic journey..."}
                    </p>
                  </motion.div>

                  {/* Skills */}
                  <motion.div variants={itemVariants} className="card-elevated p-6 group relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-semibold text-lg text-foreground">Skills</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openSectionEdit("skills")}
                      >
                        <Plus className="h-4 w-4 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="secondary">
                          {skill}
                        </Badge>
                      ))}
                      {skills.length === 0 && (
                        <p className="text-sm text-muted-foreground">Add your skills to stand out to recruiters.</p>
                      )}
                    </div>
                  </motion.div>

                  {/* Recent Applications */}
                  <motion.div variants={itemVariants} className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Recent Applications</h3>
                    {applications.length === 0 ? (
                      <div className="text-center py-8">
                        <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
                        <p className="text-muted-foreground">You haven't applied to any jobs yet.</p>
                        <Button variant="link" onClick={() => navigate("/")} className="mt-2">
                          Browse Jobs →
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {applications.slice(0, 3).map((app) => (
                          <div key={app.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/30">
                            <div>
                              <h4 className="font-medium text-foreground">{app.jobs.title}</h4>
                              <p className="text-sm text-muted-foreground">{app.jobs.institute}</p>
                            </div>
                            <div className="text-right">
                              <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Quick Stats */}
                  <motion.div variants={itemVariants} className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4">Your Stats</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Applications</span>
                        <span className="font-semibold text-foreground">{applications.length}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Shortlisted</span>
                        <span className="font-semibold text-green-600">
                          {applications.filter(a => a.status === "shortlisted").length}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Pending</span>
                        <span className="font-semibold text-yellow-600">
                          {applications.filter(a => a.status === "pending").length}
                        </span>
                      </div>
                    </div>
                  </motion.div>

                  {/* Resume Section */}
                  <motion.div variants={itemVariants} className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4">Your Resume</h3>
                    {profile?.resume_url ? (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
                          <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground text-sm">Resume uploaded</p>
                            <p className="text-xs text-muted-foreground">PDF or Word document</p>
                          </div>
                          <CheckCircle2 className="h-5 w-5 text-green-600 shrink-0" />
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => window.open(profile.resume_url!, "_blank")}
                          >
                            <Download className="h-4 w-4" />
                            View
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1 gap-1"
                            onClick={() => resumeInputRef.current?.click()}
                            disabled={uploadingResume}
                          >
                            {uploadingResume ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Upload className="h-4 w-4" />
                            )}
                            Update
                          </Button>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={handleDeleteResume}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          Remove Resume
                        </Button>
                      </div>
                    ) : (
                      <div className="text-center py-4">
                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-3">
                          <FileText className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">
                          Upload your resume to apply for jobs faster
                        </p>
                        <Button
                          size="sm"
                          className="gap-1"
                          onClick={() => resumeInputRef.current?.click()}
                          disabled={uploadingResume}
                        >
                          {uploadingResume ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                          Upload Resume
                        </Button>
                        <p className="text-xs text-muted-foreground mt-2">
                          PDF or Word (max 10MB)
                        </p>
                      </div>
                    )}
                  </motion.div>

                  {/* AI Suggested Salary */}
                  <motion.div variants={itemVariants} className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-semibold text-foreground">Expected Salary</h3>
                      <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-0">
                        <Sparkles className="h-3 w-3" />
                        AI
                      </Badge>
                    </div>
                    <div className="text-center py-4">
                      <p className="font-heading font-bold text-2xl text-foreground">₹8L - ₹15L p.a.</p>
                      <p className="text-xs text-muted-foreground mt-1">Based on your profile</p>
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="applications">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {applications.length === 0 ? (
                  <motion.div variants={itemVariants} className="card-elevated p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No applications yet.</p>
                    <Button onClick={() => navigate("/")}>Browse Jobs</Button>
                  </motion.div>
                ) : (
                  applications.map((app, index) => (
                    <motion.div
                      key={app.id}
                      variants={itemVariants}
                      className="card-elevated p-5"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-heading font-semibold text-foreground">{app.jobs.title}</h4>
                          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Building2 className="h-4 w-4" />
                              <span>{app.jobs.institute}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-4 w-4" />
                              <span>{app.jobs.location}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                          <p className="text-xs text-muted-foreground mt-2">
                            Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>

            <TabsContent value="experience">
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants} className="card-elevated p-6 group relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold text-lg text-foreground">Work Experience</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openSectionEdit("experience")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  <div className="relative">
                    <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                    <div className="space-y-6">
                      {experienceTimeline.map((item, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-8"
                        >
                          <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${item.isCurrent ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'}`} />
                          <div>
                            <h4 className="font-heading font-semibold text-foreground text-sm">{item.role}</h4>
                            <p className="text-xs text-primary">{item.institution}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">{item.year}</p>
                            <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            </TabsContent>

            <TabsContent value="research">
              <motion.div variants={containerVariants} initial="hidden" animate="visible">
                <motion.div variants={itemVariants} className="card-elevated p-6 group relative">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold text-lg text-foreground">Research Papers</h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => openSectionEdit("research")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  </div>
                  {researchPapers.length === 0 ? (
                    <div className="text-center py-8">
                      <FileText className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Add your research papers to showcase your work.</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {researchPapers.map((paper, index) => (
                        <div key={index} className="border-b border-border last:border-0 pb-4 last:pb-0">
                          <h4 className="font-medium text-primary text-sm hover:underline cursor-pointer">"{paper.title}"</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            👤 {paper.authors} &nbsp;&nbsp; 📅 Published: {paper.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Modals */}
      <ProfileEditModal
        profile={profile}
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        onProfileUpdate={handleProfileUpdate}
      />

      <SectionEditModal
        section={editingSection}
        open={sectionEditOpen}
        onOpenChange={setSectionEditOpen}
        onSave={handleSectionUpdate}
        data={
          editingSection === "experience" ? experienceTimeline :
          editingSection === "research" ? researchPapers :
          editingSection === "skills" ? skills :
          editingSection === "achievements" ? achievements :
          editingSection === "teaching" ? teachingPhilosophy : null
        }
      />
    </div>
  );
};

export default CandidateDashboard;
