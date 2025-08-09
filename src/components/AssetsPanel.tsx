import { useEffect, useMemo, useState } from 'react';
import { researchStore, type ResearchItem } from '@/store/research';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Link } from 'react-router-dom';

const AssetsPanel = () => {
  const { toast } = useToast();
  const [items, setItems] = useState<ResearchItem[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    setItems(researchStore.getAll());
  }, []);

  const filtered = useMemo(() => {
    const t = q.toLowerCase();
    return items.filter((it) => it.topic.toLowerCase().includes(t));
  }, [items, q]);

  const copyContent = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({ title: 'Copied', description: 'Content copied to clipboard.' });
    } catch {
      toast({ title: 'Copy failed', description: 'Could not copy content', variant: 'destructive' });
    }
  };

  return (
    <Card className="md:col-span-5 h-full flex flex-col min-h-0 p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <h2 className="text-lg font-semibold">Assets</h2>
        <Button asChild size="sm" variant="secondary"><Link to="/research">Open Research</Link></Button>
      </div>
      <div className="px-6 pb-2">
        <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by topic..." />
      </div>
      <ScrollArea className="flex-1 px-6 pb-6">
        <div className="space-y-3">
          {filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground">No saved research yet. Use the Research page to add items.</p>
          ) : (
            filtered.map((it) => (
              <div key={it.id} className="rounded border p-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{it.topic}</div>
                    <div className="text-xs text-muted-foreground">{new Date(it.createdAt).toLocaleString()}</div>
                  </div>
                  <Badge variant="outline">{it.type}</Badge>
                </div>
                <div className="mt-2 flex gap-2">
                  <Button size="sm" onClick={() => copyContent(it.content)}>Copy</Button>
                  <Button size="sm" variant="ghost" asChild><Link to="/research">View</Link></Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>
    </Card>
  );
};

export default AssetsPanel;
