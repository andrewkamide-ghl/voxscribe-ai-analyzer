import { json, ok } from '../_shared/utils.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return ok();

  const origin = new URL(req.url).origin; // e.g., https://<project>.functions.supabase.co
  const spec = {
    openapi: '3.0.3',
    info: { title: 'VoxScribe Public API', version: '1.0.0' },
    servers: [{ url: origin }],
    components: {
      securitySchemes: {
        ApiKeyAuth: { type: 'apiKey', in: 'header', name: 'X-Api-Key' }
      },
      schemas: {
        CrawlRequest: {
          type: 'object',
          required: ['domain', 'goal'],
          properties: {
            domain: { type: 'string', example: 'example.com' },
            goal: { type: 'string', example: 'Find pricing & contact pages' },
            max_items: { type: 'integer', minimum: 1, maximum: 25, default: 12 }
          }
        },
        CrawlPage: {
          type: 'object',
          properties: {
            url: { type: 'string' },
            title: { type: 'string' },
            summary: { type: 'string' },
            key_points: { type: 'array', items: { type: 'string' } },
            actions: { type: 'array', items: { type: 'string' } }
          }
        },
        CrawlResponse: {
          type: 'object',
          properties: { pages: { type: 'array', items: { $ref: '#/components/schemas/CrawlPage' } } }
        }
      }
    },
    security: [{ ApiKeyAuth: [] }],
    paths: {
      '/v1-crawl': {
        post: {
          summary: 'Crawl a domain and return structured summaries',
          operationId: 'crawl',
          security: [{ ApiKeyAuth: [] }],
          requestBody: {
            required: true,
            content: { 'application/json': { schema: { $ref: '#/components/schemas/CrawlRequest' } } }
          },
          responses: {
            '200': { description: 'OK', content: { 'application/json': { schema: { $ref: '#/components/schemas/CrawlResponse' } } } }
          }
        }
      }
    }
  } as const;

  return json(spec, 200);
});
