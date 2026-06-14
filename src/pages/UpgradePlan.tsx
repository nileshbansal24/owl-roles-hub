import { useEffect, useState } from "react";
import { Check, Sparkles, Zap, Crown, Loader2, Clock, CheckCircle2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecruiterLayout from "@/components/recruiter/RecruiterLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PlanId = "free" | "starter" | "pro";

const plans: Array<{
  id: PlanId;
  name: string;
  price: string;
  cadence: string;
  tagline: string;
  highlight?: boolean;
  icon: any;
  features: string[];
}> = [
  {
    id: "free",
    name: "Free",
    price: "₹0",
    cadence: "forever",
    tagline: "Get started and explore the platform",
    icon: Sparkles,
    features: [
      "Post up to 2 jobs",
      "Receive applications",
      "Basic analytics",
      "Email notifications",
    ],
  },
  {
    id: "starter",
    name: "Starter",
    price: "₹4,999",
    cadence: "per month",
    tagline: "For growing departments hiring regularly",
    icon: Zap,
    features: [
      "Post up to 15 jobs",
      "Full talent pool access",
      "Saved candidate folders",
      "Smart filters & sorting",
      "Priority email support",
    ],
  },
  {
    id: "pro",
    name: "Pro",
    price: "₹12,999",
    cadence: "per month",
    highlight: true,
    icon: Crown,
    tagline: "Best for institutions hiring at scale",
    features: [
      "Unlimited job posts",
      "Full talent pool + Smart Search",
      "AI candidate matching & ranking",
      "Bulk messaging & interview scheduling",
      "OR Credential Verification",
      "Dedicated success manager",
    ],
  },
];

interface PendingRequest {
  id: string;
  requested_plan: string;
  status: string;
  created_at: string;
  admin_notes: string | null;
}

const UpgradePlan = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState<PlanId | null>(null);
  const [pending, setPending] = useState<PendingRequest | null>(null);
  const [recent, setRecent] = useState<PendingRequest[]>([]);

  const load = async () => {
    if (!user) return;
    setLoading(true);
    const [{ data: profile }, { data: requests }] = await Promise.all([
      supabase.from("profiles").select("subscription_plan").eq("id", user.id).maybeSingle(),
      (supabase as any)
        .from("plan_upgrade_requests")
        .select("id, requested_plan, status, created_at, admin_notes")
        .eq("recruiter_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10),
    ]);
    setCurrentPlan(((profile?.subscription_plan as PlanId) || "free"));
    const list = (requests || []) as PendingRequest[];
    setRecent(list);
    setPending(list.find((r) => r.status === "pending") || null);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, [user]);

  const handleRequest = async (planId: PlanId) => {
    if (!user || planId === currentPlan) return;
    if (pending) {
      toast({ title: "Request already pending", description: "Wait for admin review before requesting another change." });
      return;
    }
    setSubmitting(planId);
    const { error } = await (supabase as any)
      .from("plan_upgrade_requests")
      .insert({
        recruiter_id: user.id,
        current_plan: currentPlan,
        requested_plan: planId,
        status: "pending",
      });
    setSubmitting(null);
    if (error) {
      toast({ title: "Couldn't submit request", description: error.message, variant: "destructive" });
      return;
    }
    toast({
      title: "Request submitted",
      description: "An admin will review your plan change shortly. You'll be notified once approved.",
    });
    load();
  };

  const statusBadge = (status: string) => {
    if (status === "approved") return <Badge className="bg-emerald-500/10 text-emerald-600 border-emerald-500/30" variant="outline"><CheckCircle2 className="h-3 w-3 mr-1" />Approved</Badge>;
    if (status === "rejected") return <Badge className="bg-destructive/10 text-destructive border-destructive/30" variant="outline"><XCircle className="h-3 w-3 mr-1" />Rejected</Badge>;
    return <Badge className="bg-amber-500/10 text-amber-600 border-amber-500/30" variant="outline"><Clock className="h-3 w-3 mr-1" />Pending review</Badge>;
  };

  return (
    <RecruiterLayout hasJobs title="Upgrade Plan">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Pick the plan that fits your hiring
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Plan changes are reviewed and approved by our team. Once approved, your account will be upgraded automatically.
          </p>
        </div>

        {pending && (
          <Card className="mb-6 border-amber-500/30 bg-amber-500/5">
            <CardContent className="p-4 flex items-center gap-3">
              <Clock className="h-5 w-5 text-amber-600 shrink-0" />
              <div className="flex-1 text-sm">
                <p className="font-medium text-foreground">
                  Pending request: <span className="capitalize">{pending.requested_plan}</span> plan
                </p>
                <p className="text-muted-foreground text-xs">
                  Submitted {new Date(pending.created_at).toLocaleString()}. An admin will review it shortly.
                </p>
              </div>
              {statusBadge(pending.status)}
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = plan.id === currentPlan;
              const isPendingThis = pending?.requested_plan === plan.id;
              return (
                <Card
                  key={plan.id}
                  className={cn(
                    "relative flex flex-col",
                    plan.highlight && "border-primary shadow-lg shadow-primary/10 ring-1 ring-primary/30"
                  )}
                >
                  {plan.highlight && (
                    <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                  )}
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        plan.highlight ? "bg-primary text-primary-foreground" : "bg-primary/10 text-primary"
                      )}>
                        <Icon className="h-5 w-5" />
                      </div>
                      <CardTitle className="font-heading text-xl">{plan.name}</CardTitle>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{plan.tagline}</p>
                    <div className="mt-4 flex items-baseline gap-1">
                      <span className="text-3xl font-bold text-foreground">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">/ {plan.cadence}</span>
                    </div>
                  </CardHeader>
                  <CardContent className="flex flex-col flex-1">
                    <ul className="space-y-2.5 flex-1">
                      {plan.features.map((f) => (
                        <li key={f} className="flex items-start gap-2 text-sm text-foreground/90">
                          <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full mt-6"
                      variant={plan.highlight ? "default" : "outline"}
                      disabled={isCurrent || !!pending || submitting !== null}
                      onClick={() => handleRequest(plan.id)}
                    >
                      {submitting === plan.id ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Submitting...</>
                      ) : isCurrent ? "Current plan"
                        : isPendingThis ? "Awaiting approval"
                        : pending ? "Request pending"
                        : plan.id === "free" ? "Request downgrade" : "Request upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {recent.length > 0 && (
          <div className="mt-10">
            <h2 className="font-heading text-lg font-semibold mb-3">Request history</h2>
            <div className="space-y-2">
              {recent.map((r) => (
                <Card key={r.id}>
                  <CardContent className="p-3 flex items-center justify-between gap-3 text-sm">
                    <div>
                      <p className="font-medium capitalize">{r.requested_plan} plan</p>
                      <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()}</p>
                      {r.admin_notes && (
                        <p className="text-xs text-muted-foreground mt-1 italic">Note: {r.admin_notes}</p>
                      )}
                    </div>
                    {statusBadge(r.status)}
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Prices shown are illustrative. Payments will be enabled soon.
        </p>
      </div>
    </RecruiterLayout>
  );
};

export default UpgradePlan;
