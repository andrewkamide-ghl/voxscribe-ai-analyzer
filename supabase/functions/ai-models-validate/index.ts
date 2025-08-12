import { json, ok, readJson, requireEnv, extractTextFromResponses } from '../_shared/utils.ts';

function usesResponsesAPI(model: string) {
  const m = model.toLowerCase();
  return m.startsWith('o3') || m.startsWith('o4') || m.startsWith('gpt-4.1');
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  try {
    const { model } = await readJson<{ model?: string }>(req);
    if (!model || typeof model !== 'string' || !model.trim()) {
      return json({ ok: false, code: 'bad_request', message: 'Missing or invalid "model"' });
    }

    const openaiKey = requireEnv('OPENAI_API_KEY');
    const useResponses = usesResponsesAPI(model);
    const url = useResponses
      ? 'https://api.openai.com/v1/responses'
      : 'https://api.openai.com/v1/chat/completions';

    const payload = useResponses
      ? {
          model,
          input: [{ role: 'user', content: 'ping' }],
          max_output_tokens: 1,
          temperature: 0,
        }
      : {
          model,
          messages: [{ role: 'user', content: 'ping' }],
          max_tokens: 1,
          temperature: 0,
        };

    const r = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!r.ok) {
      let err: any = null;
      try { err = await r.json(); } catch { err = { error: { message: await r.text() } }; }
      const code = err?.error?.code || err?.error?.type || 'openai_error';
      const message = err?.error?.message || 'OpenAI request failed';
      // Always 200 so the client can read a structured body via supabase.functions.invoke
      return json({ ok: false, code, message, status: r.status });
    }

    const data = await r.json();
    const snippet = extractTextFromResponses(data) || '';

    return json({ ok: true, snippet });
  } catch (e: any) {
    return json({ ok: false, code: 'internal_error', message: e?.message || 'Unexpected error' }, 500);
  }
});
