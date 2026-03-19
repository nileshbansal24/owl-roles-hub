import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Building2, Loader2, TrendingUp, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

interface UniversityStats {
  name: string;
  initials: string;
  jobCount: number;
  hiringCount: number;
}

interface PublicLandingDataResponse {
  topInstitutions?: UniversityStats[];
}

interface TopCompaniesProps {
  onViewJobs?: (instituteName: string) => void;
}

const TopCompanies = ({ onViewJobs }: TopCompaniesProps) => {
  const [universities, setUniversities] = useState<UniversityStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isActive = true;

    const fetchTopInstitutions = async () => {
      try {
        const { data, error } = await supabase.functions.invoke("public-landing-data");

        if (error) throw error;

        if (isActive) {
          setUniversities((data as PublicLandingDataResponse | null)?.topInstitutions || []);
        }
      } catch (error) {
        console.error("Error fetching top institutions:", error);
      } finally {
        if (isActive) {
          setLoading(false);
        }
      }
    };

    fetchTopInstitutions();

    return () => {
      isActive = false;
    };
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
            <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-3 gap-1.5">
              <Building2 className="w-4 h-4" />
              Top Institutions
            </span>
            <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight">
              Top Hiring Institutions
            </h2>
            <p className="text-muted-foreground font-medium">
              Top 6 universities ranked by job volume and hiring activity
            </p>
          </div>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {universities.map((university, index) => (
            <motion.div
              key={university.name}
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08, type: "spring", stiffness: 100, damping: 12 }}
              className="group"
            >
              <motion.div
                whileHover={{ y: -6, scale: 1.02 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="card-elevated p-5 cursor-pointer h-full"
              >
                <div className="flex items-start gap-4">
                  <motion.div
                    whileHover={{ rotate: 6, scale: 1.08 }}
                    transition={{ type: "spring", stiffness: 400 }}
                    className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/20 transition-colors"
                  >
                    <span className="font-heading font-extrabold text-primary text-sm">
                      {university.initials}
                    </span>
                  </motion.div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm md:text-base">
                      {university.name}
                    </h3>
                    <div className="flex items-center gap-3 mt-3 flex-wrap">
                      <Badge variant="secondary" className="gap-1">
                        <Briefcase className="w-3 h-3" />
                        {university.jobCount} {university.jobCount === 1 ? "Job" : "Jobs"}
                      </Badge>
                      <Badge variant="outline" className="gap-1">
                        <Users className="w-3 h-3" />
                        {university.hiringCount} {university.hiringCount === 1 ? "Hiring" : "Hirings"}
                      </Badge>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end mt-4 pt-4 border-t border-border">
                  <motion.button
                    whileHover={{ x: 3 }}
                    onClick={(event) => {
                      event.stopPropagation();
                      onViewJobs?.(university.name);
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
