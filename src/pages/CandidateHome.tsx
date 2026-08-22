import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useJobsWithRecruiters, JobWithRecruiter } from "@/hooks/useJobsWithRecruiters";
import Navbar from "@/components/Navbar";
import JobDetailModal from "@/components/JobDetailModal";
import CandidateJobChatbot from "@/components/candidate/CandidateJobChatbot";
import JobFeedCard from "@/components/candidate/JobFeedCard";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Search,
  MapPin,
  User,
  FileText,
  Bookmark,
  Briefcase,
  Building2,
  BarChart3,
  SearchX,
  X,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

const StatTile = ({
  Icon,
  label,
  value,
}: {
  Icon: LucideIcon;
  label: string;
  value: number;
}) => (
  <div className="flex items-center gap-3 rounded-xl border border-border/70 bg-card/60 px-4 py-3 backdrop-blur-sm">
    <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary ring-1 ring-primary/20">
      <Icon className="h-4 w-4" strokeWidth={2.25} />
    </span>
    <div className="min-w-0">
      <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="text-lg font-bold leading-tight">{value}</p>
    </div>
  </div>
);

const CandidateHome = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { jobs, loading } = useJobsWithRecruiters();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedJob, setSelectedJob] = useState<JobWithRecruiter | null>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);

  const jobTypes = useMemo(
    () => Array.from(new Set(jobs.map((j) => j.job_type).filter(Boolean) as string[])),
    [jobs]
  );

  const filteredJobs = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const l = locationQuery.trim().toLowerCase();
    const list = jobs.filter((job) => {
      const matchesSearch =
        !q ||
        job.title.toLowerCase().includes(q) ||
        job.institute.toLowerCase().includes(q) ||
        job.tags?.some((t) => t.toLowerCase().includes(q));
      const matchesLocation = !l || job.location.toLowerCase().includes(l);
      const matchesType = typeFilter === "all" || job.job_type === typeFilter;
      return matchesSearch && matchesLocation && matchesType;
    });

    return [...list].sort((a, b) => {
      if (sortBy === "oldest") {
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      if (sortBy === "institute") return a.institute.localeCompare(b.institute);
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });
  }, [jobs, searchQuery, locationQuery, typeFilter, sortBy]);

  const stats = useMemo(() => {
    const total = jobs.length;
    const locations = new Set(jobs.map((j) => j.location.split(",")[0].trim())).size;
    const institutes = new Set(jobs.map((j) => j.institute)).size;
    return { total, locations, institutes };
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

  const clearAll = () => {
    setSearchQuery("");
    setLocationQuery("");
    setTypeFilter("all");
  };

  const hasFilters = !!searchQuery || !!locationQuery || typeFilter !== "all";

  const displayName =
    (user?.user_metadata?.full_name as string | undefined) ||
    user?.email?.split("@")[0] ||
    "there";

  return (
    <div className="min-h-screen bg-background">
      <Navbar onLoginClick={() => {}} onSignupClick={() => {}} />

      {/* Header */}
      <section className="border-b border-border/50 bg-gradient-to-b from-primary/[0.07] to-background">
        <div className="container mx-auto px-4 py-8 md:py-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h1 className="font-heading text-2xl font-extrabold tracking-tight md:text-3xl">
                {greeting}, {displayName}
              </h1>
              <p className="mt-1.5 max-w-xl text-sm text-muted-foreground md:text-base">
                Browse live faculty and research openings. Prefer to talk? Use the assistant at the
                bottom-right — typing or voice both work.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" size="sm" className="h-9 gap-2" onClick={() => navigate("/candidate-dashboard")}>
                <User className="h-4 w-4" /> Profile
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => navigate("/candidate-dashboard?tab=applications")}
              >
                <FileText className="h-4 w-4" /> Applications
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="h-9 gap-2"
                onClick={() => navigate("/candidate-dashboard?tab=saved-jobs")}
              >
                <Bookmark className="h-4 w-4" /> Saved
              </Button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <StatTile Icon={Briefcase} label="Open roles" value={stats.total} />
            <StatTile Icon={Building2} label="Institutes hiring" value={stats.institutes} />
            <StatTile Icon={BarChart3} label="Cities" value={stats.locations} />
          </div>
        </div>
      </section>

      {/* Sticky search + filters */}
      <div className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="grid flex-1 grid-cols-1 gap-2 sm:grid-cols-2">
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Job title, skill or institute"
                  className="h-10 rounded-xl pl-9"
                />
              </div>
              <div className="relative">
                <MapPin className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={locationQuery}
                  onChange={(e) => setLocationQuery(e.target.value)}
                  placeholder="Location"
                  className="h-10 rounded-xl pl-9"
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="h-10 w-[150px] rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest first</SelectItem>
                  <SelectItem value="oldest">Oldest first</SelectItem>
                  <SelectItem value="institute">Institute A–Z</SelectItem>
                </SelectContent>
              </Select>
              {hasFilters && (
                <Button variant="ghost" size="sm" className="h-10 gap-1.5" onClick={clearAll}>
                  <X className="h-4 w-4" /> Clear
                </Button>
              )}
            </div>
          </div>

          {jobTypes.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {["all", ...jobTypes].map((type) => (
                <button
                  key={type}
                  onClick={() => setTypeFilter(type)}
                  className={cn(
                    "shrink-0 rounded-full border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    typeFilter === type
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground"
                  )}
                >
                  {type === "all" ? "All roles" : type}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Jobs feed */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-5 flex items-baseline justify-between">
          <h2 className="font-heading text-lg font-bold tracking-tight md:text-xl">
            {hasFilters ? "Matching openings" : "Latest openings"}
          </h2>
          {!loading && (
            <p className="text-sm text-muted-foreground">
              {filteredJobs.length} {filteredJobs.length === 1 ? "result" : "results"}
            </p>
          )}
        </div>

        {loading ? (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse rounded-2xl border border-border bg-card p-5">
                <div className="flex gap-3">
                  <div className="h-11 w-11 rounded-xl bg-muted" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 rounded bg-muted" />
                    <div className="h-3 w-1/2 rounded bg-muted" />
                  </div>
                </div>
                <div className="mt-5 h-3 w-2/3 rounded bg-muted" />
                <div className="mt-4 flex gap-2">
                  <div className="h-6 w-20 rounded-full bg-muted" />
                  <div className="h-6 w-16 rounded-full bg-muted" />
                </div>
                <div className="mt-5 h-8 rounded bg-muted" />
              </div>
            ))}
          </div>
        ) : filteredJobs.length === 0 ? (
          <Card className="flex flex-col items-center justify-center px-6 py-16 text-center">
            <span className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-muted-foreground">
              <SearchX className="h-6 w-6" />
            </span>
            <h3 className="font-heading text-lg font-semibold">No openings match your search</h3>
            <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
              Try a different keyword, widen the location, or clear your filters to see everything
              that's live right now.
            </p>
            {hasFilters && (
              <Button variant="outline" className="mt-5" onClick={clearAll}>
                Clear filters
              </Button>
            )}
          </Card>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {filteredJobs.map((job) => (
              <JobFeedCard key={job.id} job={job} onClick={() => handleJobClick(job)} />
            ))}
          </div>
        )}
      </section>

      <div className="container mx-auto px-4 pb-20">
        <Card className="flex flex-col items-center gap-4 border-primary/20 bg-gradient-to-r from-primary/10 to-primary/[0.03] p-6 text-center md:flex-row md:justify-between md:p-8 md:text-left">
          <div>
            <h3 className="font-heading text-lg font-bold md:text-xl">Want smarter matches?</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Keep your profile updated so recruiters find you and the assistant recommends better roles.
            </p>
          </div>
          <Link to="/candidate-dashboard" className="shrink-0">
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
