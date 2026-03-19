import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MapPin, Briefcase, TrendingUp, Users, Building2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface UniversityStats {
  name: string;
  initials: string;
  jobCount: number;
  applicationCount: number;
}

interface TopCompaniesProps {
  onViewJobs?: (instituteName: string) => void;
}

const getInitials = (name: string): string => {
  const words = name.split(/\s+/);
  if (words.length === 1) return words[0].substring(0, 3).toUpperCase();
  // Check for common acronyms
  const upper = name.replace(/[^A-Z]/g, "");
  if (upper.length >= 2 && upper.length <= 5) return upper;
  return words.map(w => w[0]).join("").substring(0, 4).toUpperCase();
};

const TopCompanies = ({ onViewJobs }: TopCompaniesProps) => {
  const [universities, setUniversities] = useState<UniversityStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch all jobs to count by institute
        const { data: jobs } = await supabase
          .from("jobs_public")
          .select("id, institute");

        if (!jobs || jobs.length === 0) {
          setUniversities([]);
          setLoading(false);
          return;
        }

        // Count jobs per institute
        const jobCountMap = new Map<string, { count: number; ids: string[] }>();
        jobs.forEach((j) => {
          const inst = j.institute || "Unknown";
          const entry = jobCountMap.get(inst) || { count: 0, ids: [] };
          entry.count++;
          if (j.id) entry.ids.push(j.id);
          jobCountMap.set(inst, entry);
        });

        // Fetch application counts per job
        const allJobIds = jobs.map((j) => j.id).filter(Boolean) as string[];
        const { data: applications } = allJobIds.length > 0
          ? await supabase
              .from("job_applications")
              .select("job_id")
              .in("job_id", allJobIds)
          : { data: [] };

        // Count applications per institute
        const appCountMap = new Map<string, number>();
        const jobToInstitute = new Map<string, string>();
        jobs.forEach((j) => {
          if (j.id && j.institute) jobToInstitute.set(j.id, j.institute);
        });

        applications?.forEach((a) => {
          const inst = jobToInstitute.get(a.job_id);
          if (inst) {
            appCountMap.set(inst, (appCountMap.get(inst) || 0) + 1);
          }
        });

        // Build sorted list: sort by jobs + applications combined
        const stats: UniversityStats[] = Array.from(jobCountMap.entries())
          .map(([name, { count }]) => ({
            name,
            initials: getInitials(name),
            jobCount: count,
            applicationCount: appCountMap.get(name) || 0,
          }))
          .sort((a, b) => (b.jobCount + b.applicationCount) - (a.jobCount + a.applicationCount))
          .slice(0, 6);

        setUniversities(stats);
      } catch (error) {
        console.error("Error fetching university stats:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (universities.length === 0) return null;

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3">
              <Building2 className="w-4 h-4 inline mr-1.5 -mt-0.5" />
              Live Data
            </span>
            <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight">
              Top Hiring Universities
            </h2>
            <p className="text-muted-foreground font-medium">
              Institutions with the most openings &amp; hirings — updated in real time
            </p>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((uni, index) => (
            <motion.div
              key={uni.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, type: "spring", stiffness: 100, damping: 12 }}
              className="group"
            >
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="card-elevated p-5 cursor-pointer h-full"
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ rotate: 6, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors"
                  >
                    <span className="font-heading font-extrabold text-primary text-sm">
                      {uni.initials}
                    </span>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm md:text-base">
                      {uni.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-2 flex-wrap">
                      <Badge variant="secondary" className="gap-1">
                        <Briefcase className="w-3 h-3" />
                        {uni.jobCount} {uni.jobCount === 1 ? "Job" : "Jobs"}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        {uni.applicationCount} {uni.applicationCount === 1 ? "Application" : "Applications"}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-end mt-4 pt-4 border-t border-border">
                  <motion.button
                    whileHover={{ x: 3 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onViewJobs?.(uni.name);
                    }}
                    className="text-sm text-primary hover:underline font-semibold flex items-center gap-1"
                  >
                    View Jobs
                    <TrendingUp className="w-3.5 h-3.5" />
                  </motion.button>
                </div>
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopCompanies;
