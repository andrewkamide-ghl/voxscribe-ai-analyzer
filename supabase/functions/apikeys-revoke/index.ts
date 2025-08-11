import { json, ok } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  try {
    const installationId = req.headers.get('x-installation-id') ?? '';
    if (!installationId) return json({ error: 'Missing X-Installation-Id' }, 400);

    const supabase = svc();
    const { error } = await supabase.from('api_keys').delete().eq('installation_id', installationId);
    if (error) return json({ error: 'Failed to revoke' }, 500);

    return json({ ok: true }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? 'Unknown error' }, 500);
  }
});
