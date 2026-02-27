import { motion } from "framer-motion";
import { MapPin, Clock, DollarSign, Bookmark, ArrowRight, Zap } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerificationBadge from "@/components/recruiter/VerificationBadge";
import { formatDistanceToNow } from "date-fns";
import { JobWithRecruiter } from "@/hooks/useJobsWithRecruiters";

interface FeaturedJobsProps {
  jobs: JobWithRecruiter[];
  onJobClick: (job: JobWithRecruiter) => void;
  loading: boolean;
}

const FeaturedJobs = ({ jobs, onJobClick, loading }: FeaturedJobsProps) => {
  if (loading) {
    return (
      <section className="py-16">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="card-elevated p-5 animate-pulse rounded-2xl">
                <div className="flex gap-3 mb-4">
                  <div className="w-12 h-12 bg-muted rounded-xl" />
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                    <div className="h-4 bg-muted rounded w-1/2" />
                  </div>
                </div>
                <div className="flex gap-2 mb-3">
                  <div className="h-6 bg-muted rounded-full w-20" />
                  <div className="h-6 bg-muted rounded-full w-16" />
                </div>
                <div className="h-4 bg-muted rounded w-1/3" />
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
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-primary" />
              <span className="text-sm font-medium text-primary">Latest Openings</span>
            </div>
            <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-2">
              Featured Jobs
            </h2>
            <p className="text-muted-foreground">
              Hand-picked opportunities from top institutions
            </p>
          </div>
          <Button variant="outline" className="hidden sm:flex gap-2 group">
            View All Jobs
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobs.slice(0, 6).map((job, index) => {
            const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });
            
            return (
              <motion.div
                key={job.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ y: -6 }}
                onClick={() => onJobClick(job)}
                className="relative cursor-pointer group"
              >
                {/* Gradient border on hover */}
                <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-primary/50 via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative card-elevated p-5 rounded-2xl h-full">
                  <button className="absolute top-4 right-4 p-2 rounded-full hover:bg-secondary transition-all opacity-0 group-hover:opacity-100 hover:scale-110">
                    <Bookmark className="w-4 h-4 text-muted-foreground" />
                  </button>

                  {/* Institution Header */}
                  <div className="flex items-start gap-3 mb-4">
                    <Avatar className="h-11 w-11 border-2 border-border shrink-0 group-hover:border-primary/30 transition-colors">
                      <AvatarImage src={job.recruiter?.avatar_url || undefined} alt={job.institute} />
                      <AvatarFallback className="bg-primary/10 text-primary text-xs font-bold">
                        {job.institute.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-heading font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-1">
                        {job.title}
                      </h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <p className="text-sm text-primary/80 font-medium truncate">{job.institute}</p>
                        {job.recruiter?.isVerified && (
                          <VerificationBadge status="verified" size="sm" showLabel={false} />
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" />
                      <span>{job.location}</span>
                    </div>
                    {job.salary_range && (
                      <div className="flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5" />
                        <span>{job.salary_range}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2 mb-4">
                    {job.job_type && (
                      <Badge variant="secondary" className="rounded-full">{job.job_type}</Badge>
                    )}
                    {job.tags?.slice(0, 2).map((tag) => (
                      <Badge key={tag} variant="outline" className="rounded-full">{tag}</Badge>
                    ))}
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-border">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{timeAgo}</span>
                    </div>
                    <span className="text-sm text-primary font-semibold group-hover:underline">
                      Apply Now →
                    </span>
                  </div>
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
