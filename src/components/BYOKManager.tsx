
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

export default function BYOKManager() {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState("");
  const [lastFour, setLastFour] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isAuthed, setIsAuthed] = useState<boolean>(false);

  useEffect(() => {
    let mounted = true;
    // Establish listener first, then fetch session
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_evt, session) => {
      setIsAuthed(Boolean(session));
      if (!session) {
        setLastFour(null);
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
  }, []);

  async function fetchStatus() {
    const { data, error } = await supabase.functions.invoke<{ credential: { last_four: string } | null }>("ai-keys-get");
    if (!error) {
      setLastFour(data?.credential?.last_four ?? null);
    } else {
      console.error("ai-keys-get error", error);
    }
  }

  async function save() {
    if (!apiKey) {
      toast({ title: "Missing key", description: "Paste your OpenAI API key first." });
      return;
    }
    setLoading(true);
    const { data, error } = await supabase.functions.invoke<{ ok: boolean; last_four?: string }>("ai-keys-set", {
      body: { provider: "openai", apiKey },
    });
    setLoading(false);
    if (error || !data?.ok) {
      toast({ title: "Failed", description: error?.message || "Could not save key" });
    } else {
      setApiKey("");
      setLastFour(data.last_four || null);
      toast({ title: "Saved", description: "Your key is encrypted and stored securely." });
    }
  }

  async function remove() {
    if (!confirm("Remove your saved OpenAI key?")) return;
    setLoading(true);
    const { error } = await supabase.functions.invoke<{ ok: boolean }>("ai-keys-delete");
    setLoading(false);
    if (error) {
      toast({ title: "Failed", description: error.message });
    } else {
      setLastFour(null);
      toast({ title: "Removed", description: "Your key has been deleted." });
    }
  }

  if (!isAuthed) {
    return (
      <div className="text-sm text-muted-foreground">
        Sign in to manage your own OpenAI API key for billing on your account.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="text-sm text-muted-foreground">
        {lastFour
          ? <>A key ending in <span className="font-mono">…{lastFour}</span> is saved for your account.</>
          : "No key saved yet."}
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
        Your key is encrypted at rest with AES-GCM and never shared. Calls will use your key when available.
      </div>
    </div>
  );
}
