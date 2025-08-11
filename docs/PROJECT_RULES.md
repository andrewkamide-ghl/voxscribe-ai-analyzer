# Project Rules
- Backend: Supabase Edge Functions only (no custom Express server).
- Secrets: keep OPENAI_API_KEY and SUPABASE_SERVICE_ROLE_KEY in Supabase Secrets.
- Public API: /v1-crawl (Edge Function) uses header X-Api-Key (api_keys table).
- Do NOT require Supabase JWT for v1-crawl or openapi (verify_jwt = false).
- Handle CORS + OPTIONS in every function.
- Use OpenAI Responses API with tools: [{ type: "web_search" }] and response_format: json_object.
- Store only prefix + SHA-256 hash of API keys; never store raw keys.
- OAuth (Google Drive/Dropbox) is out-of-scope for this milestone; connections table is prepared for next.
