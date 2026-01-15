import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Briefcase,
  Users,
  Clock,
  CheckCircle2,
  XCircle,
  Eye,
  Trash2,
  Plus,
  Loader2,
  MapPin,
  Calendar,
  FileText,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import { useToast } from "@/hooks/use-toast";

interface Job {
  id: string;
  title: string;
  institute: string;
  location: string;
  salary_range: string | null;
  job_type: string | null;
  created_at: string;
}

interface Application {
  id: string;
  job_id: string;
  applicant_id: string;
  cover_letter: string | null;
  status: string;
  created_at: string;
  jobs: {
    title: string;
    institute: string;
  };
  profiles: {
    full_name: string | null;
    avatar_url: string | null;
    role: string | null;
    university: string | null;
  } | null;
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const EmployerDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [jobs, setJobs] = useState<Job[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");

  useEffect(() => {
    if (!user) return;

    const fetchData = async () => {
      setLoading(true);

      // Fetch employer's jobs
      const { data: jobsData, error: jobsError } = await supabase
        .from("jobs")
        .select("*")
        .eq("created_by", user.id)
        .order("created_at", { ascending: false });

      if (jobsError) {
        console.error("Error fetching jobs:", jobsError);
      } else {
        setJobs(jobsData || []);
      }

      // Fetch applications for employer's jobs
      const { data: appsData, error: appsError } = await supabase
        .from("job_applications")
        .select(`
          *,
          jobs!inner(title, institute, created_by),
          profiles(full_name, avatar_url, role, university)
        `)
        .eq("jobs.created_by", user.id)
        .order("created_at", { ascending: false });

      if (appsError) {
        console.error("Error fetching applications:", appsError);
      } else {
        setApplications(appsData as unknown as Application[] || []);
      }

      setLoading(false);
    };

    fetchData();
  }, [user]);

  const updateApplicationStatus = async (appId: string, newStatus: string) => {
    const { error } = await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setApplications((prev) =>
        prev.map((app) =>
          app.id === appId ? { ...app, status: newStatus } : app
        )
      );
      toast({
        title: "Status updated",
        description: `Application marked as ${newStatus}`,
      });
    }
  };

