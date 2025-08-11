import { json, ok, readJson, sha256Hex } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

function base64url(bytes: Uint8Array) {
  return btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  try {
    type Body = { name?: string };
    const body = await readJson<Body>(req);

    // Soft identity until Supabase Auth is added
    let installationId = req.headers.get('x-installation-id') ?? '';
    if (!installationId) installationId = crypto.randomUUID();

    const rawBytes = new Uint8Array(32);
    crypto.getRandomValues(rawBytes);
    const raw = `vsa_${base64url(rawBytes)}`;
    const prefix = raw.slice(0, 10);
    const hashed = await sha256Hex(raw);

    const supabase = svc();
    const { error } = await supabase.from('api_keys').insert({
      installation_id: installationId,
      name: body?.name ?? 'default',
      prefix,
      hashed_key: hashed
    });

    if (error) return json({ error: 'Failed to store key' }, 500);

    return json({ apiKey: raw, prefix, installation_id: installationId }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? 'Unknown error' }, 500);
  }
});
