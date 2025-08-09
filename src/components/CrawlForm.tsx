import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { FirecrawlService } from '@/utils/FirecrawlService';
import { researchStore } from '@/store/research';
import AIModelSelector from '@/components/AIModelSelector';

export const CrawlForm = () => {
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [apiKey, setApiKey] = useState<string>(() => FirecrawlService.getApiKey() || '');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<any | null>(null);

  const handleSaveKey = async () => {
    if (!apiKey) return;
    const ok = await FirecrawlService.testApiKey(apiKey);
    if (!ok) {
      toast({ title: 'Invalid API key', description: 'Could not verify Firecrawl key.', variant: 'destructive' });
      return;
    }
    FirecrawlService.saveApiKey(apiKey);
    toast({ title: 'Firecrawl set', description: 'API key saved to this browser.' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(10);
    setResult(null);
    try {
      const key = FirecrawlService.getApiKey();
      if (!key) {
        toast({ title: 'API key required', description: 'Enter and save your Firecrawl API key first.', variant: 'destructive' });
        return;
      }
      setProgress(30);
      const res = await FirecrawlService.crawlWebsite(url);
      if (res.success) {
        toast({ title: 'Crawl complete', description: 'Website crawled successfully.' });
        setResult(res.data);
        setProgress(100);
      } else {
        toast({ title: 'Crawl failed', description: res.error || 'Unknown error', variant: 'destructive' });
        setProgress(0);
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to crawl website', variant: 'destructive' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResearch = () => {
    if (!result) return;
    const content = JSON.stringify(result, null, 2);
    researchStore.add({
      topic: topic || url,
      type: 'crawl',
      content,
      sources: [],
      tags: ['crawl'],
    });
    toast({ title: 'Saved to Research', description: 'Crawl results saved.' });
  };

return (
    <Card className="p-4 space-y-4">
      <div>
        <AIModelSelector compact />
      </div>
      <form onSubmit={handleSubmit} className="space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <div className="md:col-span-2 space-y-2">
            <label htmlFor="url" className="text-sm font-medium">Website URL</label>
            <Input id="url" type="url" required value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://example.com" />
          </div>
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium">Topic (optional)</label>
            <Input id="topic" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="e.g. Heat resilience policy" />
          </div>
        </div>

        {!FirecrawlService.getApiKey() && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium" htmlFor="firecrawl-key">Firecrawl API Key</label>
              <Input id="firecrawl-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="fc_live_..." />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={handleSaveKey} className="w-full">Save key</Button>
            </div>
          </div>
        )}

        {isLoading && <Progress value={progress} className="w-full" />}
        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>Start Crawl</Button>
          <Button type="button" variant="secondary" onClick={handleSaveResearch} disabled={!result}>Save to Research</Button>
        </div>
      </form>

      {result && (
        <div className="mt-2">
          <h3 className="text-sm font-semibold mb-1">Crawl Result</h3>
          <pre className="text-xs bg-muted p-2 rounded max-h-64 overflow-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </Card>
  );
};

export default CrawlForm;
