import { AdminStats } from "@/hooks/useAdminStats";
import { 
  Building2, 
  Users, 
  Briefcase, 
  FileText, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  UserPlus,
  Calendar
} from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface AdminOverviewProps {
  stats: AdminStats | null;
  loading: boolean;
}

const StatCard = ({ 
  icon: Icon, 
  label, 
  value, 
  subValue, 
  color,
  delay 
}: { 
  icon: typeof Building2; 
  label: string; 
  value: number; 
  subValue?: string;
  color: string;
  delay: number;
}) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, duration: 0.4 }}
  >
    <Card className="overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{label}</p>
            <p className="text-3xl font-bold mt-2">{value}</p>
            {subValue && (
              <p className="text-xs text-muted-foreground mt-1">{subValue}</p>
            )}
          </div>
          <div className={`p-3 rounded-xl ${color}`}>
            <Icon className="h-6 w-6 text-white" />
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

const AdminOverview = ({ stats, loading }: AdminOverviewProps) => {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(8)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="h-4 bg-muted rounded w-1/2 mb-4" />
              <div className="h-8 bg-muted rounded w-1/3" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const verificationRate = stats.totalInstitutions > 0 
    ? Math.round((stats.verifiedInstitutions / stats.totalInstitutions) * 100)
    : 0;

  const candidateActivityRate = stats.totalCandidates > 0
    ? Math.round((stats.activeCandidates / stats.totalCandidates) * 100)
    : 0;

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-heading font-bold">Dashboard Overview</h1>
        <p className="text-muted-foreground mt-1">
          Real-time analytics and platform metrics
        </p>
      </motion.div>

      {/* Primary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Building2}
          label="Total Institutions"
          value={stats.totalInstitutions}
          subValue={`${stats.verifiedInstitutions} verified`}
          color="bg-blue-500"
          delay={0}
        />
        <StatCard
          icon={Users}
          label="Total Candidates"
          value={stats.totalCandidates}
          subValue={`${stats.activeCandidates} active`}
          color="bg-emerald-500"
          delay={0.1}
        />
        <StatCard
          icon={Briefcase}
          label="Total Jobs"
          value={stats.totalJobs}
          subValue={`${stats.jobsThisMonth} this month`}
          color="bg-violet-500"
          delay={0.2}
        />
        <StatCard
          icon={FileText}
          label="Total Applications"
          value={stats.totalApplications}
          subValue={`${stats.pendingApplications} pending`}
          color="bg-amber-500"
          delay={0.3}
        />
      </div>

      {/* Secondary Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Verification Status */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-primary" />
                Institution Verification
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Verification Rate</span>
                <span className="font-medium">{verificationRate}%</span>
              </div>
              <Progress value={verificationRate} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-500">{stats.verifiedInstitutions}</p>
                  <p className="text-xs text-muted-foreground">Verified</p>
                </div>
                <div className="text-center p-3 bg-amber-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-amber-500">{stats.pendingVerifications}</p>
                  <p className="text-xs text-muted-foreground">Pending</p>
                </div>
                <div className="text-center p-3 bg-destructive/10 rounded-lg">
                  <p className="text-2xl font-bold text-destructive">{stats.rejectedVerifications}</p>
                  <p className="text-xs text-muted-foreground">Rejected</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Candidate Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                Candidate Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Active Rate (30 days)</span>
                <span className="font-medium">{candidateActivityRate}%</span>
              </div>
              <Progress value={candidateActivityRate} className="h-2" />
              
              <div className="grid grid-cols-3 gap-4 pt-4">
                <div className="text-center p-3 bg-blue-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-blue-500">{stats.totalCandidates}</p>
                  <p className="text-xs text-muted-foreground">Total</p>
                </div>
                <div className="text-center p-3 bg-emerald-500/10 rounded-lg">
                  <p className="text-2xl font-bold text-emerald-500">{stats.activeCandidates}</p>
                  <p className="text-xs text-muted-foreground">Active</p>
                </div>
                <div className="text-center p-3 bg-muted rounded-lg">
                  <p className="text-2xl font-bold">{stats.totalCandidates - stats.activeCandidates}</p>
                  <p className="text-xs text-muted-foreground">Inactive</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Tertiary Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={Calendar}
          label="Total Interviews"
          value={stats.totalInterviews}
          subValue={`${stats.scheduledInterviews} scheduled`}
          color="bg-pink-500"
          delay={0.6}
        />
        <StatCard
          icon={CheckCircle}
          label="Completed Interviews"
          value={stats.completedInterviews}
          color="bg-teal-500"
          delay={0.7}
        />
        <StatCard
          icon={UserPlus}
          label="New Signups (7d)"
          value={stats.recentSignups}
          color="bg-indigo-500"
          delay={0.8}
        />
        <StatCard
          icon={Clock}
          label="New Jobs (7d)"
          value={stats.recentJobs}
          color="bg-orange-500"
          delay={0.9}
        />
      </div>

      {/* Application Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Application Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="p-4 bg-amber-500/10 rounded-lg border border-amber-500/20">
                <p className="text-3xl font-bold text-amber-500">{stats.pendingApplications}</p>
                <p className="text-sm text-muted-foreground mt-1">Pending Review</p>
              </div>
              <div className="p-4 bg-emerald-500/10 rounded-lg border border-emerald-500/20">
                <p className="text-3xl font-bold text-emerald-500">{stats.acceptedApplications}</p>
                <p className="text-sm text-muted-foreground mt-1">Accepted/Shortlisted</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg border border-destructive/20">
                <p className="text-3xl font-bold text-destructive">{stats.rejectedApplications}</p>
                <p className="text-sm text-muted-foreground mt-1">Rejected</p>
              </div>
              <div className="p-4 bg-muted rounded-lg">
                <p className="text-3xl font-bold">{stats.totalApplications}</p>
                <p className="text-sm text-muted-foreground mt-1">Total Applications</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default AdminOverview;
