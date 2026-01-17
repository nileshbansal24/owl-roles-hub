import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ProfileEditModal from "@/components/ProfileEditModal";
import SectionEditModal from "@/components/SectionEditModal";
import QuickApplyModal from "@/components/QuickApplyModal";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ProfileHeader,
  ProfileCard,
  SidebarCard,
  ExperienceTimeline,
  ResearchPapersList,
  EducationList,
  TagsDisplay,
  ResumeCard,
  AISalarySuggestion,
  AchievementsList,
  AIJobMatching,
} from "@/components/profile";
import {
  Edit2,
  Plus,
  Loader2,
  Briefcase,
  FileText,
  Building2,
  MapPin,
  Upload,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { useIsMobile } from "@/hooks/use-mobile";

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

interface EducationItem {
  degree: string;
  institution: string;
  years: string;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0 },
};

const CandidateDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const resumeInputRef = useRef<HTMLInputElement>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [sectionEditOpen, setSectionEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string>("");
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingResume, setUploadingResume] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");
  const [quickApplyJob, setQuickApplyJob] = useState<{
    id: string;
    title: string;
    institute: string;
    location: string;
    job_type: string | null;
    salary_range: string | null;
  } | null>(null);
  const [quickApplyOpen, setQuickApplyOpen] = useState(false);

  // Handle quick apply from job recommendations
  const handleQuickApply = async (jobId: string) => {
    // Fetch job details
    const { data: job } = await supabase
      .from("jobs")
      .select("id, title, institute, location, job_type, salary_range")
      .eq("id", jobId)
      .single();
    
    if (job) {
      setQuickApplyJob(job);
      setQuickApplyOpen(true);
    }
  };

  const handleApplicationSuccess = async () => {
    // Refresh applications list
    if (user) {
      const { data: appsData } = await supabase
        .from("job_applications")
        .select(`*, jobs(title, institute, location)`)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });
      
      if (appsData) {
        setApplications((appsData as unknown as Application[]) || []);
      }
    }
  };

  // Editable data (empty by default - users fill in their own info)
  const [experienceTimeline, setExperienceTimeline] = useState<ExperienceItem[]>([]);
  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([]);
  const [education, setEducation] = useState<EducationItem[]>([]);
  const [subjects, setSubjects] = useState<string[]>([]);
  const [skills, setSkills] = useState<string[]>([]);
  const [achievements, setAchievements] = useState<string[]>([]);
  const [professionalSummary, setProfessionalSummary] = useState("");
  const [teachingPhilosophy, setTeachingPhilosophy] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

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

      const { data: appsData, error: appsError } = await supabase
        .from("job_applications")
        .select(`*, jobs(title, institute, location)`)
        .eq("applicant_id", user.id)
        .order("created_at", { ascending: false });

      if (appsError) {
        console.error("Error fetching applications:", appsError);
      } else {
        setApplications((appsData as unknown as Application[]) || []);
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
      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}/avatar.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("avatars").getPublicUrl(filePath);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ avatar_url: publicUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, avatar_url: publicUrl } : null));
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

    const allowedTypes = [
      "application/pdf",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Invalid file type",
        description: "Please upload a PDF or Word document.",
        variant: "destructive",
      });
      return;
    }

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
      const fileExt = file.name.split(".").pop();
      const fileName = `resume.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("resumes")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const {
        data: { publicUrl },
      } = supabase.storage.from("resumes").getPublicUrl(filePath);

      const resumeUrl = `${publicUrl}?t=${Date.now()}`;

      const { error: updateError } = await supabase
        .from("profiles")
        .update({ resume_url: resumeUrl })
        .eq("id", user.id);

      if (updateError) throw updateError;

      setProfile((prev) => (prev ? { ...prev, resume_url: resumeUrl } : null));
      toast({ title: "Resume uploaded!", description: "Your resume has been uploaded successfully." });
    } catch (error: any) {
      console.error("Error uploading resume:", error);
      toast({ title: "Upload failed", description: error.message || "Failed to upload resume.", variant: "destructive" });
    } finally {
      setUploadingResume(false);
      if (resumeInputRef.current) {
        resumeInputRef.current.value = "";
      }
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
      case "education":
        setEducation(data);
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
      case "subjects":
        setSubjects(data);
        break;
    }
    toast({ title: "Updated", description: "Your changes have been saved." });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
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

  const getSectionData = (section: string) => {
    switch (section) {
      case "experience":
        return experienceTimeline;
      case "research":
        return researchPapers;
      case "education":
        return education;
      case "skills":
        return skills;
      case "achievements":
        return achievements;
      case "teaching":
        return teachingPhilosophy;
      case "subjects":
        return subjects;
      default:
        return null;
    }
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

  // Sidebar content (used in both desktop right column and mobile below main content)
  const SidebarContent = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {/* AI Suggested Salary */}
      <motion.div variants={itemVariants}>
        <SidebarCard title="AI-Suggested Salary" collapsible={false}>
          <AISalarySuggestion
            profile={{
              role: profile?.role,
              headline: profile?.headline,
              yearsExperience: profile?.years_experience,
              location: profile?.location,
              skills: profile?.skills,
              university: profile?.university,
            }}
          />
        </SidebarCard>
      </motion.div>

      {/* Resume */}
      <motion.div variants={itemVariants}>
        <SidebarCard title="Resume" collapsible={false}>
          <ResumeCard
            resumeUrl={profile?.resume_url}
            fileName={profile?.full_name ? `${profile.full_name}_CV.pdf` : "Resume.pdf"}
            fileSize="PDF"
            onUpload={() => resumeInputRef.current?.click()}
            onView={() => profile?.resume_url && window.open(profile.resume_url, "_blank")}
            uploading={uploadingResume}
          />
        </SidebarCard>
      </motion.div>

      {/* Subjects Taught / Expertise */}
      <motion.div variants={itemVariants}>
        <SidebarCard
          title="Subjects Taught"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => openSectionEdit("subjects")}
            >
              <Edit2 className="h-3 w-3" />
            </Button>
          }
        >
          <TagsDisplay
            tags={subjects}
            emptyMessage="Add your subjects/expertise areas."
          />
        </SidebarCard>
      </motion.div>

      {/* Skills */}
      <motion.div variants={itemVariants}>
        <SidebarCard
          title="Skills"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => openSectionEdit("skills")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          }
        >
          <TagsDisplay
            tags={skills}
            emptyMessage="Add your skills."
          />
        </SidebarCard>
      </motion.div>

      {/* Achievements & Awards */}
      <motion.div variants={itemVariants}>
        <SidebarCard
          title="Achievements & Awards"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              className="h-6 px-2 text-xs"
              onClick={() => openSectionEdit("achievements")}
            >
              <Plus className="h-3 w-3" />
            </Button>
          }
        >
          <AchievementsList
            achievements={achievements}
            emptyMessage="Add your achievements."
          />
        </SidebarCard>
      </motion.div>
    </motion.div>
  );

  // Main content cards
  const MainContent = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4 md:space-y-5"
    >
      {/* AI Job Recommendations */}
      <motion.div variants={itemVariants}>
        <ProfileCard title="" className="overflow-hidden">
          <AIJobMatching
            profile={{
              role: profile?.role,
              headline: profile?.headline,
              yearsExperience: profile?.years_experience,
              location: profile?.location,
              skills: profile?.skills,
              university: profile?.university,
              bio: profile?.bio,
            }}
            onViewJob={(jobId) => navigate(`/?job=${jobId}`)}
            onApply={handleQuickApply}
          />
        </ProfileCard>
      </motion.div>

      {/* Professional Summary */}
      <motion.div variants={itemVariants}>
        <ProfileCard
          title="Professional Summary"
          onEdit={() => setEditModalOpen(true)}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {profile?.bio || professionalSummary}
          </p>
        </ProfileCard>
      </motion.div>

      {/* Teaching/Working Philosophy */}
      <motion.div variants={itemVariants}>
        <ProfileCard
          title="Teaching Philosophy"
          onEdit={() => openSectionEdit("teaching")}
        >
          <p className="text-sm text-muted-foreground leading-relaxed">
            {teachingPhilosophy}
          </p>
        </ProfileCard>
      </motion.div>

      {/* Work Experience */}
      <motion.div variants={itemVariants}>
        <ProfileCard
          title="Work Experience"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => openSectionEdit("experience")}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          }
        >
          <ExperienceTimeline items={experienceTimeline} />
        </ProfileCard>
      </motion.div>

      {/* Research Papers */}
      <motion.div variants={itemVariants}>
        <ProfileCard
          title="Research Papers"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => openSectionEdit("research")}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          }
        >
          <ResearchPapersList papers={researchPapers} />
        </ProfileCard>
      </motion.div>

      {/* Education */}
      <motion.div variants={itemVariants}>
        <ProfileCard
          title="Education"
          headerAction={
            <Button
              variant="ghost"
              size="sm"
              className="h-8 px-2"
              onClick={() => openSectionEdit("education")}
            >
              <Plus className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Add</span>
            </Button>
          }
        >
          <EducationList items={education} />
        </ProfileCard>
      </motion.div>
    </motion.div>
  );

  // Applications content
  const ApplicationsContent = () => (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-4"
    >
      {applications.length === 0 ? (
        <motion.div variants={itemVariants}>
          <ProfileCard title="My Applications">
            <div className="text-center py-8">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">No applications yet.</p>
              <Button onClick={() => navigate("/")}>Browse Jobs</Button>
            </div>
          </ProfileCard>
        </motion.div>
      ) : (
        applications.map((app) => (
          <motion.div key={app.id} variants={itemVariants}>
            <div className="bg-card rounded-xl border border-border shadow-card p-4 md:p-5">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h4 className="font-heading font-semibold text-foreground">
                    {app.jobs.title}
                  </h4>
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
                <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                  <Badge className={getStatusColor(app.status)}>{app.status}</Badge>
                  <p className="text-xs text-muted-foreground">
                    Applied {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        ))
      )}
    </motion.div>
  );

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      {/* Hidden file inputs */}
      <input
        ref={resumeInputRef}
        type="file"
        accept=".pdf,.doc,.docx"
        onChange={handleResumeUpload}
        className="hidden"
      />

      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-7xl">
          {/* Profile Header */}
          <div className="mb-6">
            <ProfileHeader
              avatarUrl={profile?.avatar_url}
              name={profile?.full_name || user?.email?.split("@")[0] || "Your Name"}
              email={user?.email}
              role={profile?.role || profile?.headline}
              university={profile?.university}
              yearsExperience={profile?.years_experience}
              location={profile?.location}
              phone={profile?.phone}
              onAvatarUpload={handleAvatarUpload}
              uploadingAvatar={uploadingAvatar}
              secondaryAction={
                <Button variant="outline" onClick={() => setEditModalOpen(true)}>
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
              }
              primaryAction={
                <Button onClick={() => resumeInputRef.current?.click()} disabled={uploadingResume}>
                  {uploadingResume ? (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Upload className="h-4 w-4 mr-2" />
                  )}
                  {profile?.resume_url ? "Update Resume" : "Upload Resume"}
                </Button>
              }
            />
          </div>

          {/* Tabbed Navigation */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="border-b border-border">
              {/* Desktop Tabs */}
              <div className="hidden md:block">
                <TabsList className="bg-transparent h-auto p-0 gap-0">
                  <TabsTrigger
                    value="overview"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                  >
                    Overview
                  </TabsTrigger>
                  <TabsTrigger
                    value="experience"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                  >
                    Experience
                  </TabsTrigger>
                  <TabsTrigger
                    value="research"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                  >
                    Research
                  </TabsTrigger>
                  <TabsTrigger
                    value="achievements"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3"
                  >
                    Achievements
                  </TabsTrigger>
                </TabsList>
              </div>

              {/* Mobile Tabs - Horizontal Scroll */}
              <div className="md:hidden">
                <ScrollArea className="w-full">
                  <TabsList className="bg-transparent h-auto p-0 gap-0 w-max">
                    <TabsTrigger
                      value="overview"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
                    >
                      Overview
                    </TabsTrigger>
                    <TabsTrigger
                      value="experience"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
                    >
                      Experience
                    </TabsTrigger>
                    <TabsTrigger
                      value="research"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
                    >
                      Research
                    </TabsTrigger>
                    <TabsTrigger
                      value="achievements"
                      className="rounded-none border-b-2 border-transparent data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 text-sm"
                    >
                      Achievements
                    </TabsTrigger>
                  </TabsList>
                  <ScrollBar orientation="horizontal" />
                </ScrollArea>
              </div>
            </div>

            {/* Overview Tab - Two Column Layout */}
            <TabsContent value="overview" className="mt-6">
              {/* Desktop: Two Column Layout */}
              <div className="hidden lg:grid lg:grid-cols-[1fr_340px] gap-6">
                <MainContent />
                <SidebarContent />
              </div>

              {/* Tablet: Two Column Layout (narrower sidebar) */}
              <div className="hidden md:grid md:grid-cols-[1fr_280px] lg:hidden gap-5">
                <MainContent />
                <SidebarContent />
              </div>

              {/* Mobile: Single Column - Main Content then Sidebar */}
              <div className="md:hidden space-y-6">
                <MainContent />
                <div className="border-t border-border pt-6">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-4">
                    Additional Information
                  </h3>
                  <SidebarContent />
                </div>
              </div>
            </TabsContent>

            {/* Experience Tab */}
            <TabsContent value="experience" className="mt-6">
              <div className="max-w-4xl">
                <motion.div variants={containerVariants} initial="hidden" animate="visible">
                  <motion.div variants={itemVariants}>
                    <ProfileCard
                      title="Work Experience"
                      headerAction={
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => openSectionEdit("experience")}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      }
                    >
                      <ExperienceTimeline items={experienceTimeline} />
                    </ProfileCard>
                  </motion.div>

                  <motion.div variants={itemVariants} className="mt-5">
                    <ProfileCard title="Education" onEdit={() => {}}>
                      <EducationList items={education} />
                    </ProfileCard>
                  </motion.div>
                </motion.div>
              </div>
            </TabsContent>

            {/* Research Tab */}
            <TabsContent value="research" className="mt-6">
              <div className="max-w-4xl">
                <ProfileCard
                  title="Research Papers"
                  headerAction={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => openSectionEdit("research")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add Paper
                    </Button>
                  }
                >
                  <ResearchPapersList papers={researchPapers} />
                </ProfileCard>
              </div>
            </TabsContent>

            {/* Achievements Tab */}
            <TabsContent value="achievements" className="mt-6">
              <div className="max-w-4xl">
                <ProfileCard
                  title="Achievements & Awards"
                  headerAction={
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => openSectionEdit("achievements")}
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      Add
                    </Button>
                  }
                >
                  <AchievementsList
                    achievements={achievements}
                    emptyMessage="Add your achievements and awards to showcase your accomplishments."
                  />
                </ProfileCard>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Modals */}
      <ProfileEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />

      <SectionEditModal
        open={sectionEditOpen}
        onOpenChange={setSectionEditOpen}
        section={editingSection}
        data={getSectionData(editingSection)}
        onSave={handleSectionUpdate}
      />

      <QuickApplyModal
        open={quickApplyOpen}
        onOpenChange={setQuickApplyOpen}
        job={quickApplyJob}
        resumeUrl={profile?.resume_url}
        onSuccess={handleApplicationSuccess}
      />
    </div>
  );
};

export default CandidateDashboard;
