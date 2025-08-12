import { useEffect, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ProviderKeyManager from "@/components/ProviderKeyManager";
import { Badge } from "@/components/ui/badge";
import type { AIProvider } from "@/store/ai";
import { supabase } from "@/integrations/supabase/client";

const PROVIDER_META: { id: AIProvider; label: string; docsUrl: string }[] = [
  { id: "openai", label: "ChatGPT", docsUrl: "https://platform.openai.com/api-keys" },
  { id: "xai", label: "Grok", docsUrl: "https://developer.x.ai/docs/getting-started#api-keys" },
  { id: "google", label: "Google Gemini", docsUrl: "https://aistudio.google.com/app/apikey" },
  { id: "anthropic", label: "Claude", docsUrl: "https://console.anthropic.com/settings/keys" },
];

export default function AIConnectionsAccordion() {
  const [connected, setConnected] = useState<Record<AIProvider, boolean>>({
    openai: false,
    anthropic: false,
    google: false,
    xai: false,
  });

  // Fetch initial connection status for header badges
  useEffect(() => {
    let cancelled = false;
    async function load() {
      const results = await Promise.allSettled(
        PROVIDER_META.map((p) =>
          supabase.functions.invoke<{ credential: { last_four: string } | null }>("ai-keys-get", { body: { provider: p.id } })
        )
      );
      if (cancelled) return;
      const next: Record<AIProvider, boolean> = { openai: false, anthropic: false, google: false, xai: false };
      results.forEach((r, idx) => {
        if (r.status === "fulfilled" && (r.value.data as any)?.credential?.last_four) {
          const prov = PROVIDER_META[idx].id;
          next[prov] = true;
        }
      });
      setConnected(next);
    }
    load();
    return () => { cancelled = true };
  }, []);

  return (
    <Accordion type="single" collapsible className="w-full">
      {PROVIDER_META.map((p) => (
        <AccordionItem key={p.id} value={p.id}>
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between pr-4">
              <span className="text-base font-medium">{p.label}</span>
              {connected[p.id] && <Badge variant="success" className="ml-2">Connected</Badge>}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <ProviderKeyManager
              provider={p.id}
              label={p.label}
              docsUrl={p.docsUrl}
              onStatusChange={(isConn) => setConnected((prev) => ({ ...prev, [p.id]: isConn }))}
            />
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
