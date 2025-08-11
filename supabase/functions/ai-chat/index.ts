import { json, ok, readJson, requireEnv } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  try {
    type Body = {
      prompt?: string;
      model?: string;
      temperature?: number;
      max_tokens?: number;
    };
    const body = await readJson<Body>(req);
    const prompt = (body?.prompt || '').toString();
    if (!prompt) return json({ error: 'prompt is required' }, 400);

    // Basic abuse guards
    const MAX_CHARS = 6000;
    const MAX_TOKENS = 1000;
    if (prompt.length > MAX_CHARS) {
      return json({ error: `prompt too long (max ${MAX_CHARS} chars)` }, 400);
    }

    const model = body?.model || 'gpt-4o-mini';
    const temperature = typeof body?.temperature === 'number' ? Math.max(0, Math.min(1, body.temperature)) : 0.2;
    const max_tokens = typeof body?.max_tokens === 'number' ? Math.max(1, Math.min(MAX_TOKENS, body.max_tokens)) : 800;

    const r = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${requireEnv('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: 'Be precise and concise.' },
          { role: 'user', content: prompt }
        ],
        temperature,
        max_tokens
      })
    });

    if (!r.ok) {
      return json({ error: 'Upstream AI request failed' }, 502);
    }

    const data = await r.json();
    const generatedText = data?.choices?.[0]?.message?.content ?? '';

    // Return in a shape compatible with existing callers
    return json({
      choices: [
        { message: { content: generatedText } }
      ]
    }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? 'Unknown error' }, 500);
  }
});
