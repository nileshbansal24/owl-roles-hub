import { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Briefcase,
  Users,
  FileText,
  CheckCircle2,
  Trophy,
  Clock,
  TrendingUp,
  TrendingDown,
  Lightbulb,
  Target,
  Calendar,
  Sparkles,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import type { Job, Application, Profile, EnrichedInterview } from "@/types/recruiter";

interface AnalyticsTabProps {
  jobs: Job[];
  applications: Application[];
  candidates: Profile[];
  interviews: EnrichedInterview[];
}

const STATUS_COLORS: Record<string, string> = {
  pending: "hsl(38 92% 50%)",
  shortlisted: "hsl(217 91% 60%)",
  interview: "hsl(262 83% 58%)",
  hired: "hsl(142 71% 45%)",
  rejected: "hsl(0 84% 60%)",
  withdrawn: "hsl(220 9% 46%)",
};

const KpiCard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delta,
}: {
  icon: typeof Briefcase;
  label: string;
  value: string | number;
  sub?: string;
  accent: string;
  delta?: { value: number; positive: boolean };
}) => (
  <motion.div
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3 }}
    className="rounded-xl border border-border/60 bg-card p-5 hover:shadow-[var(--shadow-soft)] hover:-translate-y-0.5 transition-all"
  >
    <div className="flex items-center justify-between mb-3">
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${accent}`}>
        <Icon className="h-5 w-5" />
      </div>
      {delta && (
        <div
          className={`flex items-center gap-0.5 text-xs font-medium ${
            delta.positive ? "text-emerald-600" : "text-rose-600"
          }`}
        >
          {delta.positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
          {delta.value}%
        </div>
      )}
    </div>
    <p className="text-3xl font-bold font-heading tracking-tight leading-none">{value}</p>
    <p className="text-sm font-medium text-foreground/80 mt-2">{label}</p>
    {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
  </motion.div>
);

const AnalyticsTab = ({ jobs, applications, candidates, interviews }: AnalyticsTabProps) => {
  const metrics = useMemo(() => {
    const total = applications.length;
    const pending = applications.filter((a) => a.status === "pending").length;
    const shortlisted = applications.filter((a) => a.status === "shortlisted").length;
    const hired = applications.filter((a) => ["hired", "accepted"].includes(a.status)).length;
    const rejected = applications.filter((a) => a.status === "rejected").length;
    const interviewed = applications.filter((a) => a.status === "interview").length;

    const shortlistRate = total ? Math.round((shortlisted / total) * 100) : 0;
    const hireRate = total ? Math.round((hired / total) * 100) : 0;
    const rejectionRate = total ? Math.round((rejected / total) * 100) : 0;

    // Apps in last 30 days, grouped by day
    const today = new Date();
    const days: { date: string; label: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days.push({
        date: key,
        label: d.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
        count: 0,
      });
    }
    const dayMap = new Map(days.map((d) => [d.date, d]));
    applications.forEach((a) => {
      const key = (a.created_at || "").slice(0, 10);
      const bucket = dayMap.get(key);
      if (bucket) bucket.count += 1;
    });

    const last7 = days.slice(-7).reduce((s, d) => s + d.count, 0);
    const prev7 = days.slice(-14, -7).reduce((s, d) => s + d.count, 0);
    const weeklyDelta = prev7 ? Math.round(((last7 - prev7) / prev7) * 100) : last7 > 0 ? 100 : 0;

    // Status distribution
    const statusData = [
      { name: "Pending", value: pending, key: "pending" },
      { name: "Shortlisted", value: shortlisted, key: "shortlisted" },
      { name: "Interview", value: interviewed, key: "interview" },
      { name: "Hired", value: hired, key: "hired" },
      { name: "Rejected", value: rejected, key: "rejected" },
    ].filter((s) => s.value > 0);

    // Applications per job (top 8)
    const jobBuckets = new Map<string, { title: string; apps: number; shortlisted: number; hired: number }>();
    jobs.forEach((j) => jobBuckets.set(j.id, { title: j.title, apps: 0, shortlisted: 0, hired: 0 }));
    applications.forEach((a) => {
      const b = jobBuckets.get(a.job_id);
      if (b) {
        b.apps += 1;
        if (a.status === "shortlisted") b.shortlisted += 1;
        if (["hired", "accepted"].includes(a.status)) b.hired += 1;
      }
    });
    const jobChart = Array.from(jobBuckets.values())
      .sort((a, b) => b.apps - a.apps)
      .slice(0, 8)
      .map((j) => ({
        ...j,
        title: j.title.length > 18 ? j.title.slice(0, 18) + "…" : j.title,
      }));

    // Funnel
    const funnel = [
      { stage: "Applied", count: total },
      { stage: "Shortlisted", count: shortlisted + interviewed + hired },
      { stage: "Interview", count: interviewed + hired + interviews.length },
      { stage: "Hired", count: hired },
    ];

    const scheduledInterviews = interviews.filter(
      (i) => i.status === "scheduled" || i.status === "confirmed",
    ).length;

    return {
      total, pending, shortlisted, hired, rejected, interviewed,
      shortlistRate, hireRate, rejectionRate,
      days, statusData, jobChart, funnel,
      weeklyDelta, last7,
      scheduledInterviews,
    };
  }, [applications, jobs, interviews]);

  const advice = useMemo(() => {
    const tips: { tone: "good" | "warn" | "info"; title: string; text: string }[] = [];

    if (jobs.length === 0) {
      tips.push({
        tone: "warn",
        title: "Post your first job",
        text: "You have no active jobs. Post a role to start attracting candidates from the talent pool.",
      });
    }
    if (metrics.total === 0 && jobs.length > 0) {
      tips.push({
        tone: "info",
        title: "Boost discoverability",
        text: "No applications yet. Try sharpening your job description with required skills, salary range, and benefits.",
      });
    }
    if (metrics.pending > 10) {
      tips.push({
        tone: "warn",
        title: "Clear your review backlog",
        text: `${metrics.pending} applications are awaiting review. Quick decisions improve candidate experience and response rates.`,
      });
    }
    if (metrics.shortlistRate > 0 && metrics.shortlistRate < 15) {
      tips.push({
        tone: "info",
        title: "Refine your sourcing",
        text: `Only ${metrics.shortlistRate}% of applicants are shortlisted. Consider tightening job requirements or using Smart Search to pre-qualify candidates.`,
      });
    }
    if (metrics.shortlistRate >= 30) {
      tips.push({
        tone: "good",
        title: "Strong candidate quality",
        text: `${metrics.shortlistRate}% shortlist rate is excellent — your role attracts well-matched candidates.`,
      });
    }
    if (metrics.hired > 0) {
      tips.push({
        tone: "good",
        title: `${metrics.hired} successful ${metrics.hired === 1 ? "hire" : "hires"}`,
        text: "Great work! Capture what worked — JD framing, screening criteria, interview format — and replicate it.",
      });
    }
    if (metrics.rejectionRate > 60 && metrics.total > 5) {
      tips.push({
        tone: "warn",
        title: "High rejection rate",
        text: `${metrics.rejectionRate}% of applicants are rejected. The job may be attracting unqualified candidates — tighten the headline and required skills.`,
      });
    }
    if (metrics.scheduledInterviews === 0 && metrics.shortlisted > 0) {
      tips.push({
        tone: "info",
        title: "Schedule interviews",
        text: `${metrics.shortlisted} candidates are shortlisted but no interviews are scheduled. Reach out before they accept other offers.`,
      });
    }
    if (candidates.length > 100 && metrics.shortlisted < 3) {
      tips.push({
        tone: "info",
        title: "Explore the talent pool",
        text: `${candidates.length} candidates are available. Use Find Candidates with filters to source proactively instead of waiting for applications.`,
      });
    }
    if (tips.length === 0) {
      tips.push({
        tone: "good",
        title: "All systems healthy",
        text: "Your hiring pipeline looks balanced. Keep monitoring conversion rates as new applications come in.",
      });
    }
    return tips.slice(0, 5);
  }, [jobs, metrics, candidates]);

  const toneStyles: Record<string, string> = {
    good: "border-emerald-500/30 bg-emerald-500/5",
    warn: "border-amber-500/30 bg-amber-500/5",
    info: "border-sky-500/30 bg-sky-500/5",
  };
  const toneIcon: Record<string, typeof Lightbulb> = {
    good: CheckCircle2,
    warn: AlertTriangle,
    info: Lightbulb,
  };
  const toneIconColor: Record<string, string> = {
    good: "text-emerald-600",
    warn: "text-amber-600",
    info: "text-sky-600",
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-heading font-bold tracking-tight flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Analytics
          </h2>
          <p className="text-sm text-muted-foreground mt-1">
            Hiring performance, pipeline health, and AI-driven recommendations.
          </p>
        </div>
        <Badge variant="secondary" className="gap-1.5 px-3 py-1.5">
          <Calendar className="h-3 w-3" />
          Last 30 days
        </Badge>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={Briefcase}
          label="Active Jobs"
          value={jobs.length}
          sub={jobs.length ? "Currently open positions" : "No active posts"}
          accent="bg-primary/10 text-primary"
        />
        <KpiCard
          icon={FileText}
          label="Applications"
          value={metrics.total}
          sub={`${metrics.pending} pending review`}
          accent="bg-amber-500/10 text-amber-600"
          delta={metrics.last7 > 0 ? { value: Math.abs(metrics.weeklyDelta), positive: metrics.weeklyDelta >= 0 } : undefined}
        />
        <KpiCard
          icon={Users}
          label="Talent Pool"
          value={candidates.length}
          sub="Discoverable candidates"
          accent="bg-sky-500/10 text-sky-600"
        />
        <KpiCard
          icon={Trophy}
          label="Successful Hires"
          value={metrics.hired}
          sub={`${metrics.hireRate}% hire rate`}
          accent="bg-emerald-500/10 text-emerald-600"
        />
      </div>

      {/* Secondary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <KpiCard
          icon={CheckCircle2}
          label="Shortlisted"
          value={metrics.shortlisted}
          sub={`${metrics.shortlistRate}% of applicants`}
          accent="bg-violet-500/10 text-violet-600"
        />
        <KpiCard
          icon={Calendar}
          label="Interviews Scheduled"
          value={metrics.scheduledInterviews}
          sub={`${interviews.length} total interviews`}
          accent="bg-pink-500/10 text-pink-600"
        />
        <KpiCard
          icon={Clock}
          label="Pending Review"
          value={metrics.pending}
          sub={metrics.pending > 10 ? "Backlog growing" : "Healthy queue"}
          accent="bg-orange-500/10 text-orange-600"
        />
        <KpiCard
          icon={Target}
          label="Conversion Rate"
          value={`${metrics.shortlistRate}%`}
          sub="Application → Shortlist"
          accent="bg-teal-500/10 text-teal-600"
        />
      </div>

      {/* Charts row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Application Trend</CardTitle>
            <CardDescription>Daily applications over the last 30 days</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={metrics.days} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                    <stop offset="100%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={4} stroke="hsl(var(--muted-foreground))" />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: 8,
                    fontSize: 12,
                  }}
                />
                <Line
                  type="monotone"
                  dataKey="count"
                  stroke="hsl(var(--primary))"
                  strokeWidth={2.5}
                  dot={false}
                  activeDot={{ r: 5 }}
                  fill="url(#trendGrad)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Application Status</CardTitle>
            <CardDescription>Pipeline distribution</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {metrics.statusData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No applications yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={metrics.statusData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={2}
                  >
                    {metrics.statusData.map((entry) => (
                      <Cell key={entry.key} fill={STATUS_COLORS[entry.key]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Charts row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Top Jobs by Applications</CardTitle>
            <CardDescription>Applications, shortlists & hires per role</CardDescription>
          </CardHeader>
          <CardContent className="h-72">
            {metrics.jobChart.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No job data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={metrics.jobChart} margin={{ top: 5, right: 8, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                  <XAxis dataKey="title" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      background: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: 8,
                      fontSize: 12,
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="apps" name="Applications" fill="hsl(217 91% 60%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="shortlisted" name="Shortlisted" fill="hsl(262 83% 58%)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="hired" name="Hired" fill="hsl(142 71% 45%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Hiring Funnel</CardTitle>
            <CardDescription>Candidate progression through stages</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-2">
            {metrics.funnel.map((stage, idx) => {
              const max = metrics.funnel[0].count || 1;
              const pct = Math.round((stage.count / max) * 100);
              const colors = ["bg-primary", "bg-violet-500", "bg-pink-500", "bg-emerald-500"];
              return (
                <div key={stage.stage}>
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-sm font-medium">{stage.stage}</span>
                    <span className="text-sm tabular-nums text-muted-foreground">
                      {stage.count} <span className="text-xs">({pct}%)</span>
                    </span>
                  </div>
                  <div className="h-2.5 rounded-full bg-muted overflow-hidden">
                    <motion.div
                      className={`h-full ${colors[idx]} rounded-full`}
                      initial={{ width: 0 }}
                      animate={{ width: `${pct}%` }}
                      transition={{ duration: 0.6, delay: idx * 0.1 }}
                    />
                  </div>
                </div>
              );
            })}
            <div className="pt-2 border-t mt-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Overall conversion (applied → hired)</span>
                <span className="font-semibold">{metrics.hireRate}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recruiter Advice */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Lightbulb className="h-4 w-4 text-amber-500" />
            Recommendations for You
          </CardTitle>
          <CardDescription>
            Personalised suggestions based on your hiring activity
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {advice.map((tip, idx) => {
              const Icon = toneIcon[tip.tone];
              return (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className={`rounded-lg border p-4 ${toneStyles[tip.tone]}`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`mt-0.5 ${toneIconColor[tip.tone]}`}>
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{tip.title}</p>
                      <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.text}</p>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AnalyticsTab;
