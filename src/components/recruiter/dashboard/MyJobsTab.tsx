import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Clock, MapPin, Briefcase, Plus, Users, Eye, TrendingUp } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { EmptyState } from "@/components/ui/empty-state";
import { JobCardSkeleton } from "@/components/ui/loading-skeleton";
import { staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import type { Job, Application } from "@/types/recruiter";

interface MyJobsTabProps {
  jobs: Job[];
  applications: Application[];
  onViewJobApplications: (jobId: string) => void;
  isLoading?: boolean;
}

const MyJobsTab = ({ jobs, applications, onViewJobApplications, isLoading = false }: MyJobsTabProps) => {
  const navigate = useNavigate();

  if (isLoading) {
    return (
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <JobCardSkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {jobs.length === 0 ? (
        <EmptyState
          icon={Briefcase}
          title="No jobs posted yet"
          description="Start attracting top academic talent by posting your first job opening. It only takes a few minutes to create a compelling job listing."
          action={{
            label: "Post Your First Job",
            onClick: () => navigate("/post-job"),
            icon: Plus,
          }}
        >
          <div className="flex flex-wrap justify-center gap-3 mt-4">
            {["Professor", "Dean", "Research Director", "HOD"].map((role) => (
              <Badge key={role} variant="secondary" className="text-xs">
                {role}
              </Badge>
            ))}
          </div>
        </EmptyState>
      ) : (
        <>
          {/* Summary Stats */}
          <motion.div 
            variants={staggerItemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-4"
          >
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{jobs.length}</p>
              <p className="text-sm text-muted-foreground">Active Jobs</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground">{applications.length}</p>
              <p className="text-sm text-muted-foreground">Total Applications</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-primary">
                {applications.filter(a => a.status === 'shortlisted').length}
              </p>
              <p className="text-sm text-muted-foreground">Shortlisted</p>
            </div>
            <div className="card-elevated p-4 text-center">
              <p className="text-2xl font-bold text-foreground">
                {jobs.length > 0 ? Math.round(applications.length / jobs.length) : 0}
              </p>
              <p className="text-sm text-muted-foreground">Avg per Job</p>
            </div>
          </motion.div>

          {/* Jobs List */}
          {jobs.map((job, index) => {
            const jobApps = applications.filter((app) => app.job_id === job.id);
            const shortlisted = jobApps.filter(a => a.status === 'shortlisted').length;
            const pending = jobApps.filter(a => a.status === 'pending').length;
            
            return (
              <motion.div
                key={job.id}
                variants={staggerItemVariants}
                whileHover={{ y: -2, boxShadow: "0 4px 20px rgba(0,0,0,0.08)" }}
                transition={{ duration: 0.2 }}
                className="card-elevated p-6"
              >
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <h4 className="font-heading font-semibold text-lg text-foreground">{job.title}</h4>
                        <p className="text-muted-foreground">{job.institute}</p>
                      </div>
                      {pending > 0 && (
                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400">
                          {pending} new
                        </Badge>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-4 w-4" />
                        <span>{job.location}</span>
                      </div>
                      {job.job_type && (
                        <div className="flex items-center gap-1">
                          <Briefcase className="h-4 w-4" />
                          <span>{job.job_type}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1">
                        <Clock className="h-4 w-4" />
                        <span>Posted {formatDistanceToNow(new Date(job.created_at), { addSuffix: true })}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-6">
                    {/* Stats */}
                    <div className="flex gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-1 justify-center">
                          <Users className="h-4 w-4 text-muted-foreground" />
                          <p className="text-2xl font-bold text-foreground">{jobApps.length}</p>
                        </div>
                        <p className="text-xs text-muted-foreground">Applications</p>
                      </div>
                      {shortlisted > 0 && (
                        <div className="text-center">
                          <div className="flex items-center gap-1 justify-center">
                            <TrendingUp className="h-4 w-4 text-primary" />
                            <p className="text-2xl font-bold text-primary">{shortlisted}</p>
                          </div>
                          <p className="text-xs text-muted-foreground">Shortlisted</p>
                        </div>
                      )}
                    </div>
                    
                    <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        onClick={() => onViewJobApplications(job.id)}
                      >
                        <Eye className="h-4 w-4" />
                        View Applications
                      </Button>
                    </motion.div>
                  </div>
                </div>
              </motion.div>
            );
          })}
          
          {/* Add More Jobs CTA */}
          <motion.div 
            variants={staggerItemVariants}
            className="text-center pt-4"
          >
            <Button 
              variant="outline" 
              size="lg"
              className="gap-2"
              onClick={() => navigate("/post-job")}
            >
              <Plus className="h-5 w-5" />
              Post Another Job
            </Button>
          </motion.div>
        </>
      )}
    </motion.div>
  );
};

export default MyJobsTab;
