import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useJobsWithRecruiters, JobWithRecruiter } from "@/hooks/useJobsWithRecruiters";
import Navbar from "@/components/Navbar";
import FeaturedJobs from "@/components/FeaturedJobs";
import JobDetailModal from "@/components/JobDetailModal";
import CandidateJobChatbot from "@/components/candidate/CandidateJobChatbot";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Search,
  MapPin,
  Briefcase,
  Sparkles,
  User as UserIcon,
  TrendingUp,
  BookmarkCheck,
  FileText,
} from "lucide-react";

const CandidateHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobs, loading } = useJobsWithRecruiters();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobWithRecruiter | null>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const q = searchQuery.toLowerCase();
      const l = locationQuery.toLowerCase();
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.institute.toLowerCase().includes(q) ||
        job.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesLocation = !l || job.location.toLowerCase().includes(l);
      return matchesSearch && matchesLocation;
    });
  }, [jobs, searchQuery, locationQuery]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const locations = new Set(jobs.map((j) => j.location.split(",")[0].trim())).size;
    const types = new Set(jobs.map((j) => j.job_type || "").filter(Boolean)).size;
    return { total, locations, types };
  }, [jobs]);

  const greeting = useMemo(() => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  }, []);

  const handleJobClick = (job: JobWithRecruiter) => {
    setSelectedJob(job);
    setJobModalOpen(true);
  };

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="min-h-screen bg-background">
      <Navbar onLoginClick={() => {}} onSignupClick={() => {}} />

      {/* Welcome hero */}
      <section className="bg-gradient-to-br from-primary/10 via-background to-background border-b border-border/40">
        <div className="container mx-auto px-4 py-10 md:py-14">
          <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
            <div>
              <Badge className="mb-3 gap-1.5" variant="secondary">
                <Sparkles className="h-3 w-3" /> Personalised feed
              </Badge>
              <h1 className="font-heading text-3xl md:text-4xl font-extrabold tracking-tight">
                {greeting}, {displayName} 👋
              </h1>
              <p className="text-muted-foreground mt-2 max-w-xl">
                Here are the latest openings curated for you. Use the assistant in the bottom-right to chat (or speak)
                about the role you want.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => navigate("/candidate-dashboard")} className="gap-2">
                <UserIcon className="h-4 w-4" /> My Profile
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/candidate-dashboard?tab=applications")}
                className="gap-2"
              >
                <FileText className="h-4 w-4" /> Applications
              </Button>
              <Button
                variant="outline"
                onClick={() => navigate("/candidate-dashboard?tab=saved-jobs")}
                className="gap-2"
              >
                <BookmarkCheck className="h-4 w-4" /> Saved
              </Button>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-8 grid grid-cols-1 md:grid-cols-[1fr_1fr_auto] gap-2 p-2 rounded-2xl border bg-card shadow-sm">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Job title, skills, or institute"
                className="pl-9 border-0 focus-visible:ring-0 shadow-none h-11"
              />
            </div>
            <div className="relative md:border-l border-border/60">
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={locationQuery}
                onChange={(e) => setLocationQuery(e.target.value)}
                placeholder="Location"
                className="pl-9 border-0 focus-visible:ring-0 shadow-none h-11"
              />
            </div>
            <Button
              className="h-11 px-6"
              onClick={() =>
                document.getElementById("jobs-feed")?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Search
            </Button>
          </div>

          {/* Quick analytics */}
          <div className="mt-6 grid grid-cols-2 md:grid-cols-3 gap-3">
            <Card className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Briefcase className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Open Roles</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <MapPin className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Cities Hiring</p>
                <p className="text-xl font-bold">{stats.locations}</p>
              </div>
            </Card>
            <Card className="p-4 flex items-center gap-3 col-span-2 md:col-span-1">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Role Types</p>
                <p className="text-xl font-bold">{stats.types}</p>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Jobs feed */}
      <div id="jobs-feed">
        <FeaturedJobs
          jobs={filteredJobs}
          onJobClick={handleJobClick}
          loading={loading}
          searchQuery={searchQuery}
          onClearSearch={() => setSearchQuery("")}
        />
      </div>

      <div className="container mx-auto px-4 pb-16">
        <Card className="p-6 md:p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20 text-center">
          <h3 className="font-heading text-xl md:text-2xl font-bold mb-2">Want smarter matches?</h3>
          <p className="text-muted-foreground mb-4">
            Keep your profile up-to-date so recruiters can find you and the assistant can recommend better roles.
          </p>
          <Link to="/candidate-dashboard">
            <Button>Update my profile</Button>
          </Link>
        </Card>
      </div>

      <JobDetailModal job={selectedJob} open={jobModalOpen} onOpenChange={setJobModalOpen} />

      <CandidateJobChatbot onJobClick={handleJobClick} />
    </div>
  );
};

export default CandidateHome;
