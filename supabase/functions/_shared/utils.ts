import { corsHeaders } from './cors.ts';

export function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' }
  });
}

export function ok() {
  return new Response('ok', { headers: corsHeaders });
}

export async function readJson<T>(req: Request): Promise<T> {
  try { return await req.json(); } catch { return {} as T; }
}

export async function sha256Hex(s: string) {
  const b = new TextEncoder().encode(s);
  const h = await crypto.subtle.digest('SHA-256', b);
  return [...new Uint8Array(h)].map(x => x.toString(16).padStart(2, '0')).join('');
}

export function requireEnv(name: string) {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export function normalizeDomain(input: string) {
  try {
    const url = new URL(input.includes('://') ? input : `https://${input}`);
    return url.hostname.toLowerCase();
  } catch {
    return input.toLowerCase();
  }
}

export function extractTextFromResponses(data: any): string {
  // Try several shapes of the Responses API result
  if (typeof data?.output_text === 'string') return data.output_text;
  const out0 = data?.output?.[0]?.content?.[0]?.text;
  if (typeof out0 === 'string') return out0;
  const choice = data?.choices?.[0]?.message?.content;
  if (typeof choice === 'string') return choice;
  return '';
}
