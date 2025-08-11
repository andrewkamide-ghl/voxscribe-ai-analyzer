# Connect your GPT Action to VoxScribe

1) In the app, generate an API key (Settings → API Access).
2) In ChatGPT → Builder → Actions → Add Action → Import OpenAPI:
   OpenAPI URL: https://<your-project>.functions.supabase.co/openapi
3) Authentication: API Key
   Header name: X-Api-Key
4) Test the `crawl` action with:
{
  "domain": "example.com",
  "goal": "Find pricing & contact pages",
  "max_items": 10
}
