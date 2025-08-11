
import { json, ok, requireEnv } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';
import { createClient } from 'npm:@supabase/supabase-js';

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  try {
    const userId = await getUserId(req);
    const db = svc();
    const { data, error } = await db
      .from('user_ai_credentials')
      .select('provider,last_four,created_at,updated_at')
      .eq('user_id', userId)
      .eq('provider', 'openai')
      .maybeSingle();

    if (error) return json({ error: error.message }, 500);
    return json({ credential: data ?? null }, 200);
  } catch (e: any) {
    const msg = e?.message || 'Unexpected error';
    if (msg === 'Unauthorized') return json({ error: 'Unauthorized' }, 401);
    return json({ error: msg }, 500);
  }
});
