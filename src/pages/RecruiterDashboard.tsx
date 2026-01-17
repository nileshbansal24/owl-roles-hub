import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ApplicantDetailModal from "@/components/ApplicantDetailModal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  Filter,
  MapPin,
  Briefcase,
  GraduationCap,
  Mail,
  Phone,
  Download,
  Eye,
  Star,
  Clock,
  Users,
  FileText,
  ChevronDown,
  Plus,
  Loader2,
  Building2,
  Calendar,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Award,
  User,
  CheckSquare,
  Square,
  X,
} from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

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

interface Job {
  id: string;
  title: string;
  institute: string;
  location: string;
  salary_range: string | null;
  job_type: string | null;
  created_at: string;
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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const RecruiterDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [candidates, setCandidates] = useState<Profile[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [completenessFilter, setCompletenessFilter] = useState(false);
  const [activeTab, setActiveTab] = useState("resdex");
  const [selectedApplication, setSelectedApplication] = useState<Application | null>(null);
  const [showApplicantModal, setShowApplicantModal] = useState(false);
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // Calculate profile completeness
  const calculateCompleteness = (profile: Profile | null): number => {
    if (!profile) return 0;
    const experience = Array.isArray(profile.experience) ? profile.experience : [];
    const education = Array.isArray(profile.education) ? profile.education : [];
    const researchPapers = Array.isArray(profile.research_papers) ? profile.research_papers : [];
    const achievements = Array.isArray(profile.achievements) ? profile.achievements : [];
    
    const fields = [
      !!profile.full_name,
      !!profile.avatar_url,
      !!(profile.role || profile.headline),
      !!profile.university,
      !!profile.location,
      !!(profile.bio || profile.professional_summary),
      experience.length > 0,
      education.length > 0,
      (profile.skills?.length || 0) > 0,
      !!profile.resume_url,
      researchPapers.length > 0,
      achievements.length > 0,
    ];
    return Math.round((fields.filter(Boolean).length / fields.length) * 100);
  };

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const fetchData = async () => {
      setLoading(true);

      // Fetch recruiter's jobs
      const { data: jobsData } = await supabase
        .from("jobs")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      setJobs(jobsData || []);

      // Fetch applications for recruiter's jobs with applicant profiles
      // Note: RLS policy allows recruiters to view profiles of applicants to their jobs
      const { data: appsData, error: appsError } = await supabase
        .from("job_applications")
        .select(`
          *,
          jobs!inner(title, institute, created_by)
        `)
        .eq("jobs.created_by", user.id)
        .order("created_at", { ascending: false });

      if (appsError) {
        console.error("Error fetching applications:", appsError);
      }

      // Fetch applicant profiles separately for each application
      // Note: phone field is intentionally excluded for privacy - recruiters should not access contact info directly
      const applicationsWithProfiles: Application[] = [];
      if (appsData) {
        for (const app of appsData) {
          const { data: profileData } = await supabase
            .from("profiles")
            .select("id, full_name, avatar_url, university, role, bio, years_experience, location, headline, skills, user_type, resume_url, experience, education, research_papers, achievements, subjects, teaching_philosophy, professional_summary")
            .eq("id", app.applicant_id)
            .maybeSingle();
          
          applicationsWithProfiles.push({
            ...app,
            profiles: profileData,
          } as unknown as Application);
        }
      }

      setApplications(applicationsWithProfiles);

      // Fetch all candidate profiles for Resdex (using public view that excludes sensitive data)
      const { data: candidatesData } = await supabase
        .from("profiles_public")
        .select("*")
        .order("updated_at", { ascending: false });

      setCandidates((candidatesData as unknown as Profile[]) || []);

      setLoading(false);
    };

    fetchData();
  }, [user, navigate]);

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: newStatus } : app
        )
      );
      toast({
        title: "Status updated",
        description: `Application marked as ${newStatus}`,
      });
    }
  };

  // Bulk actions
  const toggleSelectApp = (appId: string) => {
    setSelectedAppIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    if (selectedAppIds.size === filteredApplications.length) {
      setSelectedAppIds(new Set());
    } else {
      setSelectedAppIds(new Set(filteredApplications.map(a => a.id)));
    }
  };

  const clearSelection = () => {
    setSelectedAppIds(new Set());
  };

  const handleBulkAction = async (newStatus: string) => {
    if (selectedAppIds.size === 0) return;
    
    setBulkActionLoading(true);
    const idsArray = Array.from(selectedAppIds);
    
    const { error } = await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .in("id", idsArray);

    if (error) {
      toast({
        title: "Bulk update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setApplications((prev) =>
        prev.map((app) =>
          selectedAppIds.has(app.id) ? { ...app, status: newStatus } : app
        )
      );
      toast({
        title: "Bulk update successful",
        description: `${selectedAppIds.size} application(s) marked as ${newStatus}`,
      });
      setSelectedAppIds(new Set());
    }
    setBulkActionLoading(false);
  };

  const filteredCandidates = candidates.filter((candidate) => {
    const matchesSearch =
      searchQuery === "" ||
      candidate.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.role?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      candidate.skills?.some(skill => skill.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesLocation =
      locationFilter === "" ||
      candidate.location?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      candidate.university?.toLowerCase().includes(locationFilter.toLowerCase());

    const matchesExperience =
      experienceFilter === "" ||
      experienceFilter === "all" ||
      (candidate.years_experience !== null && 
        (experienceFilter === "0-2" && candidate.years_experience <= 2) ||
        (experienceFilter === "3-5" && candidate.years_experience >= 3 && candidate.years_experience <= 5) ||
        (experienceFilter === "5-10" && candidate.years_experience >= 5 && candidate.years_experience <= 10) ||
        (experienceFilter === "10+" && candidate.years_experience > 10));

    return matchesSearch && matchesLocation && matchesExperience;
  });

  const filteredApplications = applications.filter((app) => {
    const matchesJob = selectedJobFilter === "all" || app.job_id === selectedJobFilter;
    const matchesStatus = selectedStatusFilter === "all" || app.status === selectedStatusFilter;
    const matchesCompleteness = !completenessFilter || calculateCompleteness(app.profiles) >= 80;
    return matchesJob && matchesStatus && matchesCompleteness;
  });

  // Keyboard shortcuts for bulk actions
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Only work when on applications tab
      if (activeTab !== "applications") return;
      
      // Don't trigger if user is typing in an input
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      // Ctrl/Cmd + A: Select all
      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (filteredApplications.length > 0) {
          setSelectedAppIds(new Set(filteredApplications.map(a => a.id)));
          toast({
            title: "All selected",
            description: `${filteredApplications.length} applicant(s) selected`,
          });
        }
      }

      // Delete or Backspace: Reject selected
      if ((e.key === "Delete" || e.key === "Backspace") && selectedAppIds.size > 0) {
        e.preventDefault();
        handleBulkAction("rejected");
      }

      // Escape: Clear selection
      if (e.key === "Escape" && selectedAppIds.size > 0) {
        e.preventDefault();
        clearSelection();
        toast({
          title: "Selection cleared",
          description: "All applicants deselected",
        });
      }

      // S key: Shortlist selected
      if (e.key === "s" && !e.ctrlKey && !e.metaKey && selectedAppIds.size > 0) {
        e.preventDefault();
        handleBulkAction("shortlisted");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [activeTab, filteredApplications, selectedAppIds, handleBulkAction, clearSelection, toast]);


  const handleDownloadResume = (resumeUrl: string, applicantName: string) => {
    window.open(resumeUrl, "_blank");
    toast({
      title: "Opening resume",
      description: `Opening resume for ${applicantName}`,
    });
  };

  const getCandidateCategory = (profile: Profile | null) => {
    if (!profile) return "fresher";
    
    const role = profile.role?.toLowerCase() || "";
    const headline = profile.headline?.toLowerCase() || "";
    const experience = profile.years_experience || 0;
    const combinedText = `${role} ${headline}`;
    
    // Gold: HOD, Dean, VC, PVC
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
    
    if (experience >= 10) return "silver";
    if (experience >= 3) return "bronze";
    
    return "fresher";
  };

  const getCategoryBadge = (category: string) => {
    switch (category) {
      case "gold":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-yellow-400 to-amber-500 text-yellow-900">
            <Award className="h-3 w-3" />
            Gold
          </span>
        );
      case "silver":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-gray-300 to-slate-400 text-gray-900">
            <Star className="h-3 w-3" />
            Silver
          </span>
        );
      case "bronze":
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-orange-400 to-amber-600 text-orange-900">
            <Briefcase className="h-3 w-3" />
            Bronze
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-bold bg-gradient-to-r from-gray-700 to-gray-900 text-white">
            <User className="h-3 w-3" />
            Fresher
          </span>
        );
    }
  };

  const handleViewApplicant = (app: Application) => {
    setSelectedApplication(app);
    setShowApplicantModal(true);
  };

  const handleModalStatusUpdate = (appId: string, status: string) => {
    updateApplicationStatus(appId, status);
    setShowApplicantModal(false);
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
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground">
                  Recruiter Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">
                  Manage your job postings and find top talent
                </p>
              </div>
              <Button onClick={() => navigate("/post-job")} className="gap-2">
                <Plus className="h-4 w-4" />
                Post New Job
              </Button>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          >
            <Card className="card-elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-6 w-6 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
                    <p className="text-sm text-muted-foreground">Active Jobs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                    <Users className="h-6 w-6 text-green-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{applications.length}</p>
                    <p className="text-sm text-muted-foreground">Applications</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                    <Search className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">{candidates.length}</p>
                    <p className="text-sm text-muted-foreground">Candidates</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="card-elevated">
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center">
                    <CheckCircle2 className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {applications.filter(a => a.status === "shortlisted").length}
                    </p>
                    <p className="text-sm text-muted-foreground">Shortlisted</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="resdex" className="gap-2">
                <Search className="h-4 w-4" />
                Resdex Search
              </TabsTrigger>
              <TabsTrigger value="applications" className="gap-2">
                <FileText className="h-4 w-4" />
                Applications ({applications.length})
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <Briefcase className="h-4 w-4" />
                My Jobs ({jobs.length})
              </TabsTrigger>
            </TabsList>

            {/* Resdex Search Tab */}
            <TabsContent value="resdex">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Search Filters */}
                <motion.div variants={itemVariants} className="card-elevated p-6">
                  <h3 className="font-heading font-semibold text-lg mb-4 flex items-center gap-2">
                    <Search className="h-5 w-5 text-primary" />
                    Search Candidates
                  </h3>
                  <div className="grid md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <Input
                        placeholder="Search by name, skills, role..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="h-11"
                      />
                    </div>
                    <Input
                      placeholder="Location"
                      value={locationFilter}
                      onChange={(e) => setLocationFilter(e.target.value)}
                      className="h-11"
                    />
                    <Select value={experienceFilter} onValueChange={setExperienceFilter}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder="Experience" />
                      </SelectTrigger>
                      <SelectContent className="bg-popover">
                        <SelectItem value="all">All Experience</SelectItem>
                        <SelectItem value="0-2">0-2 Years</SelectItem>
                        <SelectItem value="3-5">3-5 Years</SelectItem>
                        <SelectItem value="5-10">5-10 Years</SelectItem>
                        <SelectItem value="10+">10+ Years</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between mt-4 pt-4 border-t">
                    <p className="text-sm text-muted-foreground">
                      Showing <span className="font-medium text-foreground">{filteredCandidates.length}</span> candidates
                    </p>
                    <Button variant="outline" size="sm" className="gap-2">
                      <Filter className="h-4 w-4" />
                      More Filters
                    </Button>
                  </div>
                </motion.div>

                {/* Candidate Results */}
                <motion.div variants={itemVariants} className="grid gap-4">
                  {filteredCandidates.length === 0 ? (
                    <div className="card-elevated p-12 text-center">
                      <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No candidates found matching your criteria.</p>
                    </div>
                  ) : (
                    filteredCandidates.map((candidate, index) => (
                      <motion.div
                        key={candidate.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="card-elevated p-5 hover:shadow-lg transition-shadow"
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          <Avatar className="h-16 w-16 shrink-0">
                            <AvatarImage src={candidate.avatar_url || ""} />
                            <AvatarFallback className="bg-primary text-primary-foreground text-lg font-heading font-bold">
                              {candidate.full_name?.slice(0, 2).toUpperCase() || "U"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <h4 className="font-heading font-semibold text-lg text-foreground">
                                  {candidate.full_name || "Anonymous"}
                                </h4>
                                <p className="text-primary font-medium">
                                  {candidate.role || candidate.headline || "Academic Professional"}
                                </p>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <Button variant="outline" size="sm" className="gap-1">
                                  <Eye className="h-4 w-4" />
                                  View
                                </Button>
                                <Button size="sm" className="gap-1">
                                  <Mail className="h-4 w-4" />
                                  Contact
                                </Button>
                              </div>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                              {candidate.university && (
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="h-4 w-4" />
                                  <span>{candidate.university}</span>
                                </div>
                              )}
                              {candidate.location && (
                                <div className="flex items-center gap-1">
                                  <MapPin className="h-4 w-4" />
                                  <span>{candidate.location}</span>
                                </div>
                              )}
                              {candidate.years_experience !== null && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{candidate.years_experience} Years Exp</span>
                                </div>
                              )}
                            </div>

                            {candidate.skills && candidate.skills.length > 0 && (
                              <div className="flex flex-wrap gap-2 mt-3">
                                {candidate.skills.slice(0, 5).map((skill) => (
                                  <Badge key={skill} variant="secondary">
                                    {skill}
                                  </Badge>
                                ))}
                                {candidate.skills.length > 5 && (
                                  <Badge variant="outline">+{candidate.skills.length - 5} more</Badge>
                                )}
                              </div>
                            )}

                            {candidate.bio && (
                              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                {candidate.bio}
                              </p>
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ))
                  )}
                </motion.div>
              </motion.div>
            </TabsContent>

            {/* Applications Tab */}
            <TabsContent value="applications">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-6"
              >
                {/* Filters */}
                <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
                  <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
                    <SelectTrigger className="w-[250px]">
                      <SelectValue placeholder="Filter by job" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">All Jobs</SelectItem>
                      {jobs.map((job) => (
                        <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
                    <SelectTrigger className="w-[180px]">
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover">
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                      <SelectItem value="reviewed">Reviewed</SelectItem>
                      <SelectItem value="shortlisted">Shortlisted</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-1.5 rounded-lg">
                    <Switch
                      id="completeness-filter"
                      checked={completenessFilter}
                      onCheckedChange={setCompletenessFilter}
                    />
                    <Label htmlFor="completeness-filter" className="text-sm cursor-pointer whitespace-nowrap">
                      80%+ Complete
                    </Label>
                  </div>
                  
                  <p className="text-sm text-muted-foreground">
                    {filteredApplications.length} application{filteredApplications.length !== 1 ? "s" : ""}
                  </p>
                </motion.div>

                {/* Bulk Actions Bar */}
                <AnimatePresence>
                  {selectedAppIds.size > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="card-elevated p-4 flex items-center justify-between gap-4 border-primary/30 bg-primary/5"
                    >
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          <CheckSquare className="h-5 w-5 text-primary" />
                          <span className="font-medium text-foreground">
                            {selectedAppIds.size} selected
                          </span>
                        </div>
                        <Button variant="ghost" size="sm" onClick={clearSelection} className="gap-1 text-muted-foreground">
                          <X className="h-4 w-4" />
                          Clear <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-muted rounded">Esc</kbd>
                        </Button>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                          <kbd className="px-1.5 py-0.5 bg-muted rounded">S</kbd> Shortlist
                          <kbd className="px-1.5 py-0.5 bg-muted rounded">Del</kbd> Reject
                        </div>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => handleBulkAction("shortlisted")}
                          disabled={bulkActionLoading}
                        >
                          {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                          Shortlist All
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => handleBulkAction("rejected")}
                          disabled={bulkActionLoading}
                        >
                          {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                          Reject All
                        </Button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Select All Toggle */}
                {filteredApplications.length > 0 && (
                  <motion.div variants={itemVariants} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Checkbox
                        id="select-all"
                        checked={selectedAppIds.size === filteredApplications.length && filteredApplications.length > 0}
                        onCheckedChange={selectAllFiltered}
                      />
                      <Label htmlFor="select-all" className="text-sm cursor-pointer text-muted-foreground">
                        Select all {filteredApplications.length} applicants
                      </Label>
                      <kbd className="hidden md:inline-block ml-2 px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded">Ctrl+A</kbd>
                    </div>
                  </motion.div>
                )}

                {/* Applications List */}
                {filteredApplications.length === 0 ? (
                  <motion.div variants={itemVariants} className="card-elevated p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No applications found.</p>
                  </motion.div>
                ) : (
                  <motion.div variants={itemVariants} className="grid gap-4">
                    {filteredApplications.map((app, index) => (
                      <motion.div
                        key={app.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className={`card-elevated p-5 transition-colors ${selectedAppIds.has(app.id) ? 'ring-2 ring-primary/50 bg-primary/5' : ''}`}
                      >
                        <div className="flex flex-col md:flex-row gap-4">
                          <div className="flex items-start gap-3">
                            <Checkbox
                              checked={selectedAppIds.has(app.id)}
                              onCheckedChange={() => toggleSelectApp(app.id)}
                              className="mt-1"
                            />
                            <Avatar className="h-14 w-14 shrink-0">
                              <AvatarImage src={app.profiles?.avatar_url || ""} />
                              <AvatarFallback className="bg-primary text-primary-foreground font-heading font-bold">
                                {app.profiles?.full_name?.slice(0, 2).toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                          </div>

                          <div className="flex-1">
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <div className="flex items-center gap-2 flex-wrap">
                                  <h4 className="font-heading font-semibold text-foreground">
                                    {app.profiles?.full_name || "Anonymous"}
                                  </h4>
                                  {getCategoryBadge(getCandidateCategory(app.profiles))}
                                  {(() => {
                                    const completeness = calculateCompleteness(app.profiles);
                                    const color = completeness >= 80 ? "text-green-600 bg-green-500/10" : 
                                                  completeness >= 50 ? "text-amber-600 bg-amber-500/10" : 
                                                  "text-red-600 bg-red-500/10";
                                    return (
                                      <span className={`text-xs px-1.5 py-0.5 rounded ${color}`}>
                                        {completeness}%
                                      </span>
                                    );
                                  })()}
                                </div>
                                <p className="text-sm text-muted-foreground">
                                  Applied for <span className="text-primary font-medium">{app.jobs.title}</span> at {app.jobs.institute}
                                </p>
                              </div>
                              <Badge className={getStatusColor(app.status)}>
                                {app.status}
                              </Badge>
                            </div>

                            <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                <span>{formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</span>
                              </div>
                              {app.profiles?.university && (
                                <div className="flex items-center gap-1">
                                  <GraduationCap className="h-4 w-4" />
                                  <span>{app.profiles.university}</span>
                                </div>
                              )}
                              {app.profiles?.role && (
                                <div className="flex items-center gap-1">
                                  <Briefcase className="h-4 w-4" />
                                  <span>{app.profiles.role}</span>
                                </div>
                              )}
                            </div>

                            {app.cover_letter && (
                              <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                                {app.cover_letter}
                              </p>
                            )}

                            <div className="flex flex-wrap items-center gap-2 mt-4 pt-4 border-t">
                              {app.profiles?.resume_url && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-1"
                                  onClick={() => handleDownloadResume(app.profiles!.resume_url!, app.profiles?.full_name || "Applicant")}
                                >
                                  <Download className="h-4 w-4" />
                                  Resume
                                </Button>
                              )}
                              <Button
                                variant="outline"
                                size="sm"
                                className="gap-1"
                                onClick={() => handleViewApplicant(app)}
                              >
                                <Eye className="h-4 w-4" />
                                View Profile
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-green-600 hover:bg-green-50 dark:hover:bg-green-950"
                                onClick={() => updateApplicationStatus(app.id, "shortlisted")}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-1" />
                                Shortlist
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                onClick={() => updateApplicationStatus(app.id, "rejected")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </motion.div>
            </TabsContent>

            {/* My Jobs Tab */}
            <TabsContent value="jobs">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-4"
              >
                {jobs.length === 0 ? (
                  <motion.div variants={itemVariants} className="card-elevated p-12 text-center">
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">You haven't posted any jobs yet.</p>
                    <Button onClick={() => navigate("/post-job")} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Post Your First Job
                    </Button>
                  </motion.div>
                ) : (
                  jobs.map((job, index) => {
                    const jobApps = applications.filter(a => a.job_id === job.id);
                    return (
                      <motion.div
                        key={job.id}
                        variants={itemVariants}
                        className="card-elevated p-5"
                      >
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div>
                            <h4 className="font-heading font-semibold text-lg text-foreground">
                              {job.title}
                            </h4>
                            <div className="flex flex-wrap items-center gap-3 mt-2 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Building2 className="h-4 w-4" />
                                <span>{job.institute}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <MapPin className="h-4 w-4" />
                                <span>{job.location}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-4">
                            <div className="text-center">
                              <p className="text-2xl font-bold text-foreground">{jobApps.length}</p>
                              <p className="text-xs text-muted-foreground">Applications</p>
                            </div>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Applicant Detail Modal */}
      <ApplicantDetailModal
        application={selectedApplication}
        open={showApplicantModal}
        onOpenChange={setShowApplicantModal}
        onStatusUpdate={handleModalStatusUpdate}
      />
    </div>
  );
};

export default RecruiterDashboard;
