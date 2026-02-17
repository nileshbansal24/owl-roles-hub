import { useState } from "react";
import { CandidateData } from "@/hooks/useAdminStats";
import { format, formatDistanceToNow } from "date-fns";
import { Users, FileText, MapPin, Mail, GraduationCap, Trash2, Loader2 } from "lucide-react";
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
import { FadeIn } from "@/components/ui/fade-in";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AdminCandidatesProps {
  candidates: CandidateData[];
  loading: boolean;
  onRefetch?: () => void;
}

const AdminCandidates = ({ candidates, loading, onRefetch }: AdminCandidatesProps) => {
  const { toast } = useToast();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ open: boolean; candidate: CandidateData | null }>({
    open: false,
    candidate: null,
  });

  const handleDelete = async () => {
    const candidate = confirmDelete.candidate;
    if (!candidate) return;

    setConfirmDelete({ open: false, candidate: null });
    setDeletingId(candidate.id);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await supabase.functions.invoke("admin-delete-user", {
        body: { userId: candidate.id },
      });

      if (response.error) throw new Error(response.error.message);

      toast({
        title: "Candidate Deleted",
        description: `${candidate.full_name || "Candidate"} and all associated data have been permanently removed.`,
      });

      onRefetch?.();
    } catch (error: any) {
      console.error("Error deleting candidate:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to delete candidate. Please try again.",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
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

  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const activeCandidates = candidates.filter(
    c => c.last_active && new Date(c.last_active) >= thirtyDaysAgo
  ).length;
  const totalApplications = candidates.reduce((sum, c) => sum + c.applications_count, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-heading font-bold">Candidates</h1>
        <p className="text-muted-foreground mt-1">View all registered candidates and their activity</p>
      </motion.div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FadeIn delay={0.1}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-primary/10"><Users className="h-5 w-5 text-primary" /></div>
              <div>
                <p className="text-2xl font-bold">{candidates.length}</p>
                <p className="text-sm text-muted-foreground">Total Candidates</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.2}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-emerald-500/10"><Users className="h-5 w-5 text-emerald-500" /></div>
              <div>
                <p className="text-2xl font-bold">{activeCandidates}</p>
                <p className="text-sm text-muted-foreground">Active (30d)</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
        <FadeIn delay={0.3}>
          <Card>
            <CardContent className="p-4 flex items-center gap-4">
              <div className="p-3 rounded-lg bg-violet-500/10"><FileText className="h-5 w-5 text-violet-500" /></div>
              <div>
                <p className="text-2xl font-bold">{totalApplications}</p>
                <p className="text-sm text-muted-foreground">Total Applications</p>
              </div>
            </CardContent>
          </Card>
        </FadeIn>
      </div>

      {/* Candidates Table */}
      <FadeIn delay={0.4}>
        <Card>
          <CardHeader><CardTitle>All Candidates</CardTitle></CardHeader>
          <CardContent>
            {candidates.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No candidates registered yet</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>University</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead className="text-center">Applications</TableHead>
                      <TableHead>Last Active</TableHead>
                      <TableHead>Joined</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {candidates.map((candidate) => {
                      const isActive = candidate.last_active && new Date(candidate.last_active) >= thirtyDaysAgo;
                      return (
                        <TableRow key={candidate.id}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {candidate.full_name || "—"}
                              {isActive && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 text-xs">Active</Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {candidate.email ? (
                              <a href={`mailto:${candidate.email}`} className="flex items-center gap-1 text-primary hover:underline">
                                <Mail className="h-3 w-3" />{candidate.email}
                              </a>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            {candidate.university ? (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <GraduationCap className="h-3 w-3" />{candidate.university}
                              </div>
                            ) : "—"}
                          </TableCell>
                          <TableCell>
                            {candidate.location ? (
                              <div className="flex items-center gap-1 text-muted-foreground">
                                <MapPin className="h-3 w-3" />{candidate.location}
                              </div>
                            ) : "—"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant="outline">{candidate.applications_count}</Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {candidate.last_active
                              ? formatDistanceToNow(new Date(candidate.last_active), { addSuffix: true })
                              : "Never"}
                          </TableCell>
                          <TableCell className="text-muted-foreground text-sm">
                            {format(new Date(candidate.created_at), "MMM d, yyyy")}
                          </TableCell>
                          <TableCell>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-7 text-destructive hover:bg-destructive/10"
                              disabled={deletingId === candidate.id}
                              onClick={() => setConfirmDelete({ open: true, candidate })}
                            >
                              {deletingId === candidate.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </FadeIn>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={confirmDelete.open} onOpenChange={(open) => !open && setConfirmDelete({ open: false, candidate: null })}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Permanently Delete Candidate</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove <strong>{confirmDelete.candidate?.full_name || "this candidate"}</strong> and ALL their data including profile, applications, interviews, submissions, and auth account. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete Permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminCandidates;
