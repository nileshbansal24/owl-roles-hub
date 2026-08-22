import { MapPin, Clock, IndianRupee, Bookmark, Building2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import VerificationBadge from "@/components/recruiter/VerificationBadge";
import { formatDistanceToNow } from "date-fns";
import { JobWithRecruiter } from "@/hooks/useJobsWithRecruiters";

interface JobFeedCardProps {
  job: JobWithRecruiter;
  onClick: () => void;
}

const JobFeedCard = ({ job, onClick }: JobFeedCardProps) => {
  const timeAgo = formatDistanceToNow(new Date(job.created_at), { addSuffix: true });

  return (
    <article
      onClick={onClick}
      className="group relative flex flex-col rounded-2xl border border-border bg-card p-5 transition-all hover:border-primary/40 hover:shadow-lg cursor-pointer"
    >
      <button
        type="button"
        aria-label="Save job"
        onClick={(e) => e.stopPropagation()}
        className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground opacity-0 transition-opacity hover:bg-secondary group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Bookmark className="h-4 w-4" />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <Avatar className="h-11 w-11 shrink-0 rounded-xl border border-border">
          <AvatarImage src={job.recruiter?.avatar_url || undefined} alt={job.institute} />
          <AvatarFallback className="rounded-xl bg-primary/10 text-xs font-bold text-primary">
            {job.institute.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <h3 className="font-heading font-semibold leading-snug text-foreground transition-colors group-hover:text-primary line-clamp-2">
            {job.title}
          </h3>
          <div className="mt-1 flex items-center gap-1.5">
            <Building2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <p className="truncate text-sm font-medium text-muted-foreground">{job.institute}</p>
            {job.recruiter?.isVerified && <VerificationBadge status="verified" size="sm" showLabel={false} />}
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          {job.location}
        </span>
        {job.salary_range && (
          <span className="inline-flex items-center gap-1.5">
            <IndianRupee className="h-3.5 w-3.5" />
            {job.salary_range}
          </span>
        )}
      </div>

      {(job.job_type || job.tags?.length) && (
        <div className="mt-4 flex flex-wrap gap-2">
          {job.job_type && (
            <Badge variant="secondary" className="rounded-full text-xs font-medium">
              {job.job_type}
            </Badge>
          )}
          {job.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="outline" className="rounded-full text-xs font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}

      <div className="mt-auto flex items-center justify-between border-t border-border pt-4 mt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
          <Clock className="h-3.5 w-3.5" />
          {timeAgo}
        </span>
        <Button size="sm" className="h-8 px-4 text-xs font-semibold">
          View & Apply
        </Button>
      </div>
    </article>
  );
};

export default JobFeedCard;
