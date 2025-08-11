
import { json, ok, readJson, requireEnv } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';
import { createClient } from 'npm:@supabase/supabase-js';

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function bytesToStr(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return bin;
}

async function importAesKey() {
  const keyB64 = requireEnv('BYOK_ENCRYPTION_KEY');
  const keyBytes = b64ToBytes(keyB64);
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['decrypt']);
}

async function getUserId(req: Request) {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');
  const authHeader = req.headers.get('Authorization') || '';
  if (!authHeader) return null;
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data } = await userClient.auth.getUser();
  return data?.user?.id ?? null;
}

async function getUserOpenAIKey(userId: string | null): Promise<string | null> {
  if (!userId) return null;
  const db = svc();
  const { data, error } = await db
    .from('user_ai_credentials')
    .select('encrypted_key, iv')
    .eq('user_id', userId)
    .eq('provider', 'openai')
    .maybeSingle();

  if (error || !data) return null;

  try {
    const key = await importAesKey();
    const iv = b64ToBytes(data.iv);
    const cipherBytes = b64ToBytes(data.encrypted_key);
    const plainBuf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, cipherBytes);
    const plain = bytesToStr(new Uint8Array(plainBuf));
    return plain;
  } catch {
    return null;
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  try {
    type Body = {
      prompt?: string;
      model?: string;
      temperature?: number;
      max_tokens?: number;
    };
    const body = await readJson<Body>(req);
    const prompt = (body?.prompt || '').toString();
    if (!prompt) return json({ error: 'prompt is required' }, 400);

    // Basic abuse guards
    const MAX_CHARS = 6000;
    const MAX_TOKENS = 1000;
    if (prompt.length > MAX_CHARS) {
      return json({ error: `prompt too long (max ${MAX_CHARS} chars)` }, 400);
    }

    const model = body?.model || 'gpt-4o-mini';
    const temperature = typeof body?.temperature === 'number' ? Math.max(0, Math.min(1, body.temperature)) : 0.2;
    const max_tokens = typeof body?.max_tokens === 'number' ? Math.max(1, Math.min(MAX_TOKENS, body.max_tokens)) : 800;

    // Prefer user's key if available; fallback to server's key
    const userId = await getUserId(req);
    const userKey = await getUserOpenAIKey(userId);
    const openaiKey = userKey || requireEnv('OPENAI_API_KEY');

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Be precise and concise.' },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens
      })
    });

    if (!r.ok) {
      return json({ error: 'Upstream AI request failed' }, 502);
    }

    const data = await r.json();
    const generatedText = data?.choices?.[0]?.message?.content ?? '';

    return json({
      choices: [
        { message: { content: generatedText } }
      ]
    }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? 'Unknown error' }, 500);
  }
});
