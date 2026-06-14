import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  Crown,
  Loader2,
  ArrowRight,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface UpgradeRequest {
  id: string;
  recruiter_id: string;
  current_plan: string;
  requested_plan: string;
  status: string;
  admin_notes: string | null;
  created_at: string;
  reviewed_at: string | null;
  profile?: {
    full_name: string | null;
    email: string | null;
    university: string | null;
  } | null;
}

const AdminPlanUpgrades = () => {
  const { toast } = useToast();
  const [requests, setRequests] = useState<UpgradeRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "pending" | "approved" | "rejected">("pending");
  const [actionDialog, setActionDialog] = useState<{ req: UpgradeRequest; action: "approved" | "rejected" } | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);

  const fetchRequests = async () => {
    setLoading(true);
    const { data, error } = await (supabase as any)
      .from("plan_upgrade_requests")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      setLoading(false);
      return;
    }
    const rows = (data || []) as UpgradeRequest[];
    const ids = Array.from(new Set(rows.map((r) => r.recruiter_id)));
    if (ids.length) {
      const { data: profs } = await supabase
        .from("profiles")
        .select("id, full_name, email, university")
        .in("id", ids);
      const map = new Map((profs || []).map((p: any) => [p.id, p]));
      rows.forEach((r) => { r.profile = map.get(r.recruiter_id) || null; });
    }
    setRequests(rows);
    setLoading(false);
  };

  useEffect(() => { fetchRequests(); }, []);

  const handleAction = async () => {
    if (!actionDialog) return;
    setProcessing(true);
    const { data: { user } } = await supabase.auth.getUser();
    const { error } = await (supabase as any)
      .from("plan_upgrade_requests")
      .update({
        status: actionDialog.action,
        admin_notes: notes || null,
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      })
      .eq("id", actionDialog.req.id);

    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      toast({
        title: actionDialog.action === "approved" ? "Plan upgrade approved" : "Request rejected",
        description: actionDialog.action === "approved"
          ? `${actionDialog.req.profile?.full_name || "Recruiter"} upgraded to ${actionDialog.req.requested_plan}.`
          : "The recruiter will see this in their request history.",
      });
      fetchRequests();
    }
    setProcessing(false);
    setActionDialog(null);
    setNotes("");
  };

  const filtered = filter === "all" ? requests : requests.filter((r) => r.status === filter);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30"><CheckCircle className="h-3 w-3 mr-1" />Approved</Badge>;
    if (status === "rejected") return <Badge variant="outline" className="bg-destructive/10 text-destructive border-destructive/30"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    return <Badge variant="outline" className="bg-amber-500/10 text-amber-600 border-amber-500/30"><Clock className="h-3 w-3 mr-1" />Pending</Badge>;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold">Plan Upgrade Requests</h1>
        <p className="text-muted-foreground mt-1">
          {pendingCount > 0 ? `${pendingCount} request${pendingCount === 1 ? "" : "s"} awaiting your review` : "Review recruiter plan change requests"}
        </p>
      </div>

      <div className="flex gap-2 flex-wrap">
        {(["pending", "approved", "rejected", "all"] as const).map((f) => (
          <Button key={f} variant={filter === f ? "default" : "outline"} size="sm" onClick={() => setFilter(f)} className="capitalize">
            {f}
            {f === "pending" && pendingCount > 0 && <Badge className="ml-2 h-4 px-1.5">{pendingCount}</Badge>}
          </Button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Crown className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground">No {filter !== "all" ? filter : ""} requests</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <Card key={r.id}>
              <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <Crown className="h-5 w-5 text-primary" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{r.profile?.full_name || "Unknown recruiter"}</p>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{r.profile?.email} · {r.profile?.university || "—"}</p>
                    <div className="flex items-center gap-2 mt-2 text-sm">
                      <Badge variant="outline" className="capitalize">{r.current_plan}</Badge>
                      <ArrowRight className="h-3.5 w-3.5 text-muted-foreground" />
                      <Badge className="capitalize">{r.requested_plan}</Badge>
                    </div>
                    <p className="text-[10px] text-muted-foreground/60 mt-1">
                      Requested {formatDistanceToNow(new Date(r.created_at), { addSuffix: true })}
                    </p>
                    {r.admin_notes && (
                      <p className="text-xs italic text-muted-foreground mt-1">Note: {r.admin_notes}</p>
                    )}
                  </div>
                </div>
                {r.status === "pending" && (
                  <div className="flex gap-2 shrink-0">
                    <Button size="sm" onClick={() => setActionDialog({ req: r, action: "approved" })} className="bg-emerald-600 hover:bg-emerald-700 text-white">
                      <CheckCircle className="h-3.5 w-3.5 mr-1" />Approve
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setActionDialog({ req: r, action: "rejected" })} className="text-destructive hover:bg-destructive/10">
                      <XCircle className="h-3.5 w-3.5 mr-1" />Reject
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!actionDialog} onOpenChange={(o) => !o && setActionDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionDialog?.action === "approved" ? "Approve plan upgrade" : "Reject plan upgrade"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 bg-muted rounded-lg text-sm space-y-1">
              <p><strong>Recruiter:</strong> {actionDialog?.req.profile?.full_name} ({actionDialog?.req.profile?.email})</p>
              <p><strong>From:</strong> <span className="capitalize">{actionDialog?.req.current_plan}</span> → <strong>To:</strong> <span className="capitalize">{actionDialog?.req.requested_plan}</span></p>
            </div>
            <div>
              <label className="text-sm font-medium">Notes (optional, visible to recruiter)</label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} className="mt-1" placeholder="e.g. Approved post payment verification" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialog(null)}>Cancel</Button>
            <Button
              onClick={handleAction}
              disabled={processing}
              className={actionDialog?.action === "approved" ? "bg-emerald-600 hover:bg-emerald-700" : "bg-destructive hover:bg-destructive/90"}
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin mr-2" />}
              {actionDialog?.action === "approved" ? "Approve & upgrade" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlanUpgrades;
