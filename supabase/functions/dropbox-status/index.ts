
import { ok, json, parseUserIdFromAuth } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  const userId = parseUserIdFromAuth(req);
  if (!userId) return json({ dropbox: false }, 200);

  const supabase = svc();
  const { data, error } = await supabase
    .from('connections')
    .select('id').eq('user_id', userId).eq('provider', 'dropbox').limit(1);

  return json({ dropbox: !!data?.length && !error }, 200);
});
