
import { ok, json, requireEnv, base64url, sha256Base64url, parseUserIdFromAuth } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  const userId = parseUserIdFromAuth(req);
  if (!userId) return json({ error: 'Unauthorized' }, 401);

  try {
    // PKCE
    const v = new Uint8Array(32); crypto.getRandomValues(v);
    const code_verifier = base64url(v);
    const code_challenge = await sha256Base64url(code_verifier);

    // CSRF state bound to user
    const s = new Uint8Array(16); crypto.getRandomValues(s);
    const state = base64url(s);

    // Store in oauth_states
    const supabase = svc();
    const { error } = await supabase.from('oauth_states').insert({
      state, user_id: userId, provider: 'google', code_verifier
    });
    if (error) return json({ error: 'Failed to create state' }, 500);

    const params = new URLSearchParams({
      client_id: requireEnv('GOOGLE_CLIENT_ID'),
      redirect_uri: requireEnv('GOOGLE_REDIRECT_URI'),
      response_type: 'code',
      access_type: 'offline',
      include_granted_scopes: 'true',
      scope: 'https://www.googleapis.com/auth/drive.file',
      code_challenge,
      code_challenge_method: 'S256',
      state,
      prompt: 'consent'
    });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
    return json({ url }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? 'start failed' }, 500);
  }
});
