import { motion } from "framer-motion";
import { Card, CardContent } from "@/components/ui/card";
import { Briefcase, Users, FileText, CheckCircle2 } from "lucide-react";
import type { Job, Application, Profile } from "@/types/recruiter";

interface StatsCardsProps {
  jobs: Job[];
  applications: Application[];
  candidates: Profile[];
}

const StatsCards = ({ jobs, applications, candidates }: StatsCardsProps) => {
  const stats = [
    {
      title: "Active Jobs",
      value: jobs.length,
      icon: Briefcase,
      color: "text-primary",
      bgColor: "bg-primary/10",
    },
    {
      title: "Applications",
      value: applications.length,
      icon: FileText,
      color: "text-emerald-600 dark:text-emerald-500",
      bgColor: "bg-emerald-50 dark:bg-emerald-950/30",
    },
    {
      title: "Candidates",
      value: candidates.length,
      icon: Users,
      color: "text-sky-600 dark:text-sky-500",
      bgColor: "bg-sky-50 dark:bg-sky-950/30",
    },
    {
      title: "Shortlisted",
      value: applications.filter((app) => app.status === "shortlisted").length,
      icon: CheckCircle2,
      color: "text-violet-600 dark:text-violet-500",
      bgColor: "bg-violet-50 dark:bg-violet-950/30",
    },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {stats.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05, duration: 0.3 }}
          whileHover={{ y: -4, boxShadow: "0 8px 30px rgba(0,0,0,0.08)" }}
        >
          <Card className="card-elevated transition-all duration-200 h-full">
            <CardContent className="p-4 md:p-6">
              <div className="flex items-center gap-4">
                <motion.div 
                  className={`w-10 h-10 md:w-12 md:h-12 rounded-xl ${stat.bgColor} flex items-center justify-center shrink-0`}
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 300 }}
                >
                  <stat.icon className={`h-5 w-5 md:h-6 md:w-6 ${stat.color}`} />
                </motion.div>
                <div className="min-w-0">
                  <motion.p 
                    className="text-xl md:text-2xl font-bold text-foreground"
                    initial={{ scale: 0.5 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: index * 0.05 + 0.2, type: "spring", stiffness: 200 }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-xs md:text-sm text-muted-foreground truncate">{stat.title}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
