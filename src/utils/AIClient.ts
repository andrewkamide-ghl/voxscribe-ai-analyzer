import type { AIConfig } from "@/store/ai";

export async function askPerplexity(message: string, apiKey: string, model: string, context?: string) {
  const response = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Be precise and concise." },
        { role: "user", content: context ? `${context}\n\nQuestion: ${message}` : message },
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 1000,
      return_images: false,
      return_related_questions: false,
      frequency_penalty: 1,
      presence_penalty: 0,
    }),
  });
  if (!response.ok) throw new Error("Perplexity request failed");
  return response.json();
}

export async function askOpenAI(message: string, apiKey: string, model: string, context?: string) {
  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: "Be precise and concise." },
        { role: "user", content: context ? `${context}\n\nQuestion: ${message}` : message },
      ],
      temperature: 0.2,
      max_tokens: 1000,
    }),
  });
  if (!response.ok) throw new Error("OpenAI request failed");
  return response.json();
}

export async function askWithConfig(config: AIConfig, message: string, context?: string) {
  if (config.provider === "perplexity") {
    const key = localStorage.getItem("perplexity_api_key");
    if (!key) throw new Error("Perplexity API key missing");
    return askPerplexity(message, key, config.model, context);
  }
  const openaiKey = localStorage.getItem("openai_api_key");
  if (!openaiKey) throw new Error("OpenAI API key missing");
  return askOpenAI(message, openaiKey, config.model, context);
}
