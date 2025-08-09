import type { AIProvider } from "@/store/ai";

export type ModelOption = { value: string; label: string };

export const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "perplexity", label: "Perplexity" },
  { value: "openai", label: "ChatGPT (OpenAI)" },
];

export const MODELS: Record<AIProvider, ModelOption[]> = {
  perplexity: [
    { value: "llama-3.1-sonar-small-128k-online", label: "Sonar Small (online)" },
    { value: "llama-3.1-sonar-large-128k-online", label: "Sonar Large (online)" },
  ],
  openai: [
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini" },
  ],
};
