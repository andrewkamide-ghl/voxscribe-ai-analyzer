import FirecrawlApp from '@mendable/firecrawl-js';

interface ErrorResponse {
  success: false;
  error: string;
}

interface CrawlStatusResponse {
  success: true;
  status?: string;
  completed?: number;
  total?: number;
  creditsUsed?: number;
  expiresAt?: string;
  data?: any[];
}

type CrawlResponse = CrawlStatusResponse | ErrorResponse;

export class FirecrawlService {
  private static API_KEY_STORAGE_KEY = 'firecrawl_api_key';
  private static firecrawlApp: FirecrawlApp | null = null;

  static saveApiKey(apiKey: string): void {
    localStorage.setItem(this.API_KEY_STORAGE_KEY, apiKey);
    this.firecrawlApp = new FirecrawlApp({ apiKey });
  }

  static getApiKey(): string | null {
    return localStorage.getItem(this.API_KEY_STORAGE_KEY);
  }

  static async testApiKey(apiKey: string): Promise<boolean> {
    try {
      this.firecrawlApp = new FirecrawlApp({ apiKey });
      const testResponse = await this.firecrawlApp.crawlUrl('https://example.com', { limit: 1 });
      // @ts-ignore
      return !!testResponse?.success;
    } catch {
      return false;
    }
  }

  static async crawlWebsite(url: string): Promise<{ success: boolean; error?: string; data?: CrawlResponse }>{
    const apiKey = this.getApiKey();
    if (!apiKey) {
      return { success: false, error: 'API key not found' };
    }

    try {
      if (!this.firecrawlApp) {
        this.firecrawlApp = new FirecrawlApp({ apiKey });
      }
      const crawlResponse = (await this.firecrawlApp.crawlUrl(url, {
        limit: 100,
        scrapeOptions: { formats: ['markdown', 'html'] },
      })) as CrawlResponse;
      if (!crawlResponse || (crawlResponse as ErrorResponse).success === false) {
        return { success: false, error: (crawlResponse as ErrorResponse)?.error || 'Failed to crawl website' };
      }
      return { success: true, data: crawlResponse };
    } catch (error) {
      return { success: false, error: error instanceof Error ? error.message : 'Failed to connect to Firecrawl API' };
    }
  }
}
