import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import Navbar from "@/components/Navbar";
import NaukriHeroSection from "@/components/NaukriHeroSection";
import StatsSection from "@/components/StatsSection";
import JobCategories from "@/components/JobCategories";
import FeaturedJobs from "@/components/FeaturedJobs";
import TopCompanies from "@/components/TopCompanies";
import UniversityPartners from "@/components/UniversityPartners";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import JobDetailModal from "@/components/JobDetailModal";
import AuthModal from "@/components/AuthModal";

interface Job {
  id: string;
  title: string;
  institute: string;
  location: string;
  salary_range: string | null;
  job_type: string | null;
  tags: string[] | null;
  created_at: string;
  description?: string | null;
}

const Index = () => {
  const { user } = useAuth();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [experienceFilter, setExperienceFilter] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [jobModalOpen, setJobModalOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("signup");
  const [authRole, setAuthRole] = useState<"candidate" | "recruiter">("candidate");

  useEffect(() => {
    const fetchJobs = async () => {
      // Use jobs_public view which excludes created_by for privacy
      const { data, error } = await supabase
        .from("jobs_public")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching jobs:", error);
      } else {
        setJobs(data || []);
      }
      setLoading(false);
    };

    fetchJobs();
  }, []);

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

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setJobModalOpen(true);
  };

  const handleCategoryClick = (category: string) => {
    setSearchQuery(category);
  };

  const handleSearch = () => {
    // Search is already reactive via filteredJobs
  };

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

      <StatsSection />

      <JobCategories onCategoryClick={handleCategoryClick} />

      <FeaturedJobs 
        jobs={filteredJobs} 
        onJobClick={handleJobClick}
        loading={loading}
      />

      <TopCompanies />

      <UniversityPartners />

      <CTASection 
        onCandidateClick={() => openAuthModal("signup", "candidate")}
        onRecruiterClick={() => openAuthModal("signup", "recruiter")}
      />

      <Footer />

      {/* Modals */}
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
