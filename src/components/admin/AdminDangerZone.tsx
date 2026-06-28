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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { AlertTriangle, CheckCircle2, Loader2, RefreshCw, Trash2, XCircle } from "lucide-react";
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

type StepStatus = "pending" | "running" | "done" | "error";
type StepState = { key: string; label: string; status: StepStatus; message?: string };

const scopeMeta: Record<Scope, { title: string; blurb: string }> = {
  all: {
    title: "Wipe ALL recruiters & job seekers",
    blurb: "Deletes every recruiter and job seeker account along with their jobs, applications, messages, interviews, saved candidates, events, and uploads. Admin accounts are preserved.",
  },
  recruiters: {
    title: "Wipe all recruiters",
    blurb: "Deletes every recruiter account and everything they created. Job seekers are preserved.",
  },
  candidates: {
    title: "Wipe all job seekers",
    blurb: "Deletes every job seeker account along with their applications, interviews, saved status, and uploads. Recruiters are preserved.",
  },
};

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL as string;

const MAX_AUTO_RETRIES = 3;

const AdminDangerZone = () => {
  const [pendingScope, setPendingScope] = useState<Scope | null>(null);
  const [confirmText, setConfirmText] = useState("");
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [preview, setPreview] = useState<WipeCounts | null>(null);

  // Progress state
  const [progressOpen, setProgressOpen] = useState(false);
  const [activeScope, setActiveScope] = useState<Scope | null>(null);
  const [steps, setSteps] = useState<StepState[]>([]);
  const [currentStepIdx, setCurrentStepIdx] = useState(0);
  const [totalSteps, setTotalSteps] = useState(0);
  const [authProgress, setAuthProgress] = useState<{ processed: number; total: number } | null>(null);
  const [summary, setSummary] = useState<
    | { deleted: number; authDeleted: number; counts: WipeCounts; scope: Scope }
    | null
  >(null);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [isStreaming, setIsStreaming] = useState(false);
  const [retryAttempt, setRetryAttempt] = useState(0);
  const [retryCountdown, setRetryCountdown] = useState<number | null>(null);

  // Refs for resumability — refs (not state) so mid-stream values are current.
  const completedKeysRef = useRef<Set<string>>(new Set());
  const authProcessedRef = useRef<number>(0);
  const sawDoneRef = useRef<boolean>(false);
  const cancelRetryRef = useRef<boolean>(false);

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

  const runStream = async (scope: Scope) => {
    setStreamError(null);
    setIsStreaming(true);
    try {
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) throw new Error("Not authenticated");

      const resp = await fetch(`${SUPABASE_URL}/functions/v1/admin-wipe-all`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
          apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
        },
        body: JSON.stringify({
          scope,
          confirm: "WIPE",
          stream: true,
          skipSteps: Array.from(completedKeysRef.current),
          resumeAuthFrom: authProcessedRef.current,
        }),
      });

      if (!resp.ok || !resp.body) {
        const text = await resp.text();
        throw new Error(text || `Request failed (${resp.status})`);
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed) continue;
          try { handleEvent(JSON.parse(trimmed)); } catch { /* ignore */ }
        }
      }
      if (buffer.trim()) {
        try { handleEvent(JSON.parse(buffer.trim())); } catch { /* ignore */ }
      }

      if (!sawDoneRef.current) {
        throw new Error("Stream ended before completion");
      }
    } finally {
      setIsStreaming(false);
    }
  };

  const attemptWithRetry = async (scope: Scope) => {
    cancelRetryRef.current = false;
    for (let attempt = 0; attempt <= MAX_AUTO_RETRIES; attempt++) {
      setRetryAttempt(attempt);
      try {
        await runStream(scope);
        return; // success
      } catch (e: any) {
        if (sawDoneRef.current) return;
        const msg = e?.message ?? "Wipe failed";
        if (attempt >= MAX_AUTO_RETRIES) {
          setStreamError(`${msg} — auto-retry exhausted. You can retry manually.`);
          toast.error("Wipe interrupted. Retry available.");
          return;
        }
        const delay = Math.min(8000, 1000 * 2 ** attempt);
        setStreamError(`${msg} — retrying in ${Math.round(delay / 1000)}s (attempt ${attempt + 2}/${MAX_AUTO_RETRIES + 1})…`);
        const start = Date.now();
        while (Date.now() - start < delay) {
          if (cancelRetryRef.current) { setStreamError("Retry cancelled."); return; }
          setRetryCountdown(Math.max(0, Math.ceil((delay - (Date.now() - start)) / 1000)));
          await new Promise((r) => setTimeout(r, 200));
        }
        setRetryCountdown(null);
      }
    }
  };

  const startWipe = async () => {
    if (!pendingScope) return;
    if (confirmText !== "DELETE") {
      toast.error("Type DELETE to confirm.");
      return;
    }
    const scope = pendingScope;
    setPendingScope(null);
    setConfirmText("");
    setPreview(null);
    setActiveScope(scope);
    setSteps([]);
    setCurrentStepIdx(0);
    setTotalSteps(0);
    setAuthProgress(null);
    setSummary(null);
    setStreamError(null);
    setRetryAttempt(0);
    setRetryCountdown(null);
    completedKeysRef.current = new Set();
    authProcessedRef.current = 0;
    sawDoneRef.current = false;
    setProgressOpen(true);

    await attemptWithRetry(scope);
  };

  const manualRetry = async () => {
    if (!activeScope || isStreaming) return;
    setStreamError(null);
    await attemptWithRetry(activeScope);
  };

  const handleEvent = (evt: any) => {
    if (evt.type === "start") {
      setTotalSteps(evt.totalSteps ?? 0);
    } else if (evt.type === "step") {
      setCurrentStepIdx(evt.index);
      if (evt.status === "done") completedKeysRef.current.add(evt.key);
      setSteps((prev) => {
        const idx = prev.findIndex((s) => s.key === evt.key);
        const next: StepState = { key: evt.key, label: evt.label, status: evt.status, message: evt.message };
        if (idx === -1) return [...prev, next];
        const copy = [...prev];
        copy[idx] = next;
        return copy;
      });
    } else if (evt.type === "auth_progress") {
      setAuthProgress({ processed: evt.processed, total: evt.total });
      authProcessedRef.current = evt.processed;
      if (evt.processed >= evt.total && evt.total > 0) {
        completedKeysRef.current.add("auth_users");
      }
    } else if (evt.type === "done") {
      sawDoneRef.current = true;
      setSummary({
        deleted: evt.deleted,
        authDeleted: evt.authDeleted,
        counts: evt.counts,
        scope: evt.scope,
      });
    }
  };



  const closeConfirm = () => {
    setPendingScope(null);
    setConfirmText("");
    setPreview(null);
  };

  const closeProgress = () => {
    if (isStreaming) return;
    setProgressOpen(false);
    setActiveScope(null);
    setSteps([]);
    setSummary(null);
    setStreamError(null);
    setAuthProgress(null);
    setCurrentStepIdx(0);
    setTotalSteps(0);
  };

  const overallPct = totalSteps
    ? Math.min(100, Math.round(((summary ? totalSteps : Math.max(0, currentStepIdx - 1)) / totalSteps) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="h-5 w-5" />
            Danger Zone
          </CardTitle>
          <CardDescription>
            One-click wipes for the entire database. You'll see a preview of how many records will be deleted, then a live progress screen during the wipe. Admin accounts (including <span className="font-mono">admin@owlroles.com</span>) are always preserved. This action cannot be undone.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-3">
          {(Object.keys(scopeMeta) as Scope[]).map((s) => (
            <div key={s} className="rounded-lg border border-destructive/30 p-4 flex flex-col gap-3">
              <div>
                <p className="font-semibold">{scopeMeta[s].title}</p>
                <p className="text-sm text-muted-foreground mt-1">{scopeMeta[s].blurb}</p>
              </div>
              <Button variant="destructive" className="mt-auto" onClick={() => openPreview(s)}>
                <Trash2 className="h-4 w-4 mr-2" />
                {s === "all" ? "Preview & wipe everything" : s === "recruiters" ? "Preview & wipe recruiters" : "Preview & wipe job seekers"}
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Preview / confirm dialog */}
      <AlertDialog
        open={pendingScope !== null}
        onOpenChange={(open) => { if (!open) closeConfirm(); }}
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
              />
            </div>
          )}

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => { e.preventDefault(); startWipe(); }}
              disabled={!preview || preview.totalAccounts === 0 || confirmText !== "DELETE" || isLoadingPreview}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Yes, wipe permanently
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Live progress dialog */}
      <Dialog open={progressOpen} onOpenChange={(o) => { if (!o) closeProgress(); }}>
        <DialogContent className="max-w-lg" onInteractOutside={(e) => isStreaming && e.preventDefault()}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {summary ? (
                <><CheckCircle2 className="h-5 w-5 text-emerald-600" /> Wipe complete</>
              ) : streamError ? (
                <><XCircle className="h-5 w-5 text-destructive" /> Wipe failed</>
              ) : (
                <><Loader2 className="h-5 w-5 animate-spin text-destructive" /> Wiping data…</>
              )}
            </DialogTitle>
            <DialogDescription>
              {summary
                ? `Scope: ${activeScope}. All targeted records have been removed.`
                : streamError
                ? "The wipe was interrupted. Some records may have been deleted."
                : "Do not close this window. Each step runs against the database in order."}
            </DialogDescription>
          </DialogHeader>

          {!summary && !streamError && (
            <div className="space-y-2">
              <Progress value={overallPct} />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{currentStepIdx}/{totalSteps || "…"} steps</span>
                <span>{overallPct}%</span>
              </div>
            </div>
          )}

          <div className="max-h-72 overflow-y-auto rounded-md border bg-muted/30 p-3 space-y-1.5 text-sm">
            {steps.length === 0 && !streamError && (
              <div className="flex items-center text-muted-foreground py-2">
                <Loader2 className="h-3.5 w-3.5 animate-spin mr-2" /> Initializing…
              </div>
            )}
            {steps.map((s) => (
              <div key={s.key} className="flex items-center justify-between gap-2">
                <span className="truncate">{s.label}</span>
                <span className="shrink-0">
                  {s.status === "running" && <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />}
                  {s.status === "done" && <CheckCircle2 className="h-4 w-4 text-emerald-600" />}
                  {s.status === "error" && <XCircle className="h-4 w-4 text-destructive" />}
                  {s.status === "pending" && <span className="text-xs text-muted-foreground">queued</span>}
                </span>
              </div>
            ))}
            {authProgress && !summary && (
              <div className="pt-2 border-t mt-2 text-xs text-muted-foreground">
                Auth accounts: {authProgress.processed}/{authProgress.total}
              </div>
            )}
          </div>

          {summary && (
            <div className="rounded-md border bg-emerald-500/5 border-emerald-500/30 p-4 space-y-3">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-muted-foreground">Accounts deleted</span>
                <span className="text-2xl font-bold text-emerald-600">{summary.deleted}</span>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <Row label="Recruiters" value={summary.counts.recruiters} />
                <Row label="Job seekers" value={summary.counts.candidates} />
                <Row label="Auth accounts removed" value={summary.authDeleted} />
                <Row label="Jobs" value={summary.counts.jobs} />
                <Row label="Applications" value={summary.counts.applications} />
                <Row label="Events" value={summary.counts.events} />
                <Row label="Interviews" value={summary.counts.interviews} />
                <Row label="Messages" value={summary.counts.messages} />
                <Row label="Saved candidates" value={summary.counts.savedCandidates} />
              </div>
            </div>
          )}

          {streamError && (
            <div className="rounded-md border border-destructive/40 bg-destructive/5 p-3 text-sm text-destructive">
              {streamError}
            </div>
          )}

          <DialogFooter>
            <Button onClick={closeProgress} disabled={isStreaming} variant={summary ? "default" : "outline"}>
              {isStreaming ? "Working…" : "Close"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
