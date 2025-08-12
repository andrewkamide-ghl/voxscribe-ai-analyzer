import { useState } from "react";
import { MODELS } from "@/config/ai";
import { useAIConfig } from "@/store/ai";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
export default function AIModelSelector({ compact = false }: { compact?: boolean }) {
  const { config, setConfig } = useAIConfig();
  const [customModel, setCustomModel] = useState<string>(config.model);
  const { toast } = useToast();
  const [validating, setValidating] = useState(false);
  const [validation, setValidation] = useState<{ ok: boolean; code?: string; message?: string } | null>(null);
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
        <p className="text-xs text-muted-foreground">Enter an exact OpenAI model ID (e.g., o3-2025-04-16 or a fine-tuned ID). We’ll route to the correct API automatically.</p>
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
              if (v) setConfig({ model: v });
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
    </div>
  );
}
