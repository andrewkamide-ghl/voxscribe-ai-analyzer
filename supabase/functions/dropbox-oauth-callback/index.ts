
import { ok, json, requireEnv } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  const u = new URL(req.url);
  const code = u.searchParams.get('code') || '';
  const state = u.searchParams.get('state') || '';
  const appBase = Deno.env.get('APP_BASE_URL') || 'http://localhost:8080';

  const headers = new Headers();

  try {
    if (!code || !state) {
      headers.set('Location', `${appBase}/settings?tab=storage&dropbox=error`);
      return new Response(null, { status: 302, headers });
    }

    const supabase = svc();
    const { data: stRows } = await supabase
      .from('oauth_states').select('user_id, code_verifier').eq('state', state).limit(1);
    if (!stRows?.length) {
      headers.set('Location', `${appBase}/settings?tab=storage&dropbox=error`);
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
      headers.set('Location', `${appBase}/settings?tab=storage&dropbox=error`);
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
    } catch {}

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

    headers.set('Location', upErr ? `${appBase}/settings?tab=storage&dropbox=error`
                                  : `${appBase}/settings?tab=storage&dropbox=connected`);
    return new Response(null, { status: 302, headers });
  } catch {
    headers.set('Location', `${appBase}/settings?tab=storage&dropbox=error`);
    return new Response(null, { status: 302, headers });
  }
});
