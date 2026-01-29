import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format, formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  FileText,
  Eye,
  Calendar,
  Download,
  Loader2,
  CheckCircle2,
  XCircle,
  CheckSquare,
  X,
  GitCompare,
} from "lucide-react";
import CandidateCategoryBadge from "./CandidateCategoryBadge";
import { 
  containerVariants, 
  itemVariants, 
  calculateCompleteness, 
  getEmploymentStatus,
  getCandidateCategory,
  getStatusColor 
} from "@/types/recruiter";
import type { Job, Application } from "@/types/recruiter";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface ApplicationsTabProps {
  jobs: Job[];
  applications: Application[];
  onViewApplicant: (app: Application) => void;
  onUpdateStatus: (appId: string, status: string) => void;
  onScheduleInterview: (app: Application) => void;
  onDownloadResume: (resumePath: string, applicantName: string) => void;
  onOpenComparison: (appIds: Set<string>) => void;
  setApplications: React.Dispatch<React.SetStateAction<Application[]>>;
}

const ApplicationsTab = ({
  jobs,
  applications,
  onViewApplicant,
  onUpdateStatus,
  onScheduleInterview,
  onDownloadResume,
  onOpenComparison,
  setApplications,
}: ApplicationsTabProps) => {
  const { toast } = useToast();
  const [selectedJobFilter, setSelectedJobFilter] = useState<string>("all");
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>("all");
  const [employmentStatusFilter, setEmploymentStatusFilter] = useState<string>("all");
  const [completenessFilter, setCompletenessFilter] = useState(false);
  const [selectedAppIds, setSelectedAppIds] = useState<Set<string>>(new Set());
  const [bulkActionLoading, setBulkActionLoading] = useState(false);
  const [showRejectConfirm, setShowRejectConfirm] = useState(false);

  const filteredApplications = applications.filter((app) => {
    const matchesJob = selectedJobFilter === "all" || app.job_id === selectedJobFilter;
    const matchesStatus = selectedStatusFilter === "all" || app.status === selectedStatusFilter;
    const matchesCompleteness = !completenessFilter || calculateCompleteness(app.profiles) >= 80;
    
    let matchesEmployment = true;
    if (employmentStatusFilter !== "all") {
      const status = getEmploymentStatus(app.profiles);
      matchesEmployment = status === employmentStatusFilter;
    }
    
    return matchesJob && matchesStatus && matchesCompleteness && matchesEmployment;
  });

  const toggleSelectApp = (appId: string) => {
    setSelectedAppIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(appId)) {
        newSet.delete(appId);
      } else {
        newSet.add(appId);
      }
      return newSet;
    });
  };

  const selectAllFiltered = () => {
    if (selectedAppIds.size === filteredApplications.length) {
      setSelectedAppIds(new Set());
    } else {
      setSelectedAppIds(new Set(filteredApplications.map(a => a.id)));
    }
  };

  const clearSelection = useCallback(() => {
    setSelectedAppIds(new Set());
  }, []);

  const exportSelectedToCSV = () => {
    const selectedApps = applications.filter(app => selectedAppIds.has(app.id));
    
    if (selectedApps.length === 0) {
      toast({
        title: "No applicants selected",
        description: "Please select applicants to export",
        variant: "destructive",
      });
      return;
    }

    const headers = [
      "Name", "Email", "Role", "University", "Location", "Years Experience",
      "Skills", "Job Applied", "Institute", "Application Status", "Applied Date", "Profile Completeness"
    ];

    const rows = selectedApps.map(app => {
      const profile = app.profiles;
      const completeness = calculateCompleteness(profile);
      return [
        profile?.full_name || "N/A",
        app.applicant_email || "N/A",
        profile?.role || "N/A",
        profile?.university || "N/A",
        profile?.location || "N/A",
        profile?.years_experience?.toString() || "N/A",
        profile?.skills?.join("; ") || "N/A",
        app.jobs?.title || "N/A",
        app.jobs?.institute || "N/A",
        app.status || "pending",
        app.created_at ? format(new Date(app.created_at), "yyyy-MM-dd") : "N/A",
        `${completeness}%`
      ];
    });

    const escapeCSV = (val: string) => {
      if (val.includes(",") || val.includes('"') || val.includes("\n")) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csvContent = [
      headers.map(escapeCSV).join(","),
      ...rows.map(row => row.map(escapeCSV).join(","))
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `applicants_export_${format(new Date(), "yyyy-MM-dd")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export successful",
      description: `${selectedApps.length} applicant(s) exported to CSV`,
    });
  };

  const handleBulkAction = useCallback(async (newStatus: string) => {
    if (selectedAppIds.size === 0) return;
    
    setBulkActionLoading(true);
    const idsArray = Array.from(selectedAppIds);
    
    const { error } = await supabase
      .from("job_applications")
      .update({ status: newStatus })
      .in("id", idsArray);

    if (error) {
      toast({
        title: "Bulk update failed",
        description: error.message,
        variant: "destructive",
      });
    } else {
      setApplications((prev) =>
        prev.map((app) =>
          selectedAppIds.has(app.id) ? { ...app, status: newStatus } : app
        )
      );
      toast({
        title: "Bulk update successful",
        description: `${selectedAppIds.size} application(s) marked as ${newStatus}`,
      });
      setSelectedAppIds(new Set());
    }
    setBulkActionLoading(false);
  }, [selectedAppIds, toast, setApplications]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable) {
        return;
      }

      if ((e.ctrlKey || e.metaKey) && e.key === "a") {
        e.preventDefault();
        if (filteredApplications.length > 0) {
          setSelectedAppIds(new Set(filteredApplications.map(a => a.id)));
          toast({
            title: "All selected",
            description: `${filteredApplications.length} applicant(s) selected`,
          });
        }
      }

      if ((e.key === "Delete" || e.key === "Backspace") && selectedAppIds.size > 0) {
        e.preventDefault();
        setShowRejectConfirm(true);
      }

      if (e.key === "Escape" && selectedAppIds.size > 0) {
        e.preventDefault();
        clearSelection();
        toast({
          title: "Selection cleared",
          description: "All applicants deselected",
        });
      }

      if (e.key === "s" && !e.ctrlKey && !e.metaKey && selectedAppIds.size > 0) {
        e.preventDefault();
        handleBulkAction("shortlisted");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredApplications, selectedAppIds, handleBulkAction, clearSelection, toast]);

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="space-y-6"
    >
      {/* Filters */}
      <motion.div variants={itemVariants} className="flex flex-wrap items-center gap-4">
        <Select value={selectedJobFilter} onValueChange={setSelectedJobFilter}>
          <SelectTrigger className="w-[250px]">
            <SelectValue placeholder="Filter by job" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Jobs</SelectItem>
            {jobs.map((job) => (
              <SelectItem key={job.id} value={job.id}>{job.title}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select value={selectedStatusFilter} onValueChange={setSelectedStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="reviewed">Reviewed</SelectItem>
            <SelectItem value="shortlisted">Shortlisted</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
        
        <Select value={employmentStatusFilter} onValueChange={setEmploymentStatusFilter}>
          <SelectTrigger className="w-[200px]">
            <SelectValue placeholder="Employment Status" />
          </SelectTrigger>
          <SelectContent className="bg-popover">
            <SelectItem value="all">All Candidates</SelectItem>
            <SelectItem value="fresher">Fresher</SelectItem>
            <SelectItem value="not_working">Currently Not Working</SelectItem>
            <SelectItem value="working">Working</SelectItem>
          </SelectContent>
        </Select>
        
        <div className="flex items-center space-x-2 bg-secondary/50 px-3 py-1.5 rounded-lg">
          <Switch
            id="completeness-filter"
            checked={completenessFilter}
            onCheckedChange={setCompletenessFilter}
          />
          <Label htmlFor="completeness-filter" className="text-sm cursor-pointer whitespace-nowrap">
            80%+ Complete
          </Label>
        </div>
        
        <p className="text-sm text-muted-foreground">
          {filteredApplications.length} application{filteredApplications.length !== 1 ? "s" : ""}
        </p>
      </motion.div>

      {/* Bulk Actions Bar */}
      <AnimatePresence>
        {selectedAppIds.size > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="card-elevated p-4 flex items-center justify-between gap-4 border-primary/30 bg-primary/5"
          >
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <CheckSquare className="h-5 w-5 text-primary" />
                <span className="font-medium text-foreground">
                  {selectedAppIds.size} selected
                </span>
              </div>
              <Button variant="ghost" size="sm" onClick={clearSelection} className="gap-1 text-muted-foreground">
                <X className="h-4 w-4" />
                Clear <kbd className="ml-1 px-1 py-0.5 text-[10px] bg-muted rounded">Esc</kbd>
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground">
                <kbd className="px-1.5 py-0.5 bg-muted rounded">S</kbd> Shortlist
                <kbd className="px-1.5 py-0.5 bg-muted rounded">Del</kbd> Reject
              </div>
              <Button
                size="sm"
                className="bg-green-600 hover:bg-green-700 text-white gap-1"
                onClick={() => handleBulkAction("shortlisted")}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                Shortlist All
              </Button>
              <Button
                size="sm"
                variant="destructive"
                className="gap-1"
                onClick={() => setShowRejectConfirm(true)}
                disabled={bulkActionLoading}
              >
                {bulkActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
                Reject All
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={() => onOpenComparison(selectedAppIds)}
                disabled={selectedAppIds.size < 2}
              >
                <GitCompare className="h-4 w-4" />
                Compare ({selectedAppIds.size})
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="gap-1"
                onClick={exportSelectedToCSV}
              >
                <Download className="h-4 w-4" />
                Export CSV
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Select All Toggle */}
      {filteredApplications.length > 0 && (
        <motion.div variants={itemVariants} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Checkbox
              id="select-all"
              checked={selectedAppIds.size === filteredApplications.length && filteredApplications.length > 0}
              onCheckedChange={selectAllFiltered}
            />
            <Label htmlFor="select-all" className="text-sm cursor-pointer text-muted-foreground">
              Select all {filteredApplications.length} applicants
            </Label>
            <kbd className="hidden md:inline-block ml-2 px-1.5 py-0.5 text-[10px] bg-muted text-muted-foreground rounded">Ctrl+A</kbd>
          </div>
        </motion.div>
      )}

      {/* Applications List */}
      {filteredApplications.length === 0 ? (
        <motion.div variants={itemVariants} className="card-elevated p-12 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No applications found.</p>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="grid gap-4">
          {filteredApplications.map((app, index) => (
            <motion.div
              key={app.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`card-elevated p-5 transition-all ${
                selectedAppIds.has(app.id) ? "ring-2 ring-primary bg-primary/5" : ""
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="flex items-center gap-3">
                  <Checkbox
                    checked={selectedAppIds.has(app.id)}
                    onCheckedChange={() => toggleSelectApp(app.id)}
                  />
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={app.profiles?.avatar_url || ""} />
                    <AvatarFallback className="bg-primary text-primary-foreground font-heading font-bold">
                      {app.profiles?.full_name?.slice(0, 2).toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-heading font-semibold text-foreground">
                          {app.profiles?.full_name || "Anonymous"}
                        </h4>
                        <CandidateCategoryBadge category={getCandidateCategory(app.profiles)} />
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Applied for <span className="text-primary font-medium">{app.jobs.title}</span> at {app.jobs.institute}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={getStatusColor(app.status)}>
                        {app.status}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 mt-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      onClick={() => onViewApplicant(app)}
                    >
                      <Eye className="h-4 w-4" />
                      View Profile
                    </Button>
                    {app.profiles?.resume_url && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => onDownloadResume(app.profiles!.resume_url!, app.profiles!.full_name || "Applicant")}
                      >
                        <Download className="h-4 w-4" />
                        Resume
                      </Button>
                    )}
                    {app.status !== "rejected" && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="gap-1"
                        onClick={() => onScheduleInterview(app)}
                      >
                        <Calendar className="h-4 w-4" />
                        Schedule
                      </Button>
                    )}
                    <div className="flex-1" />
                    {app.status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white gap-1"
                          onClick={() => onUpdateStatus(app.id, "shortlisted")}
                        >
                          <CheckCircle2 className="h-4 w-4" />
                          Shortlist
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          className="gap-1"
                          onClick={() => onUpdateStatus(app.id, "rejected")}
                        >
                          <XCircle className="h-4 w-4" />
                          Reject
                        </Button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>
      )}

      {/* Bulk Reject Confirmation Dialog */}
      <AlertDialog open={showRejectConfirm} onOpenChange={setShowRejectConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject {selectedAppIds.size} applicant{selectedAppIds.size !== 1 ? 's' : ''}?</AlertDialogTitle>
            <AlertDialogDescription>
              This action will mark {selectedAppIds.size} application{selectedAppIds.size !== 1 ? 's' : ''} as rejected. 
              The applicants will be notified of this decision. This action cannot be easily undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                handleBulkAction("rejected");
                setShowRejectConfirm(false);
              }}
            >
              Yes, reject all
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </motion.div>
  );
};

export default ApplicationsTab;
