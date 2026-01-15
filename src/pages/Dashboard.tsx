import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import ProfileEditModal from "@/components/ProfileEditModal";
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
  TrendingUp,
  LogOut,
  MapPin,
  Edit2,
  ExternalLink,
  Sparkles,
  Play,
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
}

const experienceTimeline = [
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
];

const researchPapers = [
  {
    title: "A New Approach to Quantum Entanglement",
    authors: "A. Sharma, P. Verma, S. Gupta",
    date: "May 2021",
  },
  {
    title: "Topological Insulators in Condensed Matter",
    authors: "A. Sharma, M. Reddy",
    date: "Nov 2019",
  },
  {
    title: "Exploring Higher Dimensions in String Theory",
    authors: "S. Singh, A. Sharma, P. Kumar",
    date: "Jan 2018",
  },
];

const subjectsTaught = [
  "Quantum Mechanics",
  "Electrodynamics",
  "Statistical Physics",
  "Condensed Matter Physics",
  "Thermodynamics",
];

const skills = [
  "Research & Development",
  "Curriculum Design",
  "Grant Writing",
  "Data Analysis (Python)",
  "Academic Publishing",
  "Mentorship",
  "Public Speaking",
];

const achievements = [
  "Young Scientist Award, Indian National Science Academy (2018)",
  "SERB Research Grant for Quantum Computing Project (2020)",
  "Best Teacher Award, IISc Department of Physics (2019)",
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const [editModalOpen, setEditModalOpen] = useState(false);

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
    toast({
      title: "Signed out",
      description: "You have been successfully logged out.",
    });
    navigate("/");
  };

  const handleProfileUpdate = (updatedProfile: Profile) => {
    setProfile(updatedProfile);
  };

  const getInitials = (name: string | null, email: string | undefined) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2);
    }
    return email?.slice(0, 2).toUpperCase() || "U";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-pulse text-muted-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Profile Header - Matching Reference Design */}
          <div className="card-elevated p-6 md:p-8 mb-6 animate-fade-in">
            <div className="flex flex-col md:flex-row gap-6">
              {/* Left: Avatar and Info */}
              <div className="flex items-start gap-4 flex-1">
                <div className="relative">
                  <Avatar className="h-20 w-20 md:h-24 md:w-24 border-4 border-background shadow-lg">
                    <AvatarImage src={profile?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground text-xl md:text-2xl font-heading font-bold">
                      {getInitials(profile?.full_name, user?.email)}
                    </AvatarFallback>
                  </Avatar>
                  <Badge className="absolute -bottom-1 -right-1 bg-primary text-primary-foreground border-2 border-background px-1.5 py-0.5 text-[10px]">
                    <CheckCircle2 className="h-2.5 w-2.5" />
                  </Badge>
                </div>

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

              {/* Right: Video placeholder and Actions */}
              <div className="flex flex-col items-end gap-3">
                <div className="w-32 h-20 bg-muted rounded-lg flex items-center justify-center relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-muted to-muted-foreground/20" />
                  <div className="relative z-10 w-8 h-8 rounded-full bg-primary/80 flex items-center justify-center">
                    <Play className="h-4 w-4 text-primary-foreground ml-0.5" />
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => setEditModalOpen(true)}>
                    <Edit2 className="h-4 w-4 mr-1" />
                    Edit Profile
                  </Button>
                  <Button size="sm" className="bg-primary">
                    Invite to Apply
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <TabsList className="mb-6 bg-secondary/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
              <TabsTrigger value="achievements">Achievements</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid lg:grid-cols-3 gap-6">
                {/* Left Column */}
                <div className="lg:col-span-2 space-y-6">
                  {/* Professional Summary */}
                  <div className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-3">Professional Summary</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {profile?.bio || "A dedicated and innovative academic professional with expertise in research and teaching. Passionate about fostering a challenging and engaging learning environment, with a proven track record of published research in high-impact journals and successful grant applications. Seeking to contribute to a forward-thinking academic institution."}
                    </p>
                  </div>

                  {/* Teaching Philosophy */}
                  <div className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-3">Teaching Philosophy</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      My teaching philosophy is centered around inquiry-based learning and fostering critical thinking. I believe in creating an inclusive classroom where students are encouraged to question, explore, and connect complex theories to real-world applications. By using a blend of Socratic methods, hands-on lab work, and collaborative projects, I aim to demystify abstract concepts and ignite a lifelong passion for scientific discovery. My goal is not just to impart knowledge, but to empower students to become independent thinkers and problem-solvers.
                    </p>
                  </div>

                  {/* Work Experience Preview */}
                  <div className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Work Experience</h3>
                    <div className="relative">
                      <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                      <div className="space-y-6">
                        {experienceTimeline.map((item, index) => (
                          <div key={index} className="relative pl-8">
                            <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${item.isCurrent ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'}`} />
                            <div>
                              <h4 className="font-heading font-semibold text-foreground text-sm">{item.role}</h4>
                              <p className="text-xs text-primary">{item.institution}</p>
                              <p className="text-xs text-muted-foreground mt-0.5">{item.year}</p>
                              <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Research Papers Preview */}
                  <div className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Research Papers</h3>
                    <div className="space-y-4">
                      {researchPapers.map((paper, index) => (
                        <div key={index} className="border-b border-border last:border-0 pb-4 last:pb-0">
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
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* AI Salary Card */}
                  <div className="card-elevated p-6">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-heading font-semibold text-foreground">AI-Suggested Salary</h3>
                      <Badge variant="secondary" className="gap-1 bg-primary/10 text-primary border-0">
                        <Sparkles className="h-3 w-3" />
                        AI Powered
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mb-4">
                      Based on market data and your qualifications, your estimated salary expectation is:
                    </p>
                    <div className="text-center py-4">
                      <p className="font-heading font-bold text-2xl text-foreground">₹25L - ₹30L p.a.</p>
                      <p className="text-xs text-muted-foreground mt-1">Based on 1,200 data points</p>
                    </div>
                    <Progress value={70} className="h-2 mt-4" />
                  </div>

                  {/* Resume Card */}
                  <div className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4">Resume</h3>
                    <div className="border border-dashed border-border rounded-lg p-4 flex items-center gap-3">
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
                    </div>
                  </div>

                  {/* Subjects Taught */}
                  <div className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4">Subjects Taught</h3>
                    <div className="flex flex-wrap gap-2">
                      {subjectsTaught.map((subject, index) => (
                        <Badge key={index} variant="secondary" className="font-normal text-xs">
                          {subject}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4">Skills</h3>
                    <div className="flex flex-wrap gap-2">
                      {skills.map((skill, index) => (
                        <Badge key={index} variant="outline" className="font-normal text-xs">
                          {skill}
                        </Badge>
                      ))}
                    </div>
                  </div>

                  {/* Achievements */}
                  <div className="card-elevated p-6">
                    <h3 className="font-heading font-semibold text-foreground mb-4">Achievements & Awards</h3>
                    <ul className="space-y-2">
                      {achievements.map((achievement, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm text-muted-foreground">
                          <span className="text-yellow-500 mt-0.5">🏆</span>
                          {achievement}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Sign Out */}
                  <Button variant="destructive" onClick={handleSignOut} className="w-full gap-2">
                    <LogOut className="h-4 w-4" />
                    Sign Out
                  </Button>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="experience">
              <div className="card-elevated p-6">
                <h3 className="font-heading font-semibold text-lg text-foreground mb-6">Career Timeline</h3>
                <div className="relative">
                  <div className="absolute left-[7px] top-2 bottom-2 w-0.5 bg-border" />
                  <div className="space-y-8">
                    {experienceTimeline.map((item, index) => (
                      <div key={index} className="relative pl-8">
                        <div className={`absolute left-0 top-1.5 w-4 h-4 rounded-full border-2 ${item.isCurrent ? 'bg-primary border-primary' : 'bg-background border-muted-foreground/30'}`} />
                        <div className="card-elevated p-4 bg-secondary/30">
                          <span className="text-xs font-medium text-primary">{item.year}</span>
                          <h4 className="font-heading font-semibold text-foreground mt-1">{item.role}</h4>
                          <p className="text-sm text-muted-foreground">{item.institution}</p>
                          <p className="text-sm text-muted-foreground mt-2">{item.description}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="research">
              <div className="card-elevated p-6">
                <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Research Interests</h3>
                <div className="flex flex-wrap gap-2 mb-6">
                  {["Quantum Physics", "Condensed Matter", "String Theory", "Statistical Mechanics", "Particle Physics"].map(
                    (tag, index) => (
                      <Badge key={index} variant="secondary" className="font-normal">
                        {tag}
                      </Badge>
                    )
                  )}
                </div>

                <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Research Papers</h3>
                <div className="space-y-4">
                  {researchPapers.map((paper, index) => (
                    <div key={index} className="flex items-center gap-3 p-4 rounded-lg bg-secondary/30">
                      <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{paper.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">{paper.authors} • {paper.date}</p>
                      </div>
                      <Button variant="ghost" size="sm">
                        <ExternalLink className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>

            <TabsContent value="achievements">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="card-elevated p-6">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Awards & Recognition</h3>
                  <div className="space-y-4">
                    {achievements.map((achievement, index) => (
                      <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-secondary/30">
                        <span className="text-xl">🏆</span>
                        <p className="text-sm text-foreground">{achievement}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="card-elevated p-6">
                  <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-4">
                    {[
                      { icon: Briefcase, label: "Applications", value: "12" },
                      { icon: GraduationCap, label: "Publications", value: "28" },
                      { icon: Building2, label: "Institutions", value: "4" },
                      { icon: Calendar, label: "Years Active", value: String(profile?.years_experience || 8) },
                    ].map((stat, index) => (
                      <div key={index} className="p-4 rounded-lg bg-secondary/30 text-center">
                        <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                        <p className="font-heading font-bold text-xl text-foreground">{stat.value}</p>
                        <p className="text-xs text-muted-foreground">{stat.label}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Profile Edit Modal */}
      <ProfileEditModal
        open={editModalOpen}
        onOpenChange={setEditModalOpen}
        profile={profile}
        onProfileUpdate={handleProfileUpdate}
      />
    </div>
  );
};

export default Dashboard;