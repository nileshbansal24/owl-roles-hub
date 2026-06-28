import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertTriangle, Loader2, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Scope = "all" | "recruiters" | "candidates";

type WipeCounts = {
  totalAccounts: number;
  recruiters: number;
  candidates: number;
  jobs: number;
  applications: number;
  events: number;
  interviews: number;
  messages: number;
  savedCandidates: number;
};

const scopeMeta: Record<Scope, { title: string; blurb: string }> = {
  all: {
    title: "Wipe ALL recruiters & job seekers",
    blurb: "Deletes every recruiter and job seeker account along with their jobs, applications, messages, interviews, saved candidates, events, and uploads. Admin accounts are preserved.",
  },
  recruiters: {
    title: "Wipe all recruiters",
    blurb: "Deletes every recruiter account and everything they created (jobs, events, messages, saved candidates, etc.). Job seekers are preserved.",
  },
  candidates: {
    title: "Wipe all job seekers",
    blurb: "Deletes every job seeker account along with their applications, interviews, saved status, and uploads. Recruiters are preserved.",
  },
};

const AdminDangerZone = () => {
  const [pendingScope, setPendingScope] = useState<Scope | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isWiping, setIsWiping] = useState(false);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<WipeCounts | null>(null);

  const openPreview = async (s: Scope) => {
    setPendingScope(s);
    setConfirmText("");
    setPreview(null);
    setIsLoadingPreview(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-wipe-all", {
        body: { scope: s, preview: true },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setPreview(data.counts as WipeCounts);
    } catch (e: any) {
      toast.error(e?.message ?? "Failed to load preview");
      setPendingScope(null);
    } finally {
      setIsLoadingPreview(false);
    }
  };

  const handleConfirm = async () => {
    if (!pendingScope) return;
    if (confirmText !== "DELETE") {
      toast.error("Type DELETE to confirm.");
      return;
    }
    setIsWiping(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-wipe-all", {
        body: { scope: pendingScope, confirm: "WIPE" },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success(`Wiped ${data?.deleted ?? 0} accounts.`);
      setPendingScope(null);
      setConfirmText("");
      setPreview(null);
    } catch (e: any) {
      toast.error(e?.message ?? "Wipe failed");
    } finally {
      setIsWiping(false);
    }
  };

  const closeDialog = () => {
    if (isWiping) return;
    setPendingScope(null);
    setConfirmText("");
    setPreview(null);
  };

  return (
    <div className="space-y-6">
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            One-click wipes for the entire database. You'll see a preview of how many records will be deleted before confirming. Admin accounts (including <span className="font-mono">admin@owlroles.com</span>) are always preserved. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {(Object.keys(scopeMeta) as Scope[]).map((s) => (
            <div key={s} className="rounded-lg border border-destructive/30 p-4 flex flex-col gap-3">
              <div>
                <p className="font-semibold">{scopeMeta[s].title}</p>
                <p className="text-sm text-muted-foreground mt-1">{scopeMeta[s].blurb}</p>
              </div>
              <Button
                variant="destructive"
                className="mt-auto"
                onClick={() => openPreview(s)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {s === "all" ? "Preview & wipe everything" : s === "recruiters" ? "Preview & wipe recruiters" : "Preview & wipe job seekers"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingScope !== null}
        onOpenChange={(open) => {
          if (!open) closeDialog();
        }}
      >
        <AlertDialogContent className="max-w-lg">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Review what will be deleted
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingScope && scopeMeta[pendingScope].blurb}
            </AlertDialogDescription>
          </AlertDialogHeader>

          <div className="rounded-md border bg-muted/40 p-4">
            {isLoadingPreview || !preview ? (
              <div className="flex items-center justify-center py-6 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin mr-2" /> Counting records…
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <span className="text-sm text-muted-foreground">Accounts to delete</span>
                  <span className="text-2xl font-bold text-destructive">{preview.totalAccounts}</span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <Row label="Recruiters" value={preview.recruiters} />
                  <Row label="Job seekers" value={preview.candidates} />
                  <Row label="Jobs" value={preview.jobs} />
                  <Row label="Applications" value={preview.applications} />
                  <Row label="Events" value={preview.events} />
                  <Row label="Interviews" value={preview.interviews} />
                  <Row label="Messages" value={preview.messages} />
                  <Row label="Saved candidates" value={preview.savedCandidates} />
                </div>
                {preview.totalAccounts === 0 && (
                  <p className="text-sm text-muted-foreground pt-2 border-t">
                    Nothing matches this scope right now.
                  </p>
                )}
              </div>
            )}
          </div>

          {preview && preview.totalAccounts > 0 && (
            <div className="space-y-2">
              <Label htmlFor="confirm-wipe">
                Type <span className="font-mono font-semibold">DELETE</span> to confirm
              </Label>
              <Input
                id="confirm-wipe"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoFocus
                disabled={isWiping}
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWiping}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={
                !preview ||
                preview.totalAccounts === 0 ||
                confirmText !== "DELETE" ||
                isWiping ||
                isLoadingPreview
              }
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isWiping ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Trash2 className="h-4 w-4 mr-2" />}
              Yes, wipe permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

const Row = ({ label, value }: { label: string; value: number }) => (
  <div className="flex items-center justify-between">
    <span className="text-muted-foreground">{label}</span>
    <span className="font-semibold tabular-nums">{value}</span>
  </div>
);

export default AdminDangerZone;
