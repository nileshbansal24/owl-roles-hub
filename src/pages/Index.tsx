import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import EnhancedHeroSection from "@/components/EnhancedHeroSection";
import AnimatedJobCard from "@/components/AnimatedJobCard";
import JobDetailModal from "@/components/JobDetailModal";
import JobFilters from "@/components/JobFilters";
import UniversityPartners from "@/components/UniversityPartners";
import { Loader2, Briefcase } from "lucide-react";

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

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const fetchJobs = async () => {
      const { data, error } = await supabase
        .from("jobs")
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
        job.institute.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesLocation =
        locationQuery === "" ||
        job.location.toLowerCase().includes(locationQuery.toLowerCase());

      const matchesDesignation =
        selectedDesignations.length === 0 ||
        selectedDesignations.some(
          (d) =>
            job.title.toLowerCase().includes(d.toLowerCase()) ||
            job.tags?.some((tag) => tag.toLowerCase().includes(d.toLowerCase()))
        );

      const matchesJobType =
        selectedJobTypes.length === 0 ||
        (job.job_type && selectedJobTypes.includes(job.job_type));

      return matchesSearch && matchesLocation && matchesDesignation && matchesJobType;
    });
  }, [jobs, searchQuery, locationQuery, selectedDesignations, selectedJobTypes]);

  const handleJobClick = (job: Job) => {
    setSelectedJob(job);
    setModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <EnhancedHeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        locationQuery={locationQuery}
        setLocationQuery={setLocationQuery}
      />

      {/* University Partners Section */}
      <UniversityPartners />

      {/* Job Listings Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="font-heading text-3xl md:text-4xl font-bold text-foreground mb-3">
              Latest Opportunities
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Explore academic positions from leading institutions across India
            </p>
          </motion.div>

          <div className="flex flex-col lg:flex-row gap-8">
            <JobFilters
              selectedDesignations={selectedDesignations}
              setSelectedDesignations={setSelectedDesignations}
              selectedJobTypes={selectedJobTypes}
              setSelectedJobTypes={setSelectedJobTypes}
            />

            <div className="flex-1">
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="flex items-center justify-between mb-6"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Briefcase className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-heading font-semibold text-lg text-foreground">
                      {loading ? "Loading..." : `${filteredJobs.length} Jobs Found`}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      Updated in real-time
                    </p>
                  </div>
                </div>
              </motion.div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  >
                    <Loader2 className="h-8 w-8 text-primary" />
                  </motion.div>
                </div>
              ) : filteredJobs.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="card-elevated p-12 text-center"
                >
                  <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">
                    No jobs found matching your criteria.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  variants={containerVariants}
                  initial="hidden"
                  animate="visible"
                  className="grid gap-4"
                >
                  {filteredJobs.map((job, index) => (
                    <AnimatedJobCard
                      key={job.id}
                      job={job}
                      index={index}
                      onClick={() => handleJobClick(job)}
                    />
                  ))}
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Job Detail Modal */}
      <JobDetailModal
        job={selectedJob}
        open={modalOpen}
        onOpenChange={setModalOpen}
      />
    </div>
  );
};

export default Index;
