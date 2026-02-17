import { useState } from "react";
import { InstitutionData } from "@/hooks/useAdminStats";
import { format } from "date-fns";
import { Building2, CheckCircle, Clock, XCircle, Briefcase, Mail, Loader2, Trash2 } from "lucide-react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { FadeIn, staggerContainerVariants, staggerItemVariants } from "@/components/ui/fade-in";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminInstitutionsProps {
  institutions: InstitutionData[];
  loading: boolean;
  onRefetch: () => void;
}

const getStatusBadge = (status: string | null) => {
  switch (status) {
    case "verified":
      return (
        <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
          <CheckCircle className="h-3 w-3 mr-1" />
          Verified
        </Badge>
      );
    case "pending":
      return (
        <Badge className="bg-amber-500/10 text-amber-500 border-amber-500/20">
          <Clock className="h-3 w-3 mr-1" />
          Pending
        </Badge>
      );
    case "rejected":
      return (
        <Badge className="bg-destructive/10 text-destructive border-destructive/20">
          <XCircle className="h-3 w-3 mr-1" />
          Rejected
        </Badge>
      );
    default:
      return (
        <Badge variant="outline" className="text-muted-foreground">
          Not Requested
        </Badge>
      );
  }
};

const AdminInstitutions = ({ institutions, loading, onRefetch }: AdminInstitutionsProps) => {
  const { toast } = useToast();
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDialog, setConfirmDialog] = useState<{
    open: boolean;
    action: "verify" | "reject";
    institution: InstitutionData | null;
  }>({ open: false, action: "verify", institution: null });
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; institution: InstitutionData | null }>({
    open: false,
    institution: null,
  });

  const handleDeleteInstitution = async () => {
    const institution = confirmDelete.institution;
    if (!institution) return;

    setConfirmDelete({ open: false, institution: null });
    setDeletingId(institution.id);

    try {
      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { userId: institution.id },
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Recruiter Deleted",
        description: `${institution.full_name || "Recruiter"} and all associated data have been permanently removed.`,
      });

      onRefetch();
    } catch (error: any) {
      console.error("Error deleting recruiter:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete recruiter. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleVerificationAction = async (action: "verify" | "reject") => {
    const institution = confirmDialog.institution;
    if (!institution) return;

    setProcessingId(institution.id);
    setConfirmDialog({ open: false, action: "verify", institution: null });

    try {
      const newStatus = action === "verify" ? "verified" : "rejected";
      
      // Check if verification record exists
      const { data: existing } = await supabase
        .from("institution_verifications")
        .select("id")
        .eq("recruiter_id", institution.id)
        .single();

      if (existing) {
        // Update existing record
        const { error } = await supabase
          .from("institution_verifications")
          .update({
            status: newStatus,
            verified_at: action === "verify" ? new Date().toISOString() : null,
            verification_notes: `${action === "verify" ? "Verified" : "Rejected"} by admin on ${format(new Date(), "MMM d, yyyy")}`,
          })
          .eq("recruiter_id", institution.id);

        if (error) throw error;
      } else {
        // Insert new record
        const { error } = await supabase
          .from("institution_verifications")
          .insert({
            recruiter_id: institution.id,
            status: newStatus,
            verified_at: action === "verify" ? new Date().toISOString() : null,
            verification_notes: `${action === "verify" ? "Verified" : "Rejected"} by admin on ${format(new Date(), "MMM d, yyyy")}`,
          });

        if (error) throw error;
      }

      toast({
        title: action === "verify" ? "Institution Verified" : "Institution Rejected",
        description: `${institution.full_name || "Institution"} has been ${action === "verify" ? "verified" : "rejected"} successfully.`,
      });

      onRefetch();
    } catch (error) {
      console.error("Error updating verification:", error);
      toast({
        title: "Error",
        description: "Failed to update verification status. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 bg-muted rounded w-1/4 animate-pulse" />
        <Card className="animate-pulse">
          <CardContent className="p-6">
            <div className="space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-muted rounded" />
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const verified = institutions.filter(i => i.verification_status === "verified").length;
  const pending = institutions.filter(i => i.verification_status === "pending").length;
  const pendingInstitutions = institutions.filter(i => i.verification_status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl font-heading font-bold">Institutions</h1>
        <p className="text-muted-foreground mt-1">
          Manage all registered institutions and their verification status
        </p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10">
                <Building2 className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{institutions.length}</p>
                <p className="text-sm text-muted-foreground">Total Institutions</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.2}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10">
                <CheckCircle className="h-5 w-5 text-emerald-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{verified}</p>
                <p className="text-sm text-muted-foreground">Verified</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.3}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-amber-500/10">
                <Clock className="h-5 w-5 text-amber-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{pending}</p>
                <p className="text-sm text-muted-foreground">Pending Review</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Pending Verifications Section */}
      {pendingInstitutions.length > 0 && (
        <FadeIn delay={0.35}>
          <Card className="border-amber-500/30 bg-amber-500/5">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-amber-600">
                <Clock className="h-5 w-5" />
                Pending Verification Requests ({pendingInstitutions.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {pendingInstitutions.map((institution) => (
                  <div 
                    key={institution.id}
                    className="flex items-center justify-between p-4 bg-background rounded-lg border"
                  >
                    <div className="flex-1">
                      <p className="font-medium">{institution.full_name || "Unknown"}</p>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        {institution.email && (
                          <span className="flex items-center gap-1">
                            <Mail className="h-3 w-3" />
                            {institution.email}
                          </span>
                        )}
                        {institution.university && (
                          <span className="flex items-center gap-1">
                            <Building2 className="h-3 w-3" />
                            {institution.university}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Briefcase className="h-3 w-3" />
                          {institution.jobs_count} jobs
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="outline"
                        className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                        disabled={processingId === institution.id}
                        onClick={() => setConfirmDialog({ open: true, action: "reject", institution })}
                      >
                        {processingId === institution.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <XCircle className="h-4 w-4 mr-1" />
                            Reject
                          </>
                        )}
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-500 hover:bg-emerald-600"
                        disabled={processingId === institution.id}
                        onClick={() => setConfirmDialog({ open: true, action: "verify", institution })}
                      >
                        {processingId === institution.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <>
                            <CheckCircle className="h-4 w-4 mr-1" />
                            Verify
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      )}

      {/* Institutions Table */}
      <FadeIn delay={0.4}>
        <Card>
          <CardHeader>
            <CardTitle>All Institutions</CardTitle>
          </CardHeader>
          <CardContent>
            {institutions.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No institutions registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-center">Jobs</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <motion.tbody
                      variants={staggerContainerVariants}
                      initial="hidden"
                      animate="visible"
                      className="contents"
                    >
                      {institutions.map((institution) => (
                        <motion.tr
                          key={institution.id}
                          variants={staggerItemVariants}
                          className="contents"
                        >
                          <TableRow>
                            <TableCell className="font-medium">
                              {institution.full_name || "—"}
                            </TableCell>
                            <TableCell>
                              {institution.email ? (
                                <a 
                                  href={`mailto:${institution.email}`}
                                  className="flex items-center gap-1 text-primary hover:underline"
                                >
                                  <Mail className="h-3 w-3" />
                                  {institution.email}
                                </a>
                              ) : "—"}
                            </TableCell>
                            <TableCell className="text-muted-foreground">
                              {institution.university || "—"}
                            </TableCell>
                            <TableCell>
                              {getStatusBadge(institution.verification_status)}
                            </TableCell>
                            <TableCell className="text-center">
                              <div className="flex items-center justify-center gap-1">
                                <Briefcase className="h-3 w-3 text-muted-foreground" />
                                {institution.jobs_count}
                              </div>
                            </TableCell>
                            <TableCell className="text-muted-foreground text-sm">
                              {format(new Date(institution.created_at), "MMM d, yyyy")}
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-1">
                                {institution.verification_status === "pending" && (
                                  <>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-destructive hover:bg-destructive/10"
                                      disabled={processingId === institution.id || deletingId === institution.id}
                                      onClick={() => setConfirmDialog({ open: true, action: "reject", institution })}
                                    >
                                      <XCircle className="h-3 w-3" />
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      className="h-7 text-emerald-500 hover:bg-emerald-500/10"
                                      disabled={processingId === institution.id || deletingId === institution.id}
                                      onClick={() => setConfirmDialog({ open: true, action: "verify", institution })}
                                    >
                                      <CheckCircle className="h-3 w-3" />
                                    </Button>
                                  </>
                                )}
                                {institution.verification_status === "verified" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-destructive hover:bg-destructive/10"
                                    disabled={processingId === institution.id || deletingId === institution.id}
                                    onClick={() => setConfirmDialog({ open: true, action: "reject", institution })}
                                  >
                                    Revoke
                                  </Button>
                                )}
                                {institution.verification_status === "rejected" && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    className="h-7 text-emerald-500 hover:bg-emerald-500/10"
                                    disabled={processingId === institution.id || deletingId === institution.id}
                                    onClick={() => setConfirmDialog({ open: true, action: "verify", institution })}
                                  >
                                    Re-verify
                                  </Button>
                                )}
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  className="h-7 text-destructive hover:bg-destructive/10"
                                  disabled={deletingId === institution.id}
                                  onClick={() => setConfirmDelete({ open: true, institution })}
                                >
                                  {deletingId === institution.id ? (
                                    <Loader2 className="h-3 w-3 animate-spin" />
                                  ) : (
                                    <Trash2 className="h-3 w-3" />
                                  )}
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        </motion.tr>
                      ))}
                    </motion.tbody>
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmDialog.open} onOpenChange={(open) => !open && setConfirmDialog({ ...confirmDialog, open: false })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {confirmDialog.action === "verify" ? "Verify Institution" : "Reject Institution"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmDialog.action === "verify" 
                ? `Are you sure you want to verify "${confirmDialog.institution?.full_name || "this institution"}"? They will receive a verified badge and gain full platform access.`
                : `Are you sure you want to reject "${confirmDialog.institution?.full_name || "this institution"}"? They will be notified of this decision.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className={confirmDialog.action === "verify" ? "bg-emerald-500 hover:bg-emerald-600" : "bg-destructive hover:bg-destructive/90"}
              onClick={() => handleVerificationAction(confirmDialog.action)}
            >
              {confirmDialog.action === "verify" ? "Verify" : "Reject"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDelete.open} onOpenChange={(open) => !open && setConfirmDelete({ open: false, institution: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Recruiter</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{confirmDelete.institution?.full_name || "this recruiter"}</strong> and ALL their data including profile, jobs, applications, events, and auth account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteInstitution} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminInstitutions;