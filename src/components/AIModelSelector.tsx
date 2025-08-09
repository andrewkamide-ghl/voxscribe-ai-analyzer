import { MODELS, PROVIDERS } from "@/config/ai";
import { DEFAULTS, type AIProvider, useAIConfig } from "@/store/ai";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AIModelSelector({ compact = false }: { compact?: boolean }) {
  const { config, setConfig } = useAIConfig();

  const onProviderChange = (p: AIProvider) => {
    const defaultModel = DEFAULTS[p];
    setConfig({ provider: p, model: defaultModel });
  };

  return (
    <div className={compact ? "grid grid-cols-2 gap-2" : "grid grid-cols-1 md:grid-cols-2 gap-3"}>
      <div className="space-y-1">
        <Label>AI Provider</Label>
        <Select value={config.provider} onValueChange={(v) => onProviderChange(v as AIProvider)}>
          <SelectTrigger aria-label="AI Provider">
            <SelectValue placeholder="Choose provider" />
          </SelectTrigger>
          <SelectContent>
            {PROVIDERS.map((p) => (
              <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>Model</Label>
        <Select
          value={config.model}
          onValueChange={(v) => setConfig({ model: v })}
        >
          <SelectTrigger aria-label="AI Model">
            <SelectValue placeholder="Choose model" />
          </SelectTrigger>
          <SelectContent>
            {MODELS[config.provider].map((m) => (
              <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
