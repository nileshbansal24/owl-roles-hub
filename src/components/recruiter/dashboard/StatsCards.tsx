import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, FileText, CheckCircle2, TrendingUp } from "lucide-react";
import type { Job, Application, Profile } from "@/types/recruiter";

interface StatsCardsProps {
  jobs: Job[];
  applications: Application[];
  candidates: Profile[];
}

const StatsCards = ({ jobs, applications, candidates }: StatsCardsProps) => {
  const shortlisted = applications.filter((app) => app.status === "shortlisted").length;
  
  const stats = [
    {
      title: "Active Jobs",
      value: jobs.length,
      icon: Briefcase,
      trend: "+2 this week",
      gradient: "from-primary/15 to-primary/5",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
      borderAccent: "border-l-primary",
    },
    {
      title: "Applications",
      value: applications.length,
      icon: FileText,
      trend: `${applications.filter(a => a.status === "pending").length} pending`,
      gradient: "from-emerald-500/10 to-emerald-500/5 dark:from-emerald-500/15 dark:to-emerald-500/5",
      iconBg: "bg-emerald-500/10",
      iconColor: "text-emerald-600 dark:text-emerald-400",
      borderAccent: "border-l-emerald-500",
    },
    {
      title: "Candidates",
      value: candidates.length,
      icon: Users,
      trend: "in talent pool",
      gradient: "from-sky-500/10 to-sky-500/5 dark:from-sky-500/15 dark:to-sky-500/5",
      iconBg: "bg-sky-500/10",
      iconColor: "text-sky-600 dark:text-sky-400",
      borderAccent: "border-l-sky-500",
    },
    {
      title: "Shortlisted",
      value: shortlisted,
      icon: CheckCircle2,
      trend: shortlisted > 0 ? `${Math.round((shortlisted / Math.max(applications.length, 1)) * 100)}% rate` : "0% rate",
      gradient: "from-violet-500/10 to-violet-500/5 dark:from-violet-500/15 dark:to-violet-500/5",
      iconBg: "bg-violet-500/10",
      iconColor: "text-violet-600 dark:text-violet-400",
      borderAccent: "border-l-violet-500",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.06, duration: 0.4, ease: "easeOut" }}
        >
          <Card className={`relative overflow-hidden border-l-[3px] ${stat.borderAccent} hover:shadow-elevated transition-shadow duration-300`}>
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} pointer-events-none`} />
            <CardContent className="p-3.5 sm:p-5 relative">
              <div className="flex items-start justify-between mb-2 sm:mb-3">
                <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-lg ${stat.iconBg} flex items-center justify-center`}>
                  <stat.icon className={`h-4 w-4 sm:h-5 sm:w-5 ${stat.iconColor}`} />
                </div>
                <TrendingUp className="h-3.5 w-3.5 text-muted-foreground/50" />
              </div>
              <motion.p 
                className="text-2xl sm:text-3xl font-bold font-heading text-foreground tracking-tight"
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: index * 0.06 + 0.2, type: "spring", stiffness: 200 }}
              >
                {stat.value}
              </motion.p>
              <p className="text-xs sm:text-sm font-medium text-muted-foreground mt-0.5">{stat.title}</p>
              <p className="text-[10px] sm:text-xs text-muted-foreground/70 mt-1">{stat.trend}</p>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
