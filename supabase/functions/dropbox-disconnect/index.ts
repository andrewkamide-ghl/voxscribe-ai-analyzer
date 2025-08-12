
import { ok, json, parseUserIdFromAuth } from '../._shared/utils.ts';
import { svc } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  const userId = parseUserIdFromAuth(req);
  if (!userId) return json({ ok: false }, 401);

  const supabase = svc();
  const { error } = await supabase
    .from('connections')
    .delete()
    .eq('user_id', userId)
    .eq('provider', 'dropbox');

  return json({ ok: !error }, error ? 500 : 200);
});
