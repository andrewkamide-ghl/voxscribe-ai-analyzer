import { json, ok, readJson, sha256Hex, normalizeDomain, requireEnv, extractTextFromResponses } from '../_shared/utils.ts';
import { svc } from '../_shared/db.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  try {
    const key = req.headers.get('x-api-key') ?? '';
    if (!key) return json({ error: 'Missing X-Api-Key' }, 401);

    const prefix = key.slice(0, 10);
    const hashed = await sha256Hex(key);

    const supabase = svc();
    const { data: rows, error } = await supabase
      .from('api_keys')
      .select('id')
      .eq('prefix', prefix)
      .eq('hashed_key', hashed)
      .limit(1);

    if (error) return json({ error: 'Key lookup failed' }, 500);
    if (!rows?.length) return json({ error: 'Invalid API key' }, 403);

    type Body = { domain: string; goal: string; max_items?: number };
    const body = await readJson<Body>(req);
    if (!body?.domain || !body?.goal) return json({ error: 'domain and goal required' }, 400);

    const domain = normalizeDomain(body.domain);
    const max = Math.max(1, Math.min(body.max_items ?? 12, 25));

    const prompt = [
      `You are a disciplined crawler and summarizer.`,
      `Stay STRICTLY within ${domain}. Do not include other domains.`,
      `Find up to ${max} high-value pages, extract clean text, and return STRICT JSON:`,
      `{ "pages": [{ "url": string, "title": string, "summary": string, "key_points": string[], "actions": string[] }] }`,
      `Goal: ${body.goal}`
    ].join('\n\n');

    const r = await fetch('https://api.openai.com/v1/responses', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${requireEnv('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        input: prompt,
        tools: [{ type: 'web_search' }],
        response_format: { type: 'json_object' }
      })
    });

    if (!r.ok) {
      const err = await r.text();
      return json({ error: 'OpenAI error', detail: err }, 502);
    }

    const data = await r.json();
    const text = extractTextFromResponses(data) || '{}';

    let parsed: any;
    try { parsed = JSON.parse(text); } catch { parsed = { pages: [] }; }

    // Hard filter to domain
    const pages = Array.isArray(parsed?.pages) ? parsed.pages.filter((p: any) => {
      try { return new URL(p?.url).hostname.endsWith(domain); } catch { return false; }
    }) : [];

    return json({ pages }, 200);
  } catch (e: any) {
    return json({ error: e?.message ?? 'Unknown error' }, 500);
  }
});
