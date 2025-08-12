import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { HelpCircle } from "lucide-react";
import type { AIProvider } from "@/store/ai";

interface ProviderKeyManagerProps {
  provider: AIProvider;
  label: string;
  docsUrl: string;
  onStatusChange?: (connected: boolean) => void;
}

export default function ProviderKeyManager({ provider, label, docsUrl, onStatusChange }: ProviderKeyManagerProps) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [lastFour, setLastFour] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  const connected = Boolean(lastFour);

  useEffect(() => {
    let mounted = true;
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsAuthed(Boolean(session));
      if (!session) {
        setLastFour(null);
        onStatusChange?.(false);
      } else {
        void fetchStatus();
      }
    });
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setIsAuthed(Boolean(data.session));
      if (data.session) void fetchStatus();
    });
    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchStatus() {
    const { data, error } = await supabase.functions.invoke<{ credential: { last_four: string } | null }>("ai-keys-get", { body: { provider } });
    if (!error) {
      const lf = data?.credential?.last_four ?? null;
      setLastFour(lf);
      onStatusChange?.(Boolean(lf));
    } else {
      console.error("ai-keys-get error", error);
    }
  }

  async function save() {
    if (!apiKey) {
      toast({ title: "Missing key", description: `Paste your ${label} API key first.` });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke<{ ok: boolean; last_four?: string }>("ai-keys-set", {
      body: { provider, apiKey },
    });
    setLoading(false);
    if (error || !data?.ok) {
      toast({ title: "Failed", description: error?.message || "Could not save key", variant: "destructive" });
    } else {
      setApiKey("");
      const lf = data.last_four || null;
      setLastFour(lf);
      onStatusChange?.(Boolean(lf));
      toast({ title: "Saved", description: "Your key is encrypted and stored securely." });
    }
  }

  async function remove() {
    if (!confirm(`Remove your saved ${label} key?`)) return;
    setLoading(true);
    const { error } = await supabase.functions.invoke<{ ok: boolean }>("ai-keys-delete", { body: { provider } });
    setLoading(false);
    if (error) {
      toast({ title: "Failed", description: error.message, variant: "destructive" });
    } else {
      setLastFour(null);
      onStatusChange?.(false);
      toast({ title: "Removed", description: "Your key has been deleted." });
    }
  }

  if (!isAuthed) {
    return (
      <div className="text-sm text-muted-foreground">
        Sign in to manage your {label} API key for billing on your account.
      </div>
    );
  }

  return (
    <div className="relative space-y-3">
      {connected && (
        <Badge className="absolute right-0 top-0">Connected</Badge>
      )}

      <div className="flex items-center justify-between">
        <h3 className="text-base font-semibold">{label} API Key</h3>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <button type="button" aria-label={`${label} API key help`} className="text-muted-foreground">
                <HelpCircle className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent className="max-w-xs">
              <p className="text-xs">
                {label} will only be functional after you add an API key. Learn how to generate a key in the docs.
              </p>
              <a
                href={docsUrl}
                target="_blank"
                rel="noreferrer"
                className="text-xs underline"
              >
                Open {label} docs
              </a>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>

      <div className="text-sm text-muted-foreground">
        {lastFour ? (
          <>A key ending in <span className="font-mono">…{lastFour}</span> is saved for your account.</>
        ) : (
          "No key saved yet."
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2">
        <Input
          type="password"
          placeholder="sk-..."
          value={apiKey}
          onChange={(e) => setApiKey(e.target.value)}
          className="font-mono"
        />
        <Button type="button" onClick={save} disabled={loading || apiKey.length < 8}>
          {loading ? "Saving…" : lastFour ? "Update Key" : "Save Key"}
        </Button>
        {lastFour && (
          <Button type="button" variant="outline" onClick={remove} disabled={loading}>
            Remove
          </Button>
        )}
      </div>

      <div className="text-xs text-muted-foreground">
        Your key is encrypted at rest and never shared. Calls will use your key when available.
      </div>
    </div>
  );
}
