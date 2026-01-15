import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import JobCard from "@/components/JobCard";
import JobFilters from "@/components/JobFilters";
import { Loader2 } from "lucide-react";

interface Job {
  id: string;
  title: string;
  institute: string;
  location: string;
  salary_range: string | null;
  job_type: string | null;
  tags: string[] | null;
  created_at: string;
}

const Index = () => {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [locationQuery, setLocationQuery] = useState("");
  const [selectedDesignations, setSelectedDesignations] = useState<string[]>([]);
  const [selectedJobTypes, setSelectedJobTypes] = useState<string[]>([]);

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
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        job.institute.toLowerCase().includes(searchQuery.toLowerCase());

      // Location filter
      const matchesLocation =
        locationQuery === "" ||
        job.location.toLowerCase().includes(locationQuery.toLowerCase());

      // Designation filter
      const matchesDesignation =
        selectedDesignations.length === 0 ||
        selectedDesignations.some(
          (d) =>
            job.title.toLowerCase().includes(d.toLowerCase()) ||
            job.tags?.some((tag) => tag.toLowerCase().includes(d.toLowerCase()))
        );

      // Job type filter
      const matchesJobType =
        selectedJobTypes.length === 0 ||
        (job.job_type && selectedJobTypes.includes(job.job_type));

      return matchesSearch && matchesLocation && matchesDesignation && matchesJobType;
    });
  }, [jobs, searchQuery, locationQuery, selectedDesignations, selectedJobTypes]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <HeroSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        locationQuery={locationQuery}
        setLocationQuery={setLocationQuery}
      />

      <section className="pb-20">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            <JobFilters
              selectedDesignations={selectedDesignations}
              setSelectedDesignations={setSelectedDesignations}
              selectedJobTypes={selectedJobTypes}
              setSelectedJobTypes={setSelectedJobTypes}
            />

            <div className="flex-1">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-heading font-semibold text-xl text-foreground">
                  {loading ? "Loading..." : `${filteredJobs.length} Jobs Found`}
                </h2>
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredJobs.length === 0 ? (
                <div className="card-elevated p-12 text-center">
                  <p className="text-muted-foreground">
                    No jobs found matching your criteria.
                  </p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {filteredJobs.map((job, index) => (
                    <div
                      key={job.id}
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 0.05}s` }}
                    >
                      <JobCard job={job} />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;