  const deleteJob = async (jobId: string) => {
    const { error } = await supabase.from("jobs").delete().eq("id", jobId);

    if (error) {
      toast({
        title: "Delete failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setJobs((prev) => prev.filter((job) => job.id !== jobId));
      setApplications((prev) => prev.filter((app) => app.job_id !== jobId));
      toast({
        title: "Job deleted",
        description: "The job posting has been removed.",
      });
    }
  };

  const filteredApplications =
    selectedJobFilter === "all"
      ? applications
      : applications.filter((app) => app.job_id === selectedJobFilter);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-500/10 text-yellow-600 border-yellow-500/20";
      case "reviewed":
        return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "accepted":
        return "bg-green-500/10 text-green-600 border-green-500/20";
      case "rejected":
        return "bg-red-500/10 text-red-600 border-red-500/20";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const stats = [
    { icon: Briefcase, label: "Active Jobs", value: jobs.length, color: "text-primary" },
    { icon: Users, label: "Total Applicants", value: applications.length, color: "text-blue-500" },
    {
      icon: Clock,
      label: "Pending Review",
      value: applications.filter((a) => a.status === "pending").length,
      color: "text-yellow-500",
    },
    {
      icon: CheckCircle2,
      label: "Accepted",
      value: applications.filter((a) => a.status === "accepted").length,
      color: "text-green-500",
    },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8"
          >
            <div>
              <h1 className="font-heading text-3xl font-bold text-foreground">
                Employer Dashboard
              </h1>
              <p className="text-muted-foreground mt-1">
                Manage your job postings and review applications
              </p>
            </div>
            <Button onClick={() => navigate("/post-job")} className="gap-2">
              <Plus className="h-4 w-4" />
              Post New Job
            </Button>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8"
          >
            {stats.map((stat, index) => (
              <motion.div
                key={stat.label}
                variants={itemVariants}
                whileHover={{ scale: 1.02 }}
                className="card-elevated p-5"
              >
                <stat.icon className={`h-6 w-6 ${stat.color} mb-3`} />
                <p className="font-heading text-2xl font-bold text-foreground">
                  {stat.value}
                </p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </motion.div>
            ))}
          </motion.div>

          {/* Tabs */}
          <Tabs defaultValue="applications" className="space-y-6">
            <TabsList className="bg-secondary/50">
              <TabsTrigger value="applications" className="gap-2">
                <Users className="h-4 w-4" />
                Applications
              </TabsTrigger>
              <TabsTrigger value="jobs" className="gap-2">
                <Briefcase className="h-4 w-4" />
                My Jobs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="applications" className="space-y-4">
              {/* Filter */}
              <div className="flex items-center gap-4">
                <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
                  <SelectTrigger className="w-64">
                    <SelectValue placeholder="Filter by job" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Jobs</SelectItem>
                    {jobs.map((job) => (
                      <SelectItem key={job.id} value={job.id}>
                        {job.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <p className="text-sm text-muted-foreground">
                  {filteredApplications.length} application(s)
                </p>
              </div>

              {/* Applications List */}
              <AnimatePresence mode="popLayout">
                {filteredApplications.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card-elevated p-12 text-center"
                  >
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground">No applications yet</p>
                  </motion.div>
                ) : (
                  <motion.div
                    variants={containerVariants}
                    initial="hidden"
                    animate="visible"
                    className="space-y-4"
                  >
                    {filteredApplications.map((app) => (
                      <motion.div
                        key={app.id}
                        variants={itemVariants}
                        layout
                        className="card-elevated p-5"
                      >
                        <div className="flex flex-col md:flex-row md:items-center gap-4">
                          <Avatar className="h-12 w-12">
                            <AvatarImage src={app.profiles?.avatar_url || ""} />
                            <AvatarFallback className="bg-primary text-primary-foreground">
                              {app.profiles?.full_name?.slice(0, 2).toUpperCase() || "AP"}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-heading font-semibold text-foreground">
                                {app.profiles?.full_name || "Anonymous Applicant"}
                              </h3>
                              <Badge className={getStatusColor(app.status)}>
                                {app.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {app.profiles?.role || "Applicant"} 
                              {app.profiles?.university && ` at ${app.profiles.university}`}
                            </p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Applied for <span className="text-primary">{app.jobs?.title}</span> •{" "}
                              {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                            </p>
                          </div>

                          <div className="flex items-center gap-2">
                            {app.cover_letter && (
                              <Button variant="ghost" size="sm" className="gap-1">
                                <FileText className="h-4 w-4" />
                                Cover Letter
                              </Button>
                            )}
                            <Select
                              value={app.status}
                              onValueChange={(value) => updateApplicationStatus(app.id, value)}
                            >
                              <SelectTrigger className="w-32">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="pending">Pending</SelectItem>
                                <SelectItem value="reviewed">Reviewed</SelectItem>
                                <SelectItem value="accepted">Accepted</SelectItem>
                                <SelectItem value="rejected">Rejected</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </TabsContent>

            <TabsContent value="jobs">
              <motion.div
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="space-y-4"
              >
                {jobs.length === 0 ? (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="card-elevated p-12 text-center"
                  >
                    <Briefcase className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">No jobs posted yet</p>
                    <Button onClick={() => navigate("/post-job")}>Post Your First Job</Button>
                  </motion.div>
                ) : (
                  jobs.map((job) => (
                    <motion.div
                      key={job.id}
                      variants={itemVariants}
                      className="card-elevated p-5"
                    >
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        <div className="flex-1">
                          <h3 className="font-heading font-semibold text-foreground">
                            {job.title}
                          </h3>
                          <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                              <MapPin className="h-3.5 w-3.5" />
                              {job.location}
                            </span>
                            <span className="flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {format(new Date(job.created_at), "MMM d, yyyy")}
                            </span>
                            {job.job_type && (
                              <Badge variant="secondary">{job.job_type}</Badge>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-4">
                          <div className="text-center">
                            <p className="font-heading font-bold text-lg text-foreground">
                              {applications.filter((a) => a.job_id === job.id).length}
                            </p>
                            <p className="text-xs text-muted-foreground">Applicants</p>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteJob(job.id)}
                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </motion.div>
                  ))
                )}
              </motion.div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default EmployerDashboard;
