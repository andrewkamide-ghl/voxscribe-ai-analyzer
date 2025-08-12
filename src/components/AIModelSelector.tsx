import { useEffect, useMemo, useState } from "react";
import { MODELS, PROVIDERS } from "@/config/ai";
import { useAIConfig } from "@/store/ai";
import type { AIProvider } from "@/store/ai";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";

// Helper: flatten model map to provider lookup
function buildModelToProvider() {
  const map = new Map<string, AIProvider>();
  (PROVIDERS.map((p) => p.value) as AIProvider[]).forEach((prov) => {
    MODELS[prov].forEach((m) => map.set(m.value, prov));
  });
  return map;
}

export default function AIModelSelector({ compact = false }: { compact?: boolean }) {
  const { config, setConfig } = useAIConfig();
  const [customModel, setCustomModel] = useState<string>(config.model);
  const [selected, setSelected] = useState<string>(config.model);
  const { toast } = useToast();
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{ ok: boolean; code?: string; message?: string } | null>(null);
  const [connected, setConnected] = useState<Record<AIProvider, boolean>>({ openai: false, anthropic: false, google: false, xai: false });

  const modelToProvider = useMemo(buildModelToProvider, []);

  // Fetch which providers have a saved key
  useEffect(() => {
    let cancelled = false;
    async function fetchAll() {
      try {
        const results = await Promise.allSettled(
          (PROVIDERS.map((p) => p.value) as AIProvider[]).map((prov) =>
            supabase.functions.invoke<{ credential: { last_four: string } | null }>("ai-keys-get", { body: { provider: prov } })
          )
        );
        const next: Record<AIProvider, boolean> = { openai: false, anthropic: false, google: false, xai: false };
        results.forEach((r, idx) => {
          const prov = (PROVIDERS[idx].value as AIProvider);
          if (r.status === "fulfilled" && (r.value.data as any)?.credential?.last_four) next[prov] = true;
        });
        if (!cancelled) setConnected(next);
      } catch (e) {
        // ignore
      }
    }
    fetchAll();
    return () => { cancelled = true };
  }, []);

  const connectedProviders = useMemo(() => (PROVIDERS.map((p) => p.value) as AIProvider[]).filter((p) => connected[p]), [connected]);

  const options = useMemo(() => {
    const list = connectedProviders.length
      ? connectedProviders.flatMap((prov) => MODELS[prov].filter((m) => m.value !== "__custom__"))
      : [];
    // Always keep custom as a last resort
    return [...list, { value: "__custom__", label: "Custom model…" }];
  }, [connectedProviders]);

  useEffect(() => {
    // Initialize selected from config
    const isPreset = options.some((m) => m.value === config.model);
    setSelected(isPreset ? config.model : "__custom__");
    setCustomModel(config.model);
  }, [config.model, options]);

  return (
    <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 gap-3"}>
      <div className="space-y-1">
        <Label>Model</Label>
        <Select
          value={selected}
          onOpenChange={(open) => {
            if (open && connectedProviders.length === 0) {
              toast({ title: "Connect an AI API key to select a model" });
            }
          }}
          onValueChange={(v) => {
            setSelected(v);
            if (v !== "__custom__") {
              const prov = modelToProvider.get(v) ?? config.provider;
              setConfig({ model: v, provider: prov });
            }
          }}
        >
          <SelectTrigger aria-label="AI Model">
            <SelectValue placeholder="Choose model" />
          </SelectTrigger>
          <SelectContent>
            {options.map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {selected === "__custom__" && (
        <div className="space-y-1">
          <Label htmlFor="custom-model">Or use custom model ID</Label>
          <p className="text-xs text-muted-foreground">Enter an exact model ID. We’ll route to the correct API when supported.</p>
          <div className="flex items-center gap-2">
            <Input
              id="custom-model"
              placeholder="e.g., o3-2025-04-16"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
            />
            <Button
              type="button"
              variant="secondary"
              disabled={!customModel.trim() || validating}
              onClick={async () => {
                const v = customModel.trim();
                if (!v) return;
                setValidating(true);
                setValidation(null);
                try {
                  const { data, error } = await supabase.functions.invoke('ai-models-validate', { body: { model: v } });
                  if (error) throw new Error(error.message || 'Validation failed');
                  setValidation(data as any);
                  if ((data as any)?.ok) {
                    toast({ title: 'Model validated', description: 'This model is accessible.' });
                  } else {
                    const d: any = data;
                    toast({ title: 'Validation failed', description: d?.message || 'Model not accessible', variant: 'destructive' });
                  }
                } catch (e: any) {
                  setValidation({ ok: false, message: e?.message || 'Validation error' });
                  toast({ title: 'Validation error', description: e?.message || 'Could not validate model', variant: 'destructive' });
                } finally {
                  setValidating(false);
                }
              }}
            >
              {validating ? 'Testing…' : 'Test'}
            </Button>
            <Button
              type="button"
              onClick={() => {
                const v = customModel.trim();
                if (v) {
                  setConfig({ model: v });
                }
              }}
            >
              Use
            </Button>
          </div>
          {validation && (
            <p className="text-xs text-muted-foreground" aria-live="polite">
              {validation.ok ? 'Model looks good.' : `${validation.code || 'Error'}: ${validation.message || 'Model not accessible.'}`}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

