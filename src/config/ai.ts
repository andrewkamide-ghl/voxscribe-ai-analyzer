import type { AIProvider } from "@/store/ai";

export type ModelOption = { value: string; label: string };

export const PROVIDERS: { value: AIProvider; label: string }[] = [
  { value: "openai", label: "ChatGPT (OpenAI)" },
  { value: "anthropic", label: "Claude (Anthropic)" },
  { value: "google", label: "Google Gemini" },
  { value: "xai", label: "Grok (xAI)" },
];

export const MODELS: Record<AIProvider, ModelOption[]> = {
  openai: [
    { value: "gpt-4.1-2025-04-14", label: "GPT-4.1 (2025-04-14) — ChatGPT" },
    { value: "gpt-4.1-mini-2025-04-14", label: "GPT-4.1 mini (2025-04-14) — ChatGPT" },
    { value: "gpt-4o", label: "GPT-4o — ChatGPT" },
    { value: "gpt-4o-mini", label: "GPT-4o mini — ChatGPT" },
    { value: "o4-mini-2025-04-16", label: "o4-mini (reasoning, 2025-04-16) — ChatGPT" },
    { value: "o3-2025-04-16", label: "o3 (reasoning, 2025-04-16) — ChatGPT" },
    { value: "gpt-4.1-mini", label: "GPT-4.1 mini (legacy) — ChatGPT" },
    { value: "__custom__", label: "Custom model…" },
  ],
  anthropic: [
    { value: "claude-3.7-sonnet", label: "Claude 3.7 Sonnet — Claude" },
    { value: "claude-3.5-haiku", label: "Claude 3.5 Haiku — Claude" },
    { value: "__custom__", label: "Custom model…" },
  ],
  google: [
    { value: "gemini-1.5-pro", label: "Gemini 1.5 Pro — Gemini" },
    { value: "gemini-1.5-flash", label: "Gemini 1.5 Flash — Gemini" },
    { value: "__custom__", label: "Custom model…" },
  ],
  xai: [
    { value: "grok-2", label: "Grok-2 — Grok" },
    { value: "grok-2-mini", label: "Grok-2 Mini — Grok" },
    { value: "__custom__", label: "Custom model…" },
  ],
};
