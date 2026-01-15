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
}

interface JobCardProps {
  job: Job;
}

const JobCard = ({ job }: JobCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  return (
    <div className="card-elevated p-6 transition-all duration-300 hover:-translate-y-1 cursor-pointer group">
      <div className="flex items-start justify-between gap-4 mb-4">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-lg text-foreground group-hover:text-primary transition-colors line-clamp-1">
            {job.title}
          </h3>
          <p className="text-muted-foreground font-medium mt-1">{job.institute}</p>
        </div>
        <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center shrink-0">
          <Briefcase className="h-6 w-6 text-muted-foreground" />
        </div>
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
        {job.tags?.slice(0, 3).map((tag, index) => (
          <Badge key={index} variant="outline" className="font-normal">
            {tag}
          </Badge>
        ))}
      </div>
    </div>
  );
};

export default JobCard;