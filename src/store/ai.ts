import { useEffect, useState } from "react";

export type AIProvider = "openai" | "anthropic" | "google" | "xai";

export interface AIConfig {
  provider: AIProvider;
  model: string;
}

const STORAGE_KEYS = {
  provider: "ai_provider",
  model: "ai_model",
  openaiKey: "openai_api_key",
};

export const DEFAULTS: Record<AIProvider, string> = {
  openai: "gpt-4o-mini",
  anthropic: "claude-3.5-haiku",
  google: "gemini-1.5-flash",
  xai: "grok-2-mini",
};

export function getAIConfig(): AIConfig {
  const storedProvider = localStorage.getItem(STORAGE_KEYS.provider) as AIProvider | null;
  const provider: AIProvider = storedProvider ?? "openai";
  const storedModel = localStorage.getItem(STORAGE_KEYS.model);
  const model = storedModel || DEFAULTS[provider];
  return { provider, model };
}

export function setAIConfig(config: AIConfig) {
  localStorage.setItem(STORAGE_KEYS.provider, config.provider);
  localStorage.setItem(STORAGE_KEYS.model, config.model);
}

export function getOpenAIKey(): string | null {
  return localStorage.getItem(STORAGE_KEYS.openaiKey);
}

export function setOpenAIKey(key: string) {
  localStorage.setItem(STORAGE_KEYS.openaiKey, key);
}

export function clearOpenAIKey() {
  localStorage.removeItem(STORAGE_KEYS.openaiKey);
}

export function useAIConfig() {
  const [config, setConfigState] = useState<AIConfig>(() => {
    try {
      return getAIConfig();
    } catch {
      return { provider: "openai", model: DEFAULTS.openai };
    }
  });

  useEffect(() => {
    try {
      setAIConfig(config);
    } catch {
      // noop
    }
  }, [config.provider, config.model]);

  // keep in sync when changed in other tabs/windows
  useEffect(() => {
    function onStorage(e: StorageEvent) {
      if (!e.key || ![STORAGE_KEYS.provider, STORAGE_KEYS.model].includes(e.key)) return;
      setConfigState(getAIConfig());
    }
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  const setConfig = (patch: Partial<AIConfig>) =>
    setConfigState((prev) => {
      const next = { ...prev, ...patch } as AIConfig;
      return next;
    });

  return { config, setConfig } as const;
}
