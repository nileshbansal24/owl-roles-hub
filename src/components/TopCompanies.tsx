import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Briefcase, Building2, Loader2, ArrowRight, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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
        if (isActive) setLoading(false);
      }
    };
    fetchTopInstitutions();
    return () => { isActive = false; };
  }, []);

  if (loading) {
    return (
      <section className="py-12">
        <div className="container mx-auto px-4 flex justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </section>
    );
  }

  if (universities.length === 0) return null;

  return (
    <section className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-3 tracking-tight">
            Top Hiring Institutions
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Leading universities and colleges actively hiring on our platform
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {universities.map((university, index) => (
            <motion.div
              key={university.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.08 }}
              whileHover={{ y: -4 }}
              className="card-elevated p-5 cursor-pointer group hover:border-primary/30 transition-colors"
              onClick={() => onViewJobs?.(university.name)}
            >
              <div className="flex items-start gap-4">
                <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 group-hover:bg-primary/15 transition-colors">
                  <span className="font-heading font-extrabold text-primary text-sm">
                    {university.initials}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 text-sm md:text-base mb-2">
                    {university.name}
                  </h3>
                  <div className="flex items-center gap-2 flex-wrap">
                    <Badge variant="secondary" className="gap-1 text-xs">
                      <Briefcase className="w-3 h-3" />
                      {university.jobCount} {university.jobCount === 1 ? "Job" : "Jobs"}
                    </Badge>
                    <Badge variant="outline" className="gap-1 text-xs">
                      <Users className="w-3 h-3" />
                      {university.hiringCount} Hired
                    </Badge>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TopCompanies;
