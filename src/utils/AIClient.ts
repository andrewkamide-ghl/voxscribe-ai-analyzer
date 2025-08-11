import type { AIConfig } from "@/store/ai";
import { supabase } from "@/integrations/supabase/client";

export async function askOpenAI(message: string, model: string, context?: string) {
  const prompt = context ? `${context}\n\nQuestion: ${message}` : message;
  const { data, error } = await supabase.functions.invoke<{ choices: { message: { content: string } }[] }>("ai-chat", {
    body: { prompt, model }
  });
  if (error) throw new Error(error.message || "AI request failed");
  return data as any;
}

export async function askWithConfig(config: AIConfig, message: string, context?: string) {
  return askOpenAI(message, config.model, context);
}
