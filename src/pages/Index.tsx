import { useState, useMemo, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useJobsWithRecruiters, JobWithRecruiter } from "@/hooks/useJobsWithRecruiters";
import Navbar from "@/components/Navbar";
import NaukriHeroSection from "@/components/NaukriHeroSection";
import JobCategories from "@/components/JobCategories";
import FeaturedJobs from "@/components/FeaturedJobs";
import TopCompanies from "@/components/TopCompanies";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import HowItWorks from "@/components/HowItWorks";
import Footer from "@/components/Footer";
import JobDetailModal from "@/components/JobDetailModal";
import AuthModal from "@/components/AuthModal";
import { Loader2 } from "lucide-react";

const Index = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [redirecting, setRedirecting] = useState(false);
  const { jobs, loading: jobsLoading } = useJobsWithRecruiters();
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<JobWithRecruiter | null>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authRole, setAuthRole] = useState<"candidate" | "recruiter">("candidate");

  const filteredJobs = useMemo(() => {
    return jobs.filter((job) => {
      const matchesSearch =
        searchQuery === "" ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.institute.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.tags?.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesLocation =
        locationQuery === "" ||
        job.location.toLowerCase().includes(locationQuery.toLowerCase());
      return matchesSearch && matchesLocation;
    });
  }, [jobs, searchQuery, locationQuery]);

  useEffect(() => {
    if (authLoading || !user) return;
    supabase
      .from("profiles")
      .select("user_type")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data?.user_type === "recruiter") {
          setRedirecting(true);
          navigate("/recruiter-dashboard", { replace: true });
        }
      });
  }, [user, authLoading, navigate]);

  if (authLoading || redirecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const handleJobClick = (job: JobWithRecruiter) => {
    setSelectedJob(job);
    setJobModalOpen(true);
  };

  const handleCategoryClick = (category: string) => {
    setSearchQuery(category);
    setTimeout(() => {
      document.getElementById("featured-jobs")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const handleSearch = () => {};

  const openAuthModal = (mode: "login" | "signup", role: "candidate" | "recruiter") => {
    setAuthMode(mode);
    setAuthRole(role);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar 
        onLoginClick={() => openAuthModal("login", "candidate")}
        onSignupClick={() => openAuthModal("signup", "candidate")}
      />

      {/* Hero */}
      <NaukriHeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        locationQuery={locationQuery}
        setLocationQuery={setLocationQuery}
        experienceFilter={experienceFilter}
        setExperienceFilter={setExperienceFilter}
        onSearch={handleSearch}
        isLoggedIn={!!user}
        onGetStarted={() => openAuthModal("signup", "candidate")}
      />

      {/* Categories — subtle alternate bg */}
      <div className="bg-secondary/30">
        <JobCategories onCategoryClick={handleCategoryClick} />
      </div>

      {/* How It Works */}
      <div className="border-t border-border/40">
        <HowItWorks />
      </div>

      {/* Featured Jobs — alternate bg */}
      <div id="featured-jobs" className="bg-secondary/30 border-t border-border/40">
        {user ? (
          <FeaturedJobs 
            jobs={filteredJobs} 
            onJobClick={handleJobClick}
            loading={jobsLoading}
            searchQuery={searchQuery}
            onClearSearch={() => setSearchQuery("")}
          />
        ) : (
          <section className="py-16">
            <div className="container mx-auto px-4 text-center">
              <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
                Featured Faculty & Research Jobs
              </h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Sign in to unlock fresh openings from universities hiring this week.
              </p>
              <Button onClick={() => openAuthModal("login", "candidate")} className="gap-2">
                Log in to view openings
              </Button>
            </div>
          </section>
        )}
      </div>

      {/* Top Institutions */}
      <div id="institutions" className="border-t border-border/40">
        <TopCompanies onViewJobs={handleCategoryClick} />
      </div>

      {/* Testimonials — alternate bg */}
      <div className="bg-secondary/30 border-t border-border/40">
        <TestimonialsSection />
      </div>

      {/* CTA */}
      <div className="border-t border-border/40">
        <CTASection 
          onCandidateClick={() => openAuthModal("signup", "candidate")}
          onRecruiterClick={() => openAuthModal("signup", "recruiter")}
        />
      </div>

      <Footer />

      <JobDetailModal
        job={selectedJob}
        open={jobModalOpen}
        onOpenChange={setJobModalOpen}
      />

      <AuthModal
        open={authModalOpen}
        onOpenChange={setAuthModalOpen}
        defaultMode={authMode}
        defaultRole={authRole}
      />
    </div>
  );
};

export default Index;
