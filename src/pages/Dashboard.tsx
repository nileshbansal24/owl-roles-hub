import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
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
    year: "2023 - Present",
    role: "Associate Professor",
    institution: "MIT",
    description: "Leading research in quantum computing and machine learning.",
  },
  {
    year: "2019 - 2023",
    role: "Assistant Professor",
    institution: "Stanford University",
    description: "Developed curriculum for graduate-level AI courses.",
  },
  {
    year: "2016 - 2019",
    role: "Postdoctoral Researcher",
    institution: "Harvard University",
    description: "Conducted research on neural network optimization.",
  },
];

const Dashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

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
          {/* Profile Header */}
          <div className="card-elevated p-8 mb-8 animate-fade-in">
            <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
              <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-heading font-bold">
                  {getInitials(profile?.full_name, user?.email)}
                </AvatarFallback>
              </Avatar>

              <div className="flex-1">
                <div className="flex items-center gap-3 mb-2">
                  <h1 className="font-heading font-bold text-2xl text-foreground">
                    {profile?.full_name || user?.email?.split("@")[0]}
                  </h1>
                  <Badge className="bg-primary/10 text-primary border-0 gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    Verified
                  </Badge>
                </div>
                <p className="text-muted-foreground mb-3">
                  {profile?.role || "Academic Professional"} {profile?.university && `at ${profile.university}`}
                </p>
                <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-4 w-4" />
                    <span>{profile?.university || "Not specified"}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    <span>{profile?.years_experience || 0} years experience</span>
                  </div>
                </div>
              </div>

              <Button variant="destructive" onClick={handleSignOut} className="gap-2">
                <LogOut className="h-4 w-4" />
                Sign Out
              </Button>
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="overview" className="animate-fade-in" style={{ animationDelay: "0.1s" }}>
            <TabsList className="mb-6 bg-secondary/50">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="experience">Experience</TabsTrigger>
              <TabsTrigger value="research">Research</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                {/* AI Salary Card */}
                <div className="card-elevated p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">AI Salary Insights</h3>
                      <p className="text-sm text-muted-foreground">Based on your profile</p>
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-muted-foreground">Market Position</span>
                        <span className="font-medium text-foreground">Top 25%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-sm text-muted-foreground mb-1">Suggested Range</p>
                      <p className="font-heading font-bold text-xl text-foreground">$120,000 - $180,000</p>
                    </div>
                  </div>
                </div>

                {/* Resume Card */}
                <div className="card-elevated p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-semibold text-foreground">Your CV</h3>
                      <p className="text-sm text-muted-foreground">Last updated 2 weeks ago</p>
                    </div>
                  </div>
                  <div className="border border-dashed border-border rounded-lg p-6 text-center">
                    <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground mb-4">
                      Academic_CV_2024.pdf
                    </p>
                    <Button variant="outline" className="gap-2">
                      <Download className="h-4 w-4" />
                      Download CV
                    </Button>
                  </div>
                </div>
              </div>

              {/* Quick Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { icon: Briefcase, label: "Applications", value: "12" },
                  { icon: GraduationCap, label: "Publications", value: "28" },
                  { icon: Building2, label: "Institutions", value: "4" },
                  { icon: Calendar, label: "Years Active", value: "8" },
                ].map((stat, index) => (
                  <div key={index} className="card-elevated p-4 text-center">
                    <stat.icon className="h-5 w-5 text-primary mx-auto mb-2" />
                    <p className="font-heading font-bold text-xl text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="experience">
              <div className="card-elevated p-6">
                <h3 className="font-heading font-semibold text-lg text-foreground mb-6">Career Timeline</h3>
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-border" />

                  <div className="space-y-8">
                    {experienceTimeline.map((item, index) => (
                      <div key={index} className="relative pl-12">
                        {/* Timeline dot */}
                        <div className="absolute left-2.5 w-3 h-3 rounded-full bg-primary border-2 border-background" />

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
                  {["Machine Learning", "Quantum Computing", "Neural Networks", "AI Ethics", "Data Science"].map(
                    (tag, index) => (
                      <Badge key={index} variant="secondary" className="font-normal">
                        {tag}
                      </Badge>
                    )
                  )}
                </div>

                <h3 className="font-heading font-semibold text-lg text-foreground mb-4">Recent Publications</h3>
                <div className="space-y-4">
                  {[
                    "Advances in Quantum Machine Learning Algorithms (2024)",
                    "Ethical Considerations in AI Development (2023)",
                    "Neural Network Optimization Techniques (2022)",
                  ].map((pub, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30">
                      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                      <p className="text-sm text-foreground">{pub}</p>
                    </div>
                  ))}
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;