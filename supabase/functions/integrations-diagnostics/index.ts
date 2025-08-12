import { ok, json, parseUserIdFromAuth } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  const userId = parseUserIdFromAuth(req);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const requiredSecrets = [
      'APP_BASE_URL',
      'GOOGLE_CLIENT_ID',
      'GOOGLE_CLIENT_SECRET',
      'GOOGLE_REDIRECT_URI',
      'DROPBOX_APP_KEY',
      'DROPBOX_REDIRECT_URI',
      'SUPABASE_URL',
    ];

    const missingSecrets: string[] = [];
    const present: Record<string, boolean> = {};
    for (const k of requiredSecrets) {
      const has = Boolean(Deno.env.get(k));
      present[k] = has;
      if (!has) missingSecrets.push(k);
    }

    const projectId = 'aocsadbccaximkoevssw';
    const expectedGoogleRedirect = `https://${projectId}.functions.supabase.co/google-oauth-callback`;
    const expectedDropboxRedirect = `https://${projectId}.functions.supabase.co/dropbox-oauth-callback`;

    // Check tables exist
    const supabase = svc();
    const tables: Record<string, boolean> = { oauth_states: false, connections: false };
    try {
      const { error } = await supabase.from('oauth_states').select('*', { head: true, count: 'exact' });
      tables.oauth_states = !error;
    } catch (_) {
      tables.oauth_states = false;
    }
    try {
      const { error } = await supabase.from('connections').select('*', { head: true, count: 'exact' });
      tables.connections = !error;
    } catch (_) {
      tables.connections = false;
    }

    return json({
      ok: true,
      missingSecrets,
      present,
      expectedRedirects: {
        google: expectedGoogleRedirect,
        dropbox: expectedDropboxRedirect,
      },
      tables,
    });
  } catch (e: any) {
    return json({ ok: false, error: e?.message ?? 'diagnostics_failed' }, 500);
  }
});
