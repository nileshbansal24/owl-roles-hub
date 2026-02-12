import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { useAuth } from "@/contexts/AuthContext";
import { useJobsWithRecruiters, JobWithRecruiter } from "@/hooks/useJobsWithRecruiters";
import Navbar from "@/components/Navbar";
import NaukriHeroSection from "@/components/NaukriHeroSection";
import StatsSection from "@/components/StatsSection";
import JobCategories from "@/components/JobCategories";
import FeaturedJobs from "@/components/FeaturedJobs";
import TopCompanies from "@/components/TopCompanies";
import UniversityPartners from "@/components/UniversityPartners";
import TestimonialsSection from "@/components/TestimonialsSection";
import CTASection from "@/components/CTASection";
import Footer from "@/components/Footer";
import JobDetailModal from "@/components/JobDetailModal";
import AuthModal from "@/components/AuthModal";

const Index = () => {
  const { user } = useAuth();
  const { jobs, loading } = useJobsWithRecruiters();
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

  const handleJobClick = (job: JobWithRecruiter) => {
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

      <div id="institutions">
        <TopCompanies />
      </div>

      <TestimonialsSection />

      <div id="services">
        <UniversityPartners />
      </div>

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
