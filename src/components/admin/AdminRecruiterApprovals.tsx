import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Building2,
  User,
  Mail,
  Briefcase,
  Loader2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface PendingRecruiter {
  id: string;
  full_name: string | null;
  email: string | null;
  university: string | null;
  designation: string | null;
  approval_status: string;
  created_at: string;
}

interface AdminRecruiterApprovalsProps {
  loading: boolean;
  onRefetch: () => void;
}

const AdminRecruiterApprovals = ({ loading: parentLoading, onRefetch }: AdminRecruiterApprovalsProps) => {
  const { toast } = useToast();
  const [recruiters, setRecruiters] = useState<PendingRecruiter[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [search, setSearch] = useState("");
  const [actionDialog, setActionDialog] = useState<{ recruiter: PendingRecruiter; action: "approve" | "reject" } | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRecruiters = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, university, designation, approval_status, created_at")
      .eq("user_type", "recruiter")
      .order("created_at", { ascending: false });

    if (!error && data) {
      setRecruiters(data as PendingRecruiter[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchRecruiters();
  }, []);

  const handleAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);

    const newStatus = actionDialog.action === "approve" ? "approved" : "rejected";

    const { error } = await supabase
      .from("profiles")
      .update({ approval_status: newStatus })
      .eq("id", actionDialog.recruiter.id);

    if (error) {
      toast({
        title: "Error",
        description: `Failed to ${actionDialog.action} recruiter.`,
        variant: "destructive",
      });
    } else {
      toast({
        title: actionDialog.action === "approve" ? "Recruiter Approved" : "Recruiter Rejected",
        description: `${actionDialog.recruiter.full_name || actionDialog.recruiter.email} has been ${newStatus}.`,
      });
      fetchRecruiters();
      onRefetch();
    }

    setProcessing(false);
    setActionDialog(null);
    setNotes("");
  };

  const filtered = recruiters.filter((r) => {
    if (filter !== "all" && r.approval_status !== filter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        r.full_name?.toLowerCase().includes(q) ||
        r.email?.toLowerCase().includes(q) ||
        r.university?.toLowerCase().includes(q) ||
        r.designation?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  const pendingCount = recruiters.filter((r) => r.approval_status === "pending").length;
  const approvedCount = recruiters.filter((r) => r.approval_status === "approved").length;
  const rejectedCount = recruiters.filter((r) => r.approval_status === "rejected").length;

  const statusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading || parentLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Recruiter Approvals</h1>
        <p className="text-muted-foreground mt-1">Review and approve recruiter signup requests</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="cursor-pointer" onClick={() => setFilter("pending")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10"><Clock className="h-5 w-5 text-amber-600" /></div>
            <div>
              <p className="text-2xl font-bold">{pendingCount}</p>
              <p className="text-xs text-muted-foreground">Pending Approval</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter("approved")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10"><CheckCircle className="h-5 w-5 text-emerald-600" /></div>
            <div>
              <p className="text-2xl font-bold">{approvedCount}</p>
              <p className="text-xs text-muted-foreground">Approved</p>
            </div>
          </CardContent>
        </Card>
        <Card className="cursor-pointer" onClick={() => setFilter("rejected")}>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="p-2 rounded-lg bg-destructive/10"><XCircle className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-2xl font-bold">{rejectedCount}</p>
              <p className="text-xs text-muted-foreground">Rejected</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, email, institution, or designation..."
            className="pl-10"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex gap-2">
          {(["all", "pending", "approved", "rejected"] as const).map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
              className="capitalize"
            >
              {f}
            </Button>
          ))}
        </div>
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <User className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No recruiters found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((recruiter) => (
            <Card key={recruiter.id}>
              <CardContent className="p-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                      <User className="h-5 w-5 text-primary" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-sm truncate">{recruiter.full_name || "No name"}</p>
                        {statusBadge(recruiter.approval_status)}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1"><Mail className="h-3 w-3" />{recruiter.email || "—"}</span>
                        <span className="flex items-center gap-1"><Building2 className="h-3 w-3" />{recruiter.university || "—"}</span>
                        <span className="flex items-center gap-1"><Briefcase className="h-3 w-3" />{recruiter.designation || "—"}</span>
                      </div>
                      <p className="text-[10px] text-muted-foreground/60 mt-1">
                        Signed up {formatDistanceToNow(new Date(recruiter.created_at), { addSuffix: true })}
                      </p>
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {recruiter.approval_status === "pending" && (
                      <>
                        <Button
                          size="sm"
                          onClick={() => setActionDialog({ recruiter, action: "approve" })}
                          className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        >
                          <CheckCircle className="h-3.5 w-3.5 mr-1" />
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setActionDialog({ recruiter, action: "reject" })}
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <XCircle className="h-3.5 w-3.5 mr-1" />
                          Reject
                        </Button>
                      </>
                    )}
                    {recruiter.approval_status === "rejected" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActionDialog({ recruiter, action: "approve" })}
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        Approve
                      </Button>
                    )}
                    {recruiter.approval_status === "approved" && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setActionDialog({ recruiter, action: "reject" })}
                        className="text-destructive hover:bg-destructive/10"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1" />
                        Revoke
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Action Dialog */}
      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approve" ? "Approve Recruiter" : "Reject Recruiter"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm">
              <p><strong>Name:</strong> {actionDialog?.recruiter.full_name}</p>
              <p><strong>Email:</strong> {actionDialog?.recruiter.email}</p>
              <p><strong>Institution:</strong> {actionDialog?.recruiter.university || "Not specified"}</p>
              <p><strong>Designation:</strong> {actionDialog?.recruiter.designation || "Not specified"}</p>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional)</label>
              <Textarea
                placeholder="Add any notes about this decision..."
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="mt-1"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={actionDialog?.action === "approve" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionDialog?.action === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminRecruiterApprovals;
