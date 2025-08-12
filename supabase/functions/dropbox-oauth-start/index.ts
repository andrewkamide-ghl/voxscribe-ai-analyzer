
import { ok, json, requireEnv, base64url, sha256Base64url, parseUserIdFromAuth } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  const userId = parseUserIdFromAuth(req);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    const v = new Uint8Array(32); crypto.getRandomValues(v);
    const code_verifier = base64url(v);
    const code_challenge = await sha256Base64url(code_verifier);

    const s = new Uint8Array(16); crypto.getRandomValues(s);
    const state = base64url(s);

    const supabase = svc();
    const { error } = await supabase.from('oauth_states').insert({
      state, user_id: userId, provider: 'dropbox', code_verifier
    });
    if (error) return json({ error: 'Failed to create state' }, 500);

    const params = new URLSearchParams({
      client_id: requireEnv('DROPBOX_APP_KEY'),
      redirect_uri: requireEnv('DROPBOX_REDIRECT_URI'),
      response_type: 'code',
      token_access_type: 'offline',
      code_challenge,
      code_challenge_method: 'S256',
      state,
      scope: 'files.content.read files.content.write files.metadata.read'
    });

    const url = `https://www.dropbox.com/oauth2/authorize?${params.toString()}`;
    return json({ url }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? 'start failed' }, 500);
  }
});
