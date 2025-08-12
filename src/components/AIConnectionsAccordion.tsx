import { useMemo, useState } from "react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import ProviderKeyManager from "@/components/ProviderKeyManager";
import { Badge } from "@/components/ui/badge";
import type { AIProvider } from "@/store/ai";

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

  const defaultOpen = useMemo(() => PROVIDER_META.map((p) => p.id), []);

  return (
    <Accordion type="multiple" defaultValue={defaultOpen} className="w-full">
      {PROVIDER_META.map((p) => (
        <AccordionItem key={p.id} value={p.id}>
          <AccordionTrigger>
            <div className="flex w-full items-center justify-between pr-4">
              <span className="text-base font-medium">{p.label}</span>
              {connected[p.id] && <Badge className="ml-2">Connected</Badge>}
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
