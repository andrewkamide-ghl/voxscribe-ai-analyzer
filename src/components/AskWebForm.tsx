import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { researchStore } from '@/store/research';

async function askPerplexity(message: string, apiKey: string, context?: string) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-small-128k-online',
      messages: [
        { role: 'system', content: 'Be precise and concise.' },
        { role: 'user', content: context ? `${context}\n\nQuestion: ${message}` : message },
      ],
      temperature: 0.2,
      top_p: 0.9,
      max_tokens: 1000,
      return_images: false,
      return_related_questions: false,
      frequency_penalty: 1,
      presence_penalty: 0,
    }),
  });
  if (!response.ok) throw new Error('Perplexity request failed');
  return response.json();
}

export const AskWebForm = () => {
  const { toast } = useToast();
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem('perplexity_api_key') || '');
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const saveKey = () => {
    if (!apiKey) return;
    localStorage.setItem('perplexity_api_key', apiKey);
    toast({ title: 'Perplexity set', description: 'API key saved to this browser.' });
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);
    try {
      const key = localStorage.getItem('perplexity_api_key');
      if (!key) {
        toast({ title: 'API key required', description: 'Enter and save your Perplexity key first.', variant: 'destructive' });
        return;
      }
      const data = await askPerplexity(question, key, context);
      const text = data?.choices?.[0]?.message?.content || 'No answer returned.';
      setAnswer(text);
      toast({ title: 'Answer ready' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to query Perplexity', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const saveToResearch = () => {
    if (!answer) return;
    researchStore.add({
      topic: question,
      type: 'qa',
      content: answer,
      sources: [],
      tags: ['qa'],
    });
    toast({ title: 'Saved to Research', description: 'Answer saved.' });
  };

  return (
    <Card className="p-4 space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="question" className="text-sm font-medium">Ask the Web</label>
          <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is the most effective policy for heat resilience?" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="ctx" className="text-sm font-medium">Context (optional)</label>
          <Textarea id="ctx" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Any notes, constraints, or specific angles." />
        </div>

        {!localStorage.getItem('perplexity_api_key') && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2 space-y-2">
              <label className="text-sm font-medium" htmlFor="pplx-key">Perplexity API Key</label>
              <Input id="pplx-key" value={apiKey} onChange={(e) => setApiKey(e.target.value)} placeholder="pplx_..." />
            </div>
            <div className="flex items-end">
              <Button type="button" onClick={saveKey} className="w-full">Save key</Button>
            </div>
          </div>
        )}

        <div className="flex gap-2">
          <Button type="submit" disabled={loading}>Ask</Button>
          <Button type="button" variant="secondary" onClick={saveToResearch} disabled={!answer}>Save to Research</Button>
        </div>
      </form>

      {answer && (
        <div className="mt-2">
          <h3 className="text-sm font-semibold mb-1">Answer</h3>
          <pre className="text-xs bg-muted p-2 rounded max-h-64 overflow-auto whitespace-pre-wrap">{answer}</pre>
        </div>
      )}
    </Card>
  );
};

export default AskWebForm;
