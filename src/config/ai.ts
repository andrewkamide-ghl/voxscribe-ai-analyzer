import type { AIProvider } from "@/store/ai";

export type ModelOption = { value: string; label: string };

export const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "openai", label: "ChatGPT (OpenAI)" },
];

export const MODELS: Record<AIProvider, ModelOption[]> = {
  openai: [
    { value: "gpt-4.1-2025-04-14", label: "GPT-4.1 (2025-04-14)" },
    { value: "gpt-4.1-mini-2025-04-14", label: "GPT-4.1 mini (2025-04-14)" },
    { value: "gpt-4o", label: "GPT-4o" },
    { value: "gpt-4o-mini", label: "GPT-4o mini" },
    { value: "o4-mini-2025-04-16", label: "o4-mini (reasoning, 2025-04-16)" },
    { value: "o3-2025-04-16", label: "o3 (reasoning, 2025-04-16)" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini (legacy)" },
    { value: "__custom__", label: "Custom model…" },
  ],
};
