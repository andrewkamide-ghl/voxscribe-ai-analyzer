
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { researchStore } from '@/store/research';
import AIModelSelector from '@/components/AIModelSelector';
import { useAIConfig } from '@/store/ai';
import { askWithConfig } from '@/utils/AIClient';

export const AnalyzeUrlForm = () => {
  const { toast } = useToast();
  const { config } = useAIConfig();
  const [url, setUrl] = useState('');
  const [topic, setTopic] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setProgress(10);
    setResult(null);
    
    try {
      // 1) Fetch readable content client-side (no backend) via r.jina.ai
      setProgress(25);
      const normalized = url.trim();
      const clean = normalized.replace(/^https?:\/\//, '');
      const proxied = `https://r.jina.ai/http://${clean}`;
      const resp = await fetch(proxied, { method: 'GET' });

      if (!resp.ok) {
        const msg = await resp.text().catch(() => '');
        throw new Error(`Fetch failed (${resp.status}). Try a different URL.`);
      }

      const text = (await resp.text()).trim();

      if (!text) {
        throw new Error('No readable content extracted from the URL.');
      }

      // 2) Ask the model with the extracted text as context
      setProgress(60);
      const message = [
        `Analyze the following webpage content from: ${url}`,
        topic ? `Focus on: ${topic}` : null,
        '',
        'Please provide:',
        '1. A concise summary',
        '2. Key points and insights',
        '3. Any relevant data or statistics mentioned',
        '4. The overall purpose and value of the page',
        '5. Cite the source URL in your answer',
      ]
        .filter(Boolean)
        .join('\n');

      const response = await askWithConfig(config, message, text.slice(0, 120000));
      const analysis = response?.choices?.[0]?.message?.content || 'No analysis returned.';
      
      setResult(analysis);
      setProgress(100);
      toast({ title: 'Analysis complete', description: 'URL analysis finished successfully.' });
      
    } catch (error) {
      toast({ 
        title: 'Analysis failed', 
        description: error instanceof Error ? error.message : 'Failed to analyze URL', 
        variant: 'destructive' 
      });
      setProgress(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveResearch = () => {
    if (!result) return;
    researchStore.add({
      topic: topic || url,
      type: 'crawl',
      content: result,
      sources: [url],
      tags: ['url-analysis'],
    });
    toast({ title: 'Saved to Research', description: 'URL analysis saved.' });
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
            <Input 
              id="url" 
              type="url" 
              required 
              value={url} 
              onChange={(e) => setUrl(e.target.value)} 
              placeholder="https://example.com" 
            />
          </div>
          <div className="space-y-2">
            <label htmlFor="topic" className="text-sm font-medium">Focus Topic (optional)</label>
            <Input 
              id="topic" 
              value={topic} 
              onChange={(e) => setTopic(e.target.value)} 
              placeholder="e.g. Heat resilience policy" 
            />
          </div>
        </div>

        {isLoading && <Progress value={progress} className="w-full" />}
        
        <div className="flex gap-2">
          <Button type="submit" disabled={isLoading}>
            {isLoading ? 'Analyzing...' : 'Analyze URL'}
          </Button>
          <Button 
            type="button" 
            variant="secondary" 
            onClick={handleSaveResearch} 
            disabled={!result}
          >
            Save to Research
          </Button>
        </div>
      </form>

      {result && (
        <div className="mt-2">
          <h3 className="text-sm font-semibold mb-1">Analysis Result</h3>
          <div className="text-xs bg-muted p-2 rounded max-h-64 overflow-auto whitespace-pre-wrap">
            {result}
          </div>
        </div>
      )}
    </Card>
  );
};

export default AnalyzeUrlForm;
