import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import VerificationBadge from "@/components/recruiter/VerificationBadge";
import {
  Shield,
  CheckCircle2,
  XCircle,
  Building2,
  MapPin,
  Loader2,
  AlertTriangle,
  Clock,
  User,
} from "lucide-react";
import { motion } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface VerificationRequest {
  id: string;
  recruiter_id: string;
  status: "pending" | "verified" | "rejected";
  verification_notes: string | null;
  created_at: string;
  updated_at: string;
  recruiter?: {
    full_name: string | null;
    university: string | null;
    avatar_url: string | null;
    location: string | null;
    bio: string | null;
    email: string | null;
  };
}

const AdminVerification = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [requests, setRequests] = useState<VerificationRequest[]>([]);
  const [selectedRequest, setSelectedRequest] = useState<VerificationRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | null>(null);
  const [notes, setNotes] = useState("");
  const [processing, setProcessing] = useState(false);
  const [filter, setFilter] = useState<"all" | "pending" | "verified" | "rejected">("pending");

  useEffect(() => {
    if (!user) {
      navigate("/");
      return;
    }

    const checkAdminAndFetch = async () => {
      // Check if user is admin
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/");
        return;
      }

      setIsAdmin(true);

      // Fetch verification requests
      await fetchRequests();
    };

    checkAdminAndFetch();
  }, [user, navigate, toast]);

  const fetchRequests = async () => {
    setLoading(true);
    try {
      const { data: verifications, error } = await supabase
        .from("institution_verifications")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch recruiter profiles for each verification
      const recruiterIds = verifications?.map((v) => v.recruiter_id) || [];
      
      interface ProfileData {
        id: string;
        full_name: string | null;
        university: string | null;
        avatar_url: string | null;
        location: string | null;
        bio: string | null;
        email: string | null;
      }
      
      const { data: profiles } = recruiterIds.length > 0
        ? await supabase
            .from("profiles")
            .select("id, full_name, university, avatar_url, location, bio, email")
            .in("id", recruiterIds)
        : { data: [] as ProfileData[] };

      const profileMap = new Map<string, ProfileData>(
        (profiles as ProfileData[] | null)?.map((p) => [p.id, p] as [string, ProfileData]) || []
      );

      const enrichedRequests: VerificationRequest[] = (verifications || []).map((v) => ({
        ...v,
        status: v.status as "pending" | "verified" | "rejected",
        recruiter: profileMap.get(v.recruiter_id),
      }));

      setRequests(enrichedRequests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      toast({
        title: "Error",
        description: "Failed to fetch verification requests.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAction = (request: VerificationRequest, action: "approve" | "reject") => {
    setSelectedRequest(request);
    setActionType(action);
    setNotes("");
    setActionDialogOpen(true);
  };

  const processAction = async () => {
    if (!selectedRequest || !actionType) return;

    setProcessing(true);
    try {
      const newStatus = actionType === "approve" ? "verified" : "rejected";
      
      const { error } = await supabase
        .from("institution_verifications")
        .update({
          status: newStatus,
          verification_notes: notes || null,
          verified_at: actionType === "approve" ? new Date().toISOString() : null,
        })
        .eq("id", selectedRequest.id);

      if (error) throw error;

      toast({
        title: actionType === "approve" ? "Institution Verified!" : "Request Rejected",
        description: `The verification request has been ${actionType === "approve" ? "approved" : "rejected"}.`,
      });

      setActionDialogOpen(false);
      await fetchRequests();
    } catch (error: any) {
      console.error("Error processing action:", error);
      toast({
        title: "Action Failed",
        description: error.message || "Failed to process verification action.",
        variant: "destructive",
      });
    } finally {
      setProcessing(false);
    }
  };

  const filteredRequests = requests.filter((r) => 
    filter === "all" ? true : r.status === filter
  );

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "?";
    return name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2);
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-6"
        >
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary/10">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-heading font-bold text-foreground">
                  Verification Admin
                </h1>
                <p className="text-muted-foreground text-sm">
                  Manage institution verification requests
                </p>
              </div>
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              {(["pending", "verified", "rejected", "all"] as const).map((f) => (
                <Button
                  key={f}
                  variant={filter === f ? "default" : "outline"}
                  size="sm"
                  onClick={() => setFilter(f)}
                  className="capitalize"
                >
                  {f}
                  {f !== "all" && (
                    <Badge variant="secondary" className="ml-2">
                      {requests.filter((r) => r.status === f).length}
                    </Badge>
                  )}
                </Button>
              ))}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-amber-500/10">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {requests.filter((r) => r.status === "pending").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Pending</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-emerald-500/10">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {requests.filter((r) => r.status === "verified").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Verified</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-destructive/10">
                    <XCircle className="h-5 w-5 text-destructive" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {requests.filter((r) => r.status === "rejected").length}
                    </p>
                    <p className="text-xs text-muted-foreground">Rejected</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <User className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-foreground">
                      {requests.length}
                    </p>
                    <p className="text-xs text-muted-foreground">Total</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Requests List */}
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : filteredRequests.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">No verification requests found.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {filteredRequests.map((request) => (
                <motion.div
                  key={request.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                >
                  <Card>
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row md:items-center gap-4">
                        {/* Avatar & Info */}
                        <div className="flex items-center gap-4 flex-1">
                          <Avatar className="h-16 w-16 border-2 border-primary/20">
                            <AvatarImage
                              src={request.recruiter?.avatar_url || undefined}
                              alt={request.recruiter?.university || "Institution"}
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-bold">
                              {request.recruiter?.university
                                ? getInitials(request.recruiter.university)
                                : <Building2 className="h-6 w-6" />}
                            </AvatarFallback>
                          </Avatar>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-semibold text-foreground">
                                {request.recruiter?.university || "Unknown Institution"}
                              </h3>
                              <VerificationBadge status={request.status} size="sm" />
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {request.recruiter?.full_name || "Unknown Recruiter"}
                            </p>
                            {request.recruiter?.location && (
                              <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                <MapPin className="h-3 w-3" />
                                {request.recruiter.location}
                              </div>
                            )}
                            {request.recruiter?.bio && (
                              <p className="text-xs text-muted-foreground mt-2 line-clamp-2">
                                {request.recruiter.bio}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* Actions */}
                        <div className="flex items-center gap-2">
                          {request.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                onClick={() => handleAction(request, "approve")}
                                className="gap-1"
                              >
                                <CheckCircle2 className="h-4 w-4" />
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleAction(request, "reject")}
                                className="gap-1 text-destructive hover:text-destructive"
                              >
                                <XCircle className="h-4 w-4" />
                                Reject
                              </Button>
                            </>
                          )}
                          {request.status === "verified" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(request, "reject")}
                              className="gap-1 text-destructive hover:text-destructive"
                            >
                              <XCircle className="h-4 w-4" />
                              Revoke
                            </Button>
                          )}
                          {request.status === "rejected" && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleAction(request, "approve")}
                              className="gap-1"
                            >
                              <CheckCircle2 className="h-4 w-4" />
                              Re-approve
                            </Button>
                          )}
                        </div>
                      </div>

                      {/* Notes */}
                      {request.verification_notes && (
                        <div className="mt-4 p-3 rounded-lg bg-muted/50 text-sm">
                          <p className="text-xs text-muted-foreground font-medium mb-1">Admin Notes:</p>
                          <p className="text-foreground">{request.verification_notes}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </main>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" ? "Approve Verification" : "Reject Verification"}
            </DialogTitle>
            <DialogDescription>
              {actionType === "approve"
                ? "This will verify the institution and display a verification badge on their job listings."
                : "This will reject the verification request. You can add notes explaining why."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50">
              <Avatar className="h-12 w-12">
                <AvatarImage src={selectedRequest?.recruiter?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary">
                  {getInitials(selectedRequest?.recruiter?.university)}
                </AvatarFallback>
              </Avatar>
              <div>
                <p className="font-medium text-foreground">
                  {selectedRequest?.recruiter?.university || "Unknown"}
                </p>
                <p className="text-sm text-muted-foreground">
                  {selectedRequest?.recruiter?.full_name}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium text-foreground">
                Admin Notes (Optional)
              </label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes about this decision..."
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={processAction}
              disabled={processing}
              variant={actionType === "reject" ? "destructive" : "default"}
              className="gap-2"
            >
              {processing && <Loader2 className="h-4 w-4 animate-spin" />}
              {actionType === "approve" ? "Approve" : "Reject"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminVerification;
