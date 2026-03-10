import { motion } from "framer-motion";
import { MapPin, Briefcase, Star, ExternalLink, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Company {
  name: string;
  logo: string;
  location: string;
  openings: number;
  rating: number;
  type: string;
}

const companies: Company[] = [
  { name: "Lovely Professional University", logo: "LPU", location: "Punjab", openings: 45, rating: 4.5, type: "Private" },
  { name: "Chitkara University", logo: "CU", location: "Punjab", openings: 28, rating: 4.3, type: "Private" },
  { name: "Amity University", logo: "AU", location: "Noida", openings: 52, rating: 4.2, type: "Private" },
  { name: "IIT Delhi", logo: "IIT", location: "Delhi", openings: 23, rating: 4.8, type: "Government" },
  { name: "IIM Bangalore", logo: "IIM", location: "Bangalore", openings: 15, rating: 4.9, type: "Government" },
];

interface TopCompaniesProps {
  onViewJobs?: (instituteName: string) => void;
}

const TopCompanies = ({ onViewJobs }: TopCompaniesProps) => {
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
              Top Institutions
            </span>
            <h2 className="font-heading text-2xl md:text-4xl font-extrabold text-foreground mb-2 tracking-tight">
              Top Hiring Universities
            </h2>
            <p className="text-muted-foreground font-medium">
              Leading institutions actively recruiting talent
            </p>
          </div>
          <motion.button
            whileHover={{ x: 4 }}
            className="text-primary hover:underline font-semibold hidden sm:flex items-center gap-1.5"
          >
            View all universities
            <ExternalLink className="w-4 h-4" />
          </motion.button>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {companies.map((company, index) => (
            <motion.div
              key={company.name}
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
                    <span className="font-heading font-extrabold text-primary text-lg">{company.logo}</span>
                  </motion.div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors truncate">
                      {company.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{company.location}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-2">
                      <Badge variant="secondary" className="gap-1">
                        <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                        {company.rating}
                      </Badge>
                      <Badge variant="outline">{company.type}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm">
                    <Briefcase className="w-4 h-4 text-primary" />
                    <span className="font-semibold text-foreground">{company.openings} openings</span>
                  </div>
                  <motion.button
                    whileHover={{ x: 3 }}
                    onClick={(e) => { e.stopPropagation(); onViewJobs?.(company.name); }}
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
