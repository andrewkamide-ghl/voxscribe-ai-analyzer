
import { json, ok, readJson, requireEnv } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';
import { createClient } from 'npm:@supabase/supabase-js';

type Body = {
  provider?: 'openai';
  apiKey?: string;
};

async function getUserId(req: Request) {
  const supabaseUrl = requireEnv('SUPABASE_URL');
  const anonKey = requireEnv('SUPABASE_ANON_KEY');
  const authHeader = req.headers.get('Authorization') || '';
  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data, error } = await userClient.auth.getUser();
  if (error || !data?.user?.id) throw new Error('Unauthorized');
  return data.user.id;
}

function b64ToBytes(b64: string) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes;
}
function bytesToB64(bytes: Uint8Array) {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

function validateAesKeyB64(keyB64: string): Uint8Array {
  let keyBytes: Uint8Array;
  try {
    keyBytes = b64ToBytes(keyB64);
  } catch {
    throw new Error('Invalid BYOK_ENCRYPTION_KEY: not valid base64');
  }
  const len = keyBytes.byteLength;
  if (![16, 24, 32].includes(len)) {
    throw new Error(
      'Invalid BYOK_ENCRYPTION_KEY: must be base64 for 128/192/256-bit key (16/24/32 bytes)'
    );
  }
  return keyBytes;
}

async function importAesKey() {
  const keyB64 = requireEnv('BYOK_ENCRYPTION_KEY');
  const keyBytes = validateAesKeyB64(keyB64);
  return crypto.subtle.importKey('raw', keyBytes, 'AES-GCM', false, ['encrypt', 'decrypt']);
}

async function encryptText(plain: string) {
  const enc = new TextEncoder().encode(plain);
  const key = await importAesKey();
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const cipherBuf = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc);
  return {
    cipherB64: bytesToB64(new Uint8Array(cipherBuf)),
    ivB64: bytesToB64(iv),
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  try {
    const userId = await getUserId(req);
    const body = await readJson<Body>(req);
    const provider = body?.provider || 'openai';
    const apiKey = (body?.apiKey || '').trim();

    if (provider !== 'openai') return json({ error: 'Unsupported provider' }, 400);
    if (!apiKey) return json({ error: 'apiKey is required' }, 400);
    if (!/^sk-/.test(apiKey)) return json({ error: 'Invalid OpenAI key format' }, 400);

    const last_four = apiKey.slice(-4);
    const { cipherB64, ivB64 } = await encryptText(apiKey);

    const db = svc();
    const { error } = await db
      .from('user_ai_credentials')
      .upsert(
        {
          user_id: userId,
          provider,
          encrypted_key: cipherB64,
          iv: ivB64,
          last_four,
        },
        { onConflict: 'user_id,provider' }
      );

    if (error) return json({ error: error.message }, 500);

    return json({ ok: true, provider, last_four }, 200);
  } catch (e: any) {
    const msg = e?.message || 'Unexpected error';
    if (msg === 'Unauthorized') return json({ error: 'Unauthorized' }, 401);
    return json({ error: msg }, 500);
  }
});
