import { motion } from "framer-motion";
import { Briefcase, Users, FileText, CheckCircle2, ArrowUpRight, ArrowDownRight, Minus } from "lucide-react";
import type { Job, Application, Profile } from "@/types/recruiter";

interface StatsCardsProps {
  jobs: Job[];
  applications: Application[];
  candidates: Profile[];
  onCardClick?: (tab: string) => void;
}

const StatsCards = ({ jobs, applications, candidates, onCardClick }: StatsCardsProps) => {

  const shortlisted = applications.filter((app) => app.status === "shortlisted").length;
  const pending = applications.filter(a => a.status === "pending").length;
  const shortlistRate = applications.length > 0 ? Math.round((shortlisted / applications.length) * 100) : 0;

  const stats = [
    {
      title: "Active Jobs",
      value: jobs.length,
      icon: Briefcase,
      subtitle: `${jobs.length > 0 ? "Positions open" : "No active posts"}`,
      trendIcon: jobs.length > 0 ? ArrowUpRight : Minus,
      trendColor: jobs.length > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
      accent: "bg-primary/8 dark:bg-primary/15",
      iconColor: "text-primary",
    },
    {
      title: "Applications",
      value: applications.length,
      icon: FileText,
      subtitle: `${pending} pending review`,
      trendIcon: pending > 0 ? ArrowUpRight : Minus,
      trendColor: pending > 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground",
      accent: "bg-amber-500/8 dark:bg-amber-500/15",
      iconColor: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Talent Pool",
      value: candidates.length,
      icon: Users,
      subtitle: "Available candidates",
      trendIcon: candidates.length > 0 ? ArrowUpRight : Minus,
      trendColor: candidates.length > 0 ? "text-sky-600 dark:text-sky-400" : "text-muted-foreground",
      accent: "bg-sky-500/8 dark:bg-sky-500/15",
      iconColor: "text-sky-600 dark:text-sky-400",
    },
    {
      title: "Shortlisted",
      value: shortlisted,
      icon: CheckCircle2,
      subtitle: `${shortlistRate}% conversion rate`,
      trendIcon: shortlistRate > 20 ? ArrowUpRight : shortlistRate > 0 ? Minus : ArrowDownRight,
      trendColor: shortlistRate > 20 ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground",
      accent: "bg-emerald-500/8 dark:bg-emerald-500/15",
      iconColor: "text-emerald-600 dark:text-emerald-400",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.35, ease: "easeOut" }}
          className="group"
        >
          <div className="relative rounded-xl border border-border/60 bg-card p-4 sm:p-5 hover:border-border hover:shadow-[var(--shadow-soft)] transition-all duration-200">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-9 h-9 rounded-lg ${stat.accent} flex items-center justify-center`}>
                <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
              </div>
              <stat.trendIcon className={`h-3.5 w-3.5 ${stat.trendColor} opacity-60`} />
            </div>
            <motion.p
              className="text-2xl sm:text-[28px] font-bold font-heading text-foreground tracking-tight leading-none"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: index * 0.05 + 0.15, type: "spring", stiffness: 300, damping: 25 }}
            >
              {stat.value.toLocaleString()}
            </motion.p>
            <p className="text-[13px] font-medium text-foreground/80 mt-1.5">{stat.title}</p>
            <p className="text-[11px] text-muted-foreground mt-0.5">{stat.subtitle}</p>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
