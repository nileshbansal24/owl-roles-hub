import { motion } from "framer-motion";
import { MapPin, Clock, Briefcase, DollarSign } from "lucide-react";
import { Badge } from "@/components/ui/badge";
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

interface AnimatedJobCardProps {
  job: Job;
  index: number;
  onClick: () => void;
}

const AnimatedJobCard = ({ job, index, onClick }: AnimatedJobCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.05,
        ease: [0.25, 0.1, 0.25, 1]
      }}
      whileHover={{ 
        y: -4,
        transition: { duration: 0.2 }
      }}
      onClick={onClick}
      className="card-elevated p-6 cursor-pointer group"
    >
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {job.title}
          </h3>
          <p className="text-muted-foreground font-medium mt-1">{job.institute}</p>
        </div>
        <motion.div 
          className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0"
          whileHover={{ rotate: 5, scale: 1.05 }}
          transition={{ type: "spring" as const, stiffness: 300 }}
        >
          <Briefcase className="h-6 w-6 text-muted-foreground group-hover:text-primary transition-colors" />
        </motion.div>
      </div>

      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground mb-4">
        <div className="flex items-center gap-1.5">
          <MapPin className="h-4 w-4" />
          <span>{job.location}</span>
        </div>
        {job.salary_range && (
          <div className="flex items-center gap-1.5">
            <DollarSign className="h-4 w-4" />
            <span>{job.salary_range}</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <Clock className="h-4 w-4" />
          <span>{timeAgo}</span>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {job.job_type && (
          <Badge variant="secondary" className="font-medium">
            {job.job_type}
          </Badge>
        )}
        {job.tags?.slice(0, 3).map((tag, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 + i * 0.05 + 0.2 }}
          >
            <Badge variant="outline" className="font-normal">
              {tag}
            </Badge>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
};

export default AnimatedJobCard;
