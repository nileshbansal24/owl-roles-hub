import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Copy, MessageCircle, RefreshCw, CheckCircle2, ExternalLink, AlertTriangle } from "lucide-react";

interface PairState {
  pairing_code: string;
  phone_number: string | null;
  linked: boolean;
  linked_at: string | null;
  sender_number?: string;
  sandbox_join_phrase?: string | null;
  sandbox_configured?: boolean;
  webhook_url?: string;
}

// Twilio's public WhatsApp sandbox number. Replace once you provision a production sender.
const OWL_WHATSAPP_NUMBER = "+1 415 523 8886";

async function callPairFunction(action: "get" | "regenerate") {
  const { data: sessionData } = await supabase.auth.getSession();
  const accessToken = sessionData.session?.access_token;

  if (!accessToken) {
    throw new Error("Please sign in again to load WhatsApp pairing.");
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/whatsapp-pair`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
      apikey: import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string,
    },
    body: JSON.stringify({ action }),
  });

  const text = await response.text();
  let data: unknown = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { error: text };
  }

  if (!response.ok || !data || (data as { error?: string }).error) {
    throw new Error((data as { error?: string })?.error || `WhatsApp pairing failed (${response.status})`);
  }

  return data as PairState;
}

const WhatsAppAssistantCard = () => {
  const [state, setState] = useState<PairState | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);

  const load = async () => {
    try {
      const data = await callPairFunction("get");
      setState(data);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Couldn't load WhatsApp status");
      setLoading(false);
      return;
    }
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const regenerate = async () => {
    setRegenerating(true);
    try {
      const data = await callPairFunction("regenerate");
      setState(data);
      toast.success("New pairing code generated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to regenerate code");
    } finally {
      setRegenerating(false);
    }
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

  const senderNumber = state?.sender_number || OWL_WHATSAPP_NUMBER;
  const linkMessage = state ? `LINK ${state.pairing_code}` : "";
  const joinMessage = state?.sandbox_join_phrase?.trim() || "";
  const sandboxReady = Boolean(state?.sandbox_configured && joinMessage);
  const joinWaLink = sandboxReady
    ? `https://wa.me/${senderNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(joinMessage)}`
    : null;
  const waLink = `https://wa.me/${senderNumber.replace(/[^\d]/g, "")}?text=${encodeURIComponent(linkMessage)}`;

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
                Chat with Owl on WhatsApp for hiring help and paid candidate search.
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
              Send Owl a WhatsApp on <span className="font-medium">{senderNumber}</span> — try things like
              <em> "I need a senior HR manager in Delhi"</em> or <em>"Find me a Professor with 10+ years in NLP"</em>.
            </p>
            {!sandboxReady && (
              <p className="text-xs text-muted-foreground">
                If Twilio says the sandbox is not connected, ask your admin to configure the real Twilio join phrase first. Sandbox membership expires after 72 hours.
              </p>
            )}
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
              <li>Save Owl's WhatsApp number: <span className="font-mono font-medium text-foreground">{senderNumber}</span></li>
              <li>{sandboxReady ? "Join the Twilio sandbox first, then send your Owl pairing code." : "Wait for the real Twilio sandbox join phrase to be configured, then pair your number."}</li>
            </ol>

            <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 space-y-2">
              <div className="flex items-start gap-2 text-sm font-medium text-amber-800">
                <AlertTriangle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                <span>{sandboxReady ? "Twilio sandbox requires a one-time join before Owl can receive your messages." : "Twilio sandbox setup is incomplete, so Owl cannot receive your WhatsApp messages yet."}</span>
              </div>
              {sandboxReady ? (
                <>
                  <div className="flex items-center gap-2 rounded-md border bg-background p-2">
                    <code className="flex-1 font-mono text-sm">{joinMessage}</code>
                    <Button size="sm" variant="ghost" onClick={() => copy(joinMessage)}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Use the exact <span className="font-mono">join ...</span> phrase shown here. Once Twilio confirms, send the Owl code below.
                  </p>
                </>
              ) : (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Do not send <span className="font-mono">join &lt;sandbox-name&gt;</span>. That is only a placeholder and Twilio will reject it.
                  </p>
                  {state?.webhook_url && (
                    <div className="flex items-center gap-2 rounded-md border bg-background p-2">
                      <code className="flex-1 break-all font-mono text-xs">{state.webhook_url}</code>
                      <Button size="sm" variant="ghost" onClick={() => copy(state.webhook_url!)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Admin setup needed: add the real Twilio sandbox join phrase and set Twilio's incoming message webhook to the URL above.
                  </p>
                </div>
              )}
              {joinWaLink && (
                <Button size="sm" variant="outline" asChild>
                  <a href={joinWaLink} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3.5 w-3.5 mr-1.5" />
                    Join sandbox
                  </a>
                </Button>
              )}
            </div>

            <p className="text-sm text-muted-foreground">After sandbox confirmation, send this exact message to activate Owl:</p>

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
                  Send pairing code
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
