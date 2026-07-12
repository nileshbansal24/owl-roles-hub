import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, MessageCircle, RefreshCw, CheckCircle2, ExternalLink } from "lucide-react";

interface PairState {
  pairing_code: string;
  phone_number: string | null;
  linked: boolean;
  linked_at: string | null;
}

// Twilio's public WhatsApp sandbox number. Replace once you provision a production sender.
const OWL_WHATSAPP_NUMBER = "+1 415 523 8886";

const WhatsAppAssistantCard = () => {
  const [state, setState] = useState<PairState | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = async () => {
    const { data, error } = await supabase.functions.invoke("whatsapp-pair", {
      body: { action: "get" },
    });
    if (error || !data || (data as any).error) {
      toast.error("Couldn't load WhatsApp status");
      setLoading(false);
      return;
    }
    setState(data as PairState);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const regenerate = async () => {
    setRegenerating(true);
    const { data, error } = await supabase.functions.invoke("whatsapp-pair", {
      body: { action: "regenerate" },
    });
    setRegenerating(false);
    if (error || !data || (data as any).error) return toast.error("Failed to regenerate code");
    setState(data as PairState);
    toast.success("New pairing code generated");
  };

  const copy = (v: string) => {
    navigator.clipboard.writeText(v);
    toast.success("Copied");
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><Skeleton className="h-6 w-48" /></CardHeader>
        <CardContent><Skeleton className="h-24 w-full" /></CardContent>
      </Card>
    );
  }

  const linkMessage = state ? `LINK ${state.pairing_code}` : "";
  const waLink = `https://wa.me/${OWL_WHATSAPP_NUMBER.replace(/[^\d]/g, "")}?text=${encodeURIComponent(linkMessage)}`;

  return (
    <Card className="border-primary/20">
      <CardHeader>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-lg bg-green-500/10 text-green-600 grid place-items-center">
              <MessageCircle className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                WhatsApp Assistant
                {state?.linked ? (
                  <Badge className="bg-green-500/15 text-green-700 hover:bg-green-500/20 border-green-500/30">
                    <CheckCircle2 className="h-3 w-3 mr-1" /> Connected
                  </Badge>
                ) : (
                  <Badge variant="outline">Not linked</Badge>
                )}
              </CardTitle>
              <CardDescription>
                Chat with Owl on WhatsApp to search candidates — "Hey Owl! I need a HR manager"
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {state?.linked ? (
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2">
            <p className="text-sm">
              Linked to <span className="font-mono font-medium">{state.phone_number}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Send Owl a WhatsApp on <span className="font-medium">{OWL_WHATSAPP_NUMBER}</span> — try things like
              <em> "I need a senior HR manager in Delhi"</em> or <em>"Find me a Professor with 10+ years in NLP"</em>.
            </p>
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={regenerate} disabled={regenerating}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
                Unlink & regenerate code
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <ol className="text-sm space-y-2 list-decimal list-inside text-muted-foreground">
              <li>Save Owl's WhatsApp number: <span className="font-mono font-medium text-foreground">{OWL_WHATSAPP_NUMBER}</span></li>
              <li>Send this exact message to activate:</li>
            </ol>

            <div className="flex items-center gap-2 rounded-lg border bg-background p-3">
              <code className="flex-1 font-mono text-sm">{linkMessage}</code>
              <Button size="sm" variant="ghost" onClick={() => copy(linkMessage)}>
                <Copy className="h-3.5 w-3.5" />
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button size="sm" asChild>
                <a href={waLink} target="_blank" rel="noreferrer">
                  <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                  Open in WhatsApp
                </a>
              </Button>
              <Button size="sm" variant="outline" onClick={regenerate} disabled={regenerating}>
                <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${regenerating ? "animate-spin" : ""}`} />
                New code
              </Button>
            </div>

            <p className="text-xs text-muted-foreground">
              Only your linked WhatsApp number can query Owl. Bot replies are restricted to your recruiter account.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default WhatsAppAssistantCard;
