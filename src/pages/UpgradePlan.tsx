import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Check, Sparkles, Zap, Crown, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import RecruiterLayout from "@/components/recruiter/RecruiterLayout";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

type PlanId = "free" | "starter" | "pro" | "enterprise";

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

const UpgradePlan = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentPlan, setCurrentPlan] = useState<PlanId>("free");
  const [loading, setLoading] = useState(true);
  const [upgrading, setUpgrading] = useState<PlanId | null>(null);

  useEffect(() => {
    if (!user) return;
    supabase
      .from("profiles")
      .select("subscription_plan")
      .eq("id", user.id)
      .maybeSingle()
      .then(({ data }) => {
        setCurrentPlan(((data?.subscription_plan as PlanId) || "free"));
        setLoading(false);
      });
  }, [user]);

  const handleSelect = async (planId: PlanId) => {
    if (!user || planId === currentPlan) return;
    setUpgrading(planId);
    const { error } = await supabase
      .from("profiles")
      .update({ subscription_plan: planId })
      .eq("id", user.id);
    setUpgrading(null);
    if (error) {
      toast({ title: "Couldn't update plan", description: error.message, variant: "destructive" });
      return;
    }
    setCurrentPlan(planId);
    toast({ title: "Plan updated", description: `You are now on the ${planId} plan.` });
  };

  return (
    <RecruiterLayout hasJobs title="Upgrade Plan">
      <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground tracking-tight">
            Pick the plan that fits your hiring
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Unlock the full talent pool, unlimited job posts and AI tooling. Switch or cancel anytime.
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan) => {
              const Icon = plan.icon;
              const isCurrent = plan.id === currentPlan;
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
                      disabled={isCurrent || upgrading !== null}
                      onClick={() => handleSelect(plan.id)}
                    >
                      {upgrading === plan.id ? (
                        <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Updating...</>
                      ) : isCurrent ? "Current plan" : plan.id === "free" ? "Downgrade" : "Upgrade"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        <p className="text-center text-xs text-muted-foreground mt-8">
          Prices shown are illustrative. Payments will be enabled soon — your plan changes instantly for now.
        </p>
      </div>
    </RecruiterLayout>
  );
};

export default UpgradePlan;
