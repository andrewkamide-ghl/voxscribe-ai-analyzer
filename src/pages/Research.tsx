
import { Helmet } from 'react-helmet-async';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import AnalyzeUrlForm from '@/components/AnalyzeUrlForm';
import AskWebForm from '@/components/AskWebForm';
import { ScrollArea } from '@/components/ui/scroll-area';
import { researchStore, type ResearchItem } from '@/store/research';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

const Research = () => {
  const [items, setItems] = useState<ResearchItem[]>([]);

useEffect(() => {
    setItems(researchStore.getAll());
    const unsubscribe = researchStore.subscribe((list) => setItems(list));
    return () => unsubscribe();
  }, []);

const remove = (id: string) => {
    researchStore.remove(id);
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Research — Deep web research</title>
        <meta name="description" content="Perform deep research across the web, save it, and use it in debates." />
        <link rel="canonical" href={typeof window !== 'undefined' ? window.location.href : 'https://localhost:8080/research'} />
      </Helmet>

      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Research</h1>
        <p className="text-sm text-muted-foreground">Deep dive across the web. Analyze URLs, ask questions, and save findings.</p>
      </header>

      <Tabs defaultValue="discover" className="w-full">
        <TabsList>
          <TabsTrigger value="discover">Discover</TabsTrigger>
          <TabsTrigger value="saved">Saved</TabsTrigger>
        </TabsList>

        <TabsContent value="discover" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-2">Analyze URLs</h2>
              <p className="text-sm text-muted-foreground mb-3">Use ChatGPT to analyze website content. OpenAI keys are stored locally.</p>
              <AnalyzeUrlForm />
            </Card>
            <Card className="p-4">
              <h2 className="text-lg font-semibold mb-2">Ask the Web</h2>
              <p className="text-sm text-muted-foreground mb-3">Ask questions and get AI-powered answers. OpenAI keys are stored locally.</p>
              <AskWebForm />
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="saved" className="mt-4">
          <ScrollArea className="h-[60vh]">
            <div className="space-y-3">
              {items.length === 0 ? (
                <p className="text-sm text-muted-foreground">No saved research yet.</p>
              ) : (
                items.map((it) => (
                  <div key={it.id} className="rounded border p-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-medium">{it.topic}</div>
                        <div className="text-xs text-muted-foreground">{new Date(it.createdAt).toLocaleString()}</div>
                      </div>
                      <Badge variant="outline">{it.type}</Badge>
                    </div>
                    <pre className="mt-2 text-xs bg-muted p-2 rounded overflow-auto max-h-48 whitespace-pre-wrap">{it.content}</pre>
                    <div className="mt-2">
                      <Button size="sm" variant="destructive" onClick={() => remove(it.id)}>Delete</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Research;
