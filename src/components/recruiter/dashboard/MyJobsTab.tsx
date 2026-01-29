import { motion } from "framer-motion";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Clock, MapPin, Briefcase, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { containerVariants, itemVariants } from "@/types/recruiter";
import type { Job, Application } from "@/types/recruiter";

interface MyJobsTabProps {
  jobs: Job[];
  applications: Application[];
  onViewJobApplications: (jobId: string) => void;
}

const MyJobsTab = ({ jobs, applications, onViewJobApplications }: MyJobsTabProps) => {
  const navigate = useNavigate();

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {jobs.length === 0 ? (
        <motion.div variants={itemVariants} className="card-elevated p-12 text-center">
          <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground mb-4">
            You haven't posted any jobs yet.
          </p>
          <Button onClick={() => navigate("/post-job")} className="gap-2">
            <Plus className="h-4 w-4" />
            Post Your First Job
          </Button>
        </motion.div>
      ) : (
        jobs.map((job, index) => {
          const jobApps = applications.filter((app) => app.job_id === job.id);
          return (
            <motion.div
              key={job.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="card-elevated p-6"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <h4 className="font-heading font-semibold text-lg text-foreground">{job.title}</h4>
                  <p className="text-muted-foreground">{job.institute}</p>
                  <div className="flex flex-wrap items-center gap-4 mt-2 text-sm text-muted-foreground">
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
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-foreground">{jobApps.length}</p>
                    <p className="text-xs text-muted-foreground">Applications</p>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onViewJobApplications(job.id)}
                  >
                    View Details
                  </Button>
                </div>
              </div>
            </motion.div>
          );
        })
      )}
    </motion.div>
  );
};

export default MyJobsTab;
