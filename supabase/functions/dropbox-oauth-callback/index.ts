
import { ok, requireEnv } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

function bridgeHTML(appBase: string, provider: 'google' | 'dropbox', status: 'connected' | 'error', reason = ''): Response {
  const origin = (() => { try { return new URL(appBase).origin; } catch { return appBase; } })();
  const qs = status === 'connected' ? `${provider}=connected` : `${provider}=error&reason=${encodeURIComponent(reason)}`;
  const fallback = `${appBase}/settings?tab=storage&${qs}`;
  const html = `<!doctype html>
<html><head>
  <meta charset="utf-8" />
  <title>${provider} ${status}</title>
  <meta http-equiv="refresh" content="5;url=${fallback}">
  <style>body{font-family:ui-sans-serif,system-ui,-apple-system;display:grid;place-items:center;height:100vh;margin:0;color:#0a0a0a;background:#fff} .card{padding:24px;border:1px solid #e5e7eb;border-radius:12px;box-shadow:0 10px 30px rgba(0,0,0,.07)} .muted{color:#6b7280;font-size:14px}</style>
</head>
<body>
  <div class="card">
    <h1>You're all set</h1>
    <p class="muted">This window will close automatically.</p>
  </div>
  <script>
    (function(){
      var payload = { source: 'oauth-bridge', provider: '${provider}', status: '${status}', reason: ${JSON.stringify(reason)} };
      try {
        var target = ${JSON.stringify(origin)};
        if (window.opener && !window.opener.closed) {
          window.opener.postMessage(payload, target);
        }
      } catch (e) {}
      setTimeout(function(){ try { window.close(); } catch(e) {} location.href = ${JSON.stringify(fallback)}; }, 300);
    })();
  </script>
</body></html>`;
  return new Response(html, { headers: { 'Content-Type': 'text/html' } });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  const u = new URL(req.url);
  const code = u.searchParams.get('code') || '';
  const state = u.searchParams.get('state') || '';
  const appBase = Deno.env.get('APP_BASE_URL') || 'http://localhost:8080';

  let reason = '';

  try {
    if (!code || !state) {
      reason = 'missing_params';
      return bridgeHTML(appBase, 'dropbox', 'error', reason);
    }

    const supabase = svc();
    const { data: stRows } = await supabase
      .from('oauth_states').select('user_id, code_verifier').eq('state', state).limit(1);
    if (!stRows?.length) {
      reason = 'invalid_state';
      return bridgeHTML(appBase, 'dropbox', 'error', reason);
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
      return bridgeHTML(appBase, 'dropbox', 'error', reason);
    }

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
      return bridgeHTML(appBase, 'dropbox', 'error', reason);
    }

    return bridgeHTML(appBase, 'dropbox', 'connected');
  } catch (e: any) {
    reason = (typeof e?.message === 'string' && e.message.startsWith('Missing env:')) ? 'env_missing' : 'exception';
    console.error('dropbox-oauth-callback exception', e);
    return bridgeHTML(appBase, 'dropbox', 'error', reason);
  }
});
