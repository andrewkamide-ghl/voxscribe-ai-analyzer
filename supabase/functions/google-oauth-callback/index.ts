
import { ok, json, requireEnv } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  const u = new URL(req.url);
  const code = u.searchParams.get('code') || '';
  const state = u.searchParams.get('state') || '';
  const appBase = Deno.env.get('APP_BASE_URL') || 'http://localhost:8080';

  const headers = new Headers();
  let reason = '';

  try {
    if (!code || !state) {
      reason = 'missing_params';
      headers.set('Location', `${appBase}/settings?tab=storage&google=error&reason=${reason}`);
      return new Response(null, { status: 302, headers });
    }

    const supabase = svc();

    // Lookup state → user & verifier
    const { data: stRows, error: stErr } = await supabase
      .from('oauth_states').select('user_id, code_verifier').eq('state', state).limit(1);
    if (stErr || !stRows?.length) {
      reason = 'invalid_state';
      headers.set('Location', `${appBase}/settings?tab=storage&google=error&reason=${reason}`);
      return new Response(null, { status: 302, headers });
    }
    const { user_id, code_verifier } = stRows[0];

    // Exchange code for tokens
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: requireEnv('GOOGLE_CLIENT_ID'),
        client_secret: requireEnv('GOOGLE_CLIENT_SECRET'),
        redirect_uri: requireEnv('GOOGLE_REDIRECT_URI'),
        grant_type: 'authorization_code',
        code_verifier
      })
    });
    const tokens: any = await tokenRes.json();
    if (!tokenRes.ok) {
      reason = `token_exchange_failed`;
      console.error('google-oauth-callback token error', tokens);
      headers.set('Location', `${appBase}/settings?tab=storage&google=error&reason=${reason}`);
      return new Response(null, { status: 302, headers });
    }

    // Optional: fetch account identity
    let account_id = '';
    try {
      const about = await fetch('https://www.googleapis.com/drive/v3/about?fields=user(permissionId,emailAddress,displayName)', {
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      }).then(r => r.json());
      account_id = about?.user?.permissionId || '';
    } catch (e) {
      console.warn('google-oauth-callback about warning', e);
    }

    const expiry_ts = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;

    // Upsert connection (user-scoped)
    const { error: upErr } = await supabase.from('connections').upsert({
      user_id,
      provider: 'google',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expiry_ts,
      scope: tokens.scope || 'https://www.googleapis.com/auth/drive.file',
      account_id
    }, { onConflict: 'user_id,provider' });

    // Clean used state
    await supabase.from('oauth_states').delete().eq('state', state);

    if (upErr) {
      reason = 'store_failed';
      console.error('google-oauth-callback upsert error', upErr);
      headers.set('Location', `${appBase}/settings?tab=storage&google=error&reason=${reason}`);
    } else {
      headers.set('Location', `${appBase}/settings?tab=storage&google=connected`);
    }
    return new Response(null, { status: 302, headers });
  } catch (e: any) {
    reason = (typeof e?.message === 'string' && e.message.startsWith('Missing env:')) ? 'env_missing' : 'exception';
    console.error('google-oauth-callback exception', e);
    headers.set('Location', `${appBase}/settings?tab=storage&google=error&reason=${reason}`);
    return new Response(null, { status: 302, headers });
  }
});
