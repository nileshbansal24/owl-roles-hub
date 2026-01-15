import { motion } from "framer-motion";
import { MapPin, Clock, DollarSign, Bookmark, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";

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

interface FeaturedJobsProps {
  jobs: Job[];
  onJobClick: (job: Job) => void;
  loading: boolean;
}

const FeaturedJobs = ({ jobs, onJobClick, loading }: FeaturedJobsProps) => {
  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-elevated p-5 animate-pulse">
                <div className="h-6 bg-muted rounded w-3/4 mb-3" />
                <div className="h-4 bg-muted rounded w-1/2 mb-4" />
                <div className="flex gap-2">
                  <div className="h-6 bg-muted rounded w-20" />
                  <div className="h-6 bg-muted rounded w-16" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="flex items-center justify-between mb-10"
        >
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
              Featured Jobs
            </h2>
            <p className="text-muted-foreground">
              Hand-picked opportunities from top institutions
            </p>
          </div>
          <Button variant="outline" className="hidden sm:flex gap-2">
            View All Jobs
            <ArrowRight className="w-4 h-4" />
          </Button>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {jobs.slice(0, 6).map((job, index) => {
            const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });
            
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -4 }}
                onClick={() => onJobClick(job)}
                className="card-elevated p-5 cursor-pointer group relative"
              >
                <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-colors opacity-0 group-hover:opacity-100">
                  <Bookmark className="w-4 h-4 text-muted-foreground" />
                </button>

                <div className="mb-3">
                  <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                    {job.title}
                  </h3>
                  <p className="text-sm text-primary font-medium mt-1">{job.institute}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                  <div className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5" />
                    <span>{job.location}</span>
                  </div>
                  {job.salary_range && (
                    <div className="flex items-center gap-1">
                      <DollarSign className="w-3.5 h-3.5" />
                      <span>{job.salary_range}</span>
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {job.job_type && (
                    <Badge variant="secondary">{job.job_type}</Badge>
                  )}
                  {job.tags?.slice(0, 2).map((tag) => (
                    <Badge key={tag} variant="outline">{tag}</Badge>
                  ))}
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Clock className="w-3.5 h-3.5" />
                    <span>{timeAgo}</span>
                  </div>
                  <button className="text-sm text-primary font-medium hover:underline">
                    Apply Now
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <div className="text-center mt-8 sm:hidden">
          <Button variant="outline" className="gap-2">
            View All Jobs
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedJobs;
