import { MODELS } from "@/config/ai";
import { useAIConfig } from "@/store/ai";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function AIModelSelector({ compact = false }: { compact?: boolean }) {
  const { config, setConfig } = useAIConfig();


  return (
    <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 gap-3"}>
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
