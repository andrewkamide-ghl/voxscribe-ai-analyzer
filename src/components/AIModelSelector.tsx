import { useState } from "react";
import { MODELS } from "@/config/ai";
import { useAIConfig } from "@/store/ai";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
export default function AIModelSelector({ compact = false }: { compact?: boolean }) {
  const { config, setConfig } = useAIConfig();
  const [customModel, setCustomModel] = useState<string>(config.model);

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

      <div className="space-y-1">
        <Label htmlFor="custom-model">Or use custom model ID</Label>
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
            onClick={() => {
              const v = customModel.trim();
              if (v) setConfig({ model: v });
            }}
          >
            Use
          </Button>
        </div>
      </div>
    </div>
  );
}
