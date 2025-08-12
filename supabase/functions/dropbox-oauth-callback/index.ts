
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
      headers.set('Location', `${appBase}/settings?tab=storage&dropbox=error&reason=${reason}`);
      return new Response(null, { status: 302, headers });
    }

    const supabase = svc();
    const { data: stRows } = await supabase
      .from('oauth_states').select('user_id, code_verifier').eq('state', state).limit(1);
    if (!stRows?.length) {
      reason = 'invalid_state';
      headers.set('Location', `${appBase}/settings?tab=storage&dropbox=error&reason=${reason}`);
      return new Response(null, { status: 302, headers });
    }
    const { user_id, code_verifier } = stRows[0];

    const tokenRes = await fetch('https://api.dropboxapi.com/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        grant_type: 'authorization_code',
        redirect_uri: requireEnv('DROPBOX_REDIRECT_URI'),
        client_id: requireEnv('DROPBOX_APP_KEY'),
        code_verifier
      })
    });
    const tokens: any = await tokenRes.json();
    if (!tokenRes.ok) {
      reason = 'token_exchange_failed';
      console.error('dropbox-oauth-callback token error', tokens);
      headers.set('Location', `${appBase}/settings?tab=storage&dropbox=error&reason=${reason}`);
      return new Response(null, { status: 302, headers });
    }

    // Optional: get account info
    let account_id = '';
    try {
      const acc = await fetch('https://api.dropboxapi.com/2/users/get_current_account', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokens.access_token}` }
      }).then(r => r.json());
      account_id = acc?.account_id || '';
    } catch (e) {
      console.warn('dropbox-oauth-callback account warning', e);
    }

    const expiry_ts = tokens.expires_in ? Date.now() + tokens.expires_in * 1000 : null;

    const { error: upErr } = await supabase.from('connections').upsert({
      user_id,
      provider: 'dropbox',
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token || null,
      expiry_ts,
      scope: tokens.scope || 'files.content.read files.content.write files.metadata.read',
      account_id
    }, { onConflict: 'user_id,provider' });

    await supabase.from('oauth_states').delete().eq('state', state);

    if (upErr) {
      reason = 'store_failed';
      console.error('dropbox-oauth-callback upsert error', upErr);
      headers.set('Location', `${appBase}/settings?tab=storage&dropbox=error&reason=${reason}`);
    } else {
      headers.set('Location', `${appBase}/settings?tab=storage&dropbox=connected`);
    }
    return new Response(null, { status: 302, headers });
  } catch (e: any) {
    reason = (typeof e?.message === 'string' && e.message.startsWith('Missing env:')) ? 'env_missing' : 'exception';
    console.error('dropbox-oauth-callback exception', e);
    headers.set('Location', `${appBase}/settings?tab=storage&dropbox=error&reason=${reason}`);
    return new Response(null, { status: 302, headers });
  }
});
