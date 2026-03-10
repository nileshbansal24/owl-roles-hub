import { useState, useEffect } from "react";
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
import {
  CheckCircle2,
  Download,
  Building2,
  Calendar,
  Briefcase,
  GraduationCap,
  FileText,
  LogOut,
  MapPin,
  Edit2,
  ExternalLink,
  Sparkles,
  Play,
  Plus,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Profile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  university: string | null;
  role: string | null;
  bio: string | null;
  years_experience: number | null;
  email?: string | null;
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

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [sectionEditOpen, setSectionEditOpen] = useState(false);
  const [editingSection, setEditingSection] = useState<string>("");

  // Editable data - stored in local state for demo (in production, store in database)
  const [experienceTimeline, setExperienceTimeline] = useState<ExperienceItem[]>([
    {
      year: "Aug 2015 - Present",
      role: "Assistant Professor of Physics",
      institution: "Indian Institute of Science, Bangalore",
      description: "Leading research in quantum entanglement and teaching graduate-level courses. Supervised 5 Ph.D. students to completion.",
      isCurrent: true,
    },
    {
      year: "Jul 2012 - Jul 2015",
      role: "Postdoctoral Research Fellow",
      institution: "Tata Institute of Fundamental Research, Mumbai",
      description: "Conducted research on condensed matter physics, resulting in three publications in peer-reviewed journals.",
      isCurrent: false,
    },
  ]);

  const [researchPapers, setResearchPapers] = useState<ResearchPaper[]>([
    { title: "A New Approach to Quantum Entanglement", authors: "A. Sharma, P. Verma, S. Gupta", date: "May 2021" },
    { title: "Topological Insulators in Condensed Matter", authors: "A. Sharma, M. Reddy", date: "Nov 2019" },
    { title: "Exploring Higher Dimensions in String Theory", authors: "S. Singh, A. Sharma, P. Kumar", date: "Jan 2018" },
  ]);

  const [subjectsTaught, setSubjectsTaught] = useState([
    "Quantum Mechanics", "Electrodynamics", "Statistical Physics", "Condensed Matter Physics", "Thermodynamics"
  ]);

  const [skills, setSkills] = useState([
    "Research & Development", "Curriculum Design", "Grant Writing", "Data Analysis (Python)", "Academic Publishing", "Mentorship", "Public Speaking"
  ]);

  const [achievements, setAchievements] = useState([
    "Young Scientist Award, Indian National Science Academy (2018)",
    "SERB Research Grant for Quantum Computing Project (2020)",
    "Best Teacher Award, IISc Department of Physics (2019)"
  ]);

  const [teachingPhilosophy, setTeachingPhilosophy] = useState(
    "My teaching philosophy is centered around inquiry-based learning and fostering critical thinking. I believe in creating an inclusive classroom where students are encouraged to question, explore, and connect complex theories to real-world applications."
  );

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (error) {
        console.error("Error fetching profile:", error);
      } else {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [user]);

  const handleSignOut = async () => {
    await signOut();
    toast({ title: "Signed out", description: "You have been successfully logged out." });
    navigate("/");
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
      case "subjects":
        setSubjectsTaught(data);
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
            className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
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
                <motion.div
                  className="relative"
                  whileHover={{ scale: 1.05 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl md:text-2xl font-heading font-bold">
                      {getInitials(profile?.full_name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground border-2 border-background px-1.5 py-0.5 text-[10px]">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  </Badge>
                </motion.div>

                <div className="flex-1">
                  <h1 className="font-heading font-bold text-xl md:text-2xl text-foreground mb-1">
                    {profile?.full_name || user?.email?.split("@")[0] || "Your Name"}
                  </h1>
                  <p className="text-sm text-muted-foreground mb-2">
                    {profile?.role || "Academic Professional"} {profile?.university && `at ${profile.university}`}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3.5 w-3.5" />
                      <span>{profile?.years_experience || 0} Years of Experience</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5" />
                      <span>Bangalore, India</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-end gap-3">
                <motion.div
                  className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden cursor-pointer"
                  whileHover={{ scale: 1.05 }}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
                  <div className="relative z-10 w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
                    <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                  </div>
                </motion.div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Button>
                  <Button size="sm" onClick={() => navigate("/employer")}>
                    Employer Dashboard
                  </Button>
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
                <TabsTrigger value="experience">Experience</TabsTrigger>
                <TabsTrigger value="research">Research</TabsTrigger>
                <TabsTrigger value="achievements">Achievements</TabsTrigger>
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
                  {/* Professional Summary */}
                  <motion.div variants={itemVariants} className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-3">Professional Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile?.bio || "A dedicated and innovative academic professional with expertise in research and teaching."}
                    </p>
                  </motion.div>

                  {/* Teaching Philosophy */}
                  <motion.div variants={itemVariants} className="card-elevated p-6 group relative">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-semibold text-lg text-foreground">Teaching Philosophy</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openSectionEdit("teaching")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">{teachingPhilosophy}</p>
                  </motion.div>

                  {/* Work Experience Preview */}
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

                  {/* Research Papers Preview */}
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
                    <div className="space-y-4">
                      {researchPapers.map((paper, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          transition={{ delay: index * 0.1 }}
                          className="border-b border-border last:border-0 pb-4 last:pb-0"
                        >
                          <h4 className="font-medium text-primary text-sm hover:underline cursor-pointer">"{paper.title}"</h4>
                          <p className="text-xs text-muted-foreground mt-1">
                            👤 {paper.authors} &nbsp;&nbsp; 📅 Published: {paper.date}
                          </p>
                          <div className="flex gap-4 mt-2">
                            <button className="text-xs text-primary hover:underline flex items-center gap-1">
                              View Abstract <span>→</span>
                            </button>
                            <button className="text-xs text-primary hover:underline flex items-center gap-1">
                              Full Paper <ExternalLink className="h-3 w-3" />
                            </button>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* AI Salary Card */}
                  <motion.div variants={itemVariants} className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-semibold text-foreground">AI-Suggested Salary</h3>
                      <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-0">
                        <Sparkles className="h-3 w-3" />
                        AI Powered
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Based on market data and your qualifications:
                    </p>
                    <div className="text-center py-4">
                      <p className="font-heading font-bold text-2xl text-foreground">₹25L - ₹30L p.a.</p>
                      <p className="text-xs text-muted-foreground mt-1">Based on 1,200 data points</p>
                    </div>
                    <Progress value={70} className="h-2 mt-4" />
                  </motion.div>

                  {/* Resume Card */}
                  <motion.div variants={itemVariants} className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4">Resume</h3>
                    <motion.div
                      className="border border-dashed border-border rounded-lg p-4 flex items-center gap-3 cursor-pointer"
                      whileHover={{ borderColor: "hsl(var(--primary))" }}
                    >
                      <div className="w-10 h-10 bg-muted rounded flex items-center justify-center shrink-0">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">
                          {profile?.full_name?.replace(/\s/g, "") || "Academic"}_CV.pdf
                        </p>
                        <p className="text-xs text-muted-foreground">432 KB</p>
                      </div>
                      <Button variant="ghost" size="sm" className="shrink-0">
                        <Download className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  </motion.div>

                  {/* Subjects Taught */}
                  <motion.div variants={itemVariants} className="card-elevated p-6 group relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-semibold text-foreground">Subjects Taught</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openSectionEdit("subjects")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {subjectsTaught.map((subject, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Badge variant="secondary" className="font-normal text-xs">
                            {subject}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Skills */}
                  <motion.div variants={itemVariants} className="card-elevated p-6 group relative">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-semibold text-foreground">Skills</h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={() => openSectionEdit("skills")}
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                        >
                          <Badge variant="outline" className="font-normal text-xs">
                            {skill}
                          </Badge>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>

                  {/* Quick Actions */}
                  <motion.div variants={itemVariants} className="space-y-3">
                    <Button variant="outline" onClick={() => navigate("/employer")} className="w-full gap-2">
                      <Briefcase className="h-4 w-4" />
                      View Employer Dashboard
                    </Button>
                    <Button variant="destructive" onClick={handleSignOut} className="w-full gap-2">
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </Button>
                  </motion.div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="experience">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-6"
              >
                <div className="flex items-center justify-between mb-6">
                  <h3 className="font-heading font-semibold text-lg text-foreground">Career Timeline</h3>
                  <Button variant="outline" size="sm" onClick={() => openSectionEdit("experience")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Experience
                  </Button>
                </div>
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                  <div className="space-y-8">
                    {experienceTimeline.map((item, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.15 }}
                        className="relative pl-8"
                      >
                        <motion.div
                          className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${item.isCurrent ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'}`}
                          whileHover={{ scale: 1.2 }}
                        />
                        <motion.div
                          className="card-elevated p-4 bg-secondary/30"
                          whileHover={{ x: 5 }}
                          transition={{ type: "spring", stiffness: 300 }}
                        >
                          <span className="text-xs font-medium text-primary">{item.year}</span>
                          <h4 className="font-heading font-semibold text-foreground mt-1">{item.role}</h4>
                          <p className="text-sm text-muted-foreground">{item.institution}</p>
                          <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                        </motion.div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="research">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="card-elevated p-6"
              >
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-lg text-foreground">Research Interests</h3>
                </div>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Quantum Physics", "Condensed Matter", "String Theory", "Statistical Mechanics", "Particle Physics"].map(
                    (tag, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Badge variant="secondary" className="font-normal">{tag}</Badge>
                      </motion.div>
                    )
                  )}
                </div>

                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold text-lg text-foreground">Research Papers</h3>
                  <Button variant="outline" size="sm" onClick={() => openSectionEdit("research")}>
                    <Plus className="h-4 w-4 mr-1" />
                    Add Paper
                  </Button>
                </div>
                <div className="space-y-4">
                  {researchPapers.map((paper, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                      whileHover={{ x: 5 }}
                      className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30 cursor-pointer"
                    >
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{paper.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{paper.authors} • {paper.date}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            </TabsContent>

            <TabsContent value="achievements">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid md:grid-cols-2 gap-6"
              >
                <motion.div variants={itemVariants} className="card-elevated p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-heading font-semibold text-lg text-foreground">Awards & Recognition</h3>
                    <Button variant="ghost" size="sm" onClick={() => openSectionEdit("achievements")}>
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {achievements.map((achievement, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ scale: 1.02 }}
                        className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30"
                      >
                        <span className="text-xl">🏆</span>
                        <p className="text-sm text-foreground">{achievement}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>

                <motion.div variants={itemVariants} className="card-elevated p-6">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Briefcase, label: "Applications", value: "12" },
                      { icon: GraduationCap, label: "Publications", value: "28" },
                      { icon: Building2, label: "Institutions", value: "4" },
                      { icon: Calendar, label: "Years Active", value: String(profile?.years_experience || 8) },
                    ].map((stat, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: index * 0.1 }}
                        whileHover={{ y: -2 }}
                        className="p-4 rounded-lg bg-secondary/30 text-center"
                      >
                        <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                        <p className="font-heading font-bold text-xl text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </motion.div>
                    ))}
                  </div>
                </motion.div>
              </motion.div>
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
        data={
          editingSection === "experience" ? experienceTimeline :
          editingSection === "research" ? researchPapers :
          editingSection === "subjects" ? subjectsTaught :
          editingSection === "skills" ? skills :
          editingSection === "achievements" ? achievements :
          editingSection === "teaching" ? teachingPhilosophy : null
        }
        onSave={handleSectionUpdate}
      />
    </div>
  );
};

export default Dashboard;
