import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/lib/supabase';

type Page = { url: string; title: string; summary: string; key_points: string[]; actions: string[] };

export default function CrawlPanel() {
  const { toast } = useToast();
  const [domain, setDomain] = useState('');
  const [goal, setGoal] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [pages, setPages] = useState<Page[]>([]);
  const [loading, setLoading] = useState(false);

  async function run() {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke<{ pages: Page[] }>('v1-crawl', {
      headers: { 'X-Api-Key': apiKey },
      body: { domain, goal, max_items: 10 }
    });
    if (error) {
      toast({ title: 'Failed', description: error.message });
    } else {
      setPages(data?.pages ?? []);
    }
    setLoading(false);
  }

  return (
    <Card className="p-0 border-0">
      <div className="space-y-3">
        <h2 className="text-lg font-semibold">Crawl tester</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <Input placeholder="example.com" value={domain} onChange={e => setDomain(e.target.value)} />
          <Input placeholder="Goal (e.g., find pricing & contact)" value={goal} onChange={e => setGoal(e.target.value)} />
          <Input placeholder="Paste API key" value={apiKey} onChange={e => setApiKey(e.target.value)} className="font-mono" />
        </div>
        <Button type="button" onClick={run} disabled={loading || !domain || !goal || !apiKey}>
          {loading ? 'Working…' : 'Run crawl'}
        </Button>

        <div className="space-y-3">
          {pages.map((p, i) => (
            <div key={i} className="border rounded-md p-3">
              <a href={p.url} target="_blank" rel="noreferrer" className="font-semibold underline">{p.title || p.url}</a>
              {p.summary && <p className="text-sm mt-1">{p.summary}</p>}
              {p.key_points?.length ? (
                <ul className="list-disc pl-5 text-sm mt-1">
                  {p.key_points.map((k, j) => <li key={j}>{k}</li>)}
                </ul>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
