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
    } catch (e: any) {
      toast.error(e?.message ?? "Wipe failed");
    } finally {
      setIsWiping(false);
    }
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
            One-click wipes for the entire database. Admin accounts (including <span className="font-mono">admin@owlroles.com</span>) are always preserved. This action cannot be undone.
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
                onClick={() => {
                  setPendingScope(s);
                  setConfirmText("");
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                {s === "all" ? "Wipe everything" : s === "recruiters" ? "Wipe recruiters" : "Wipe job seekers"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      <AlertDialog
        open={pendingScope !== null}
        onOpenChange={(open) => {
          if (!open && !isWiping) {
            setPendingScope(null);
            setConfirmText("");
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" /> Confirm permanent deletion
            </AlertDialogTitle>
            <AlertDialogDescription>
              {pendingScope && scopeMeta[pendingScope].blurb}
              <br />
              <br />
              This will purge auth accounts, profiles, jobs, applications, messages, interviews, events, and all related records. There is no undo.
            </AlertDialogDescription>
          </AlertDialogHeader>
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
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isWiping}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                handleConfirm();
              }}
              disabled={confirmText !== "DELETE" || isWiping}
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

export default AdminDangerZone;
