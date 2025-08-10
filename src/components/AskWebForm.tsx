import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { researchStore } from '@/store/research';
import AIModelSelector from '@/components/AIModelSelector';
import { useAIConfig } from '@/store/ai';
import { askWithConfig } from '@/utils/AIClient';

export const AskWebForm = () => {
  const { toast } = useToast();
  const { config } = useAIConfig();
  const [question, setQuestion] = useState('');
  const [context, setContext] = useState('');
  
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);


const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAnswer(null);
    try {
      const data = await askWithConfig(config, question, context);
      const text = data?.choices?.[0]?.message?.content || data?.choices?.[0]?.text || 'No answer returned.';
      setAnswer(text);
      toast({ title: 'Answer ready' });
    } catch (e) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Failed to query provider', variant: 'destructive' });
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
      <div>
        <AIModelSelector compact />
      </div>
      <form onSubmit={onSubmit} className="space-y-3">
        <div className="space-y-2">
          <label htmlFor="question" className="text-sm font-medium">Ask the Web</label>
          <Input id="question" value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="What is the most effective policy for heat resilience?" required />
        </div>
        <div className="space-y-2">
          <label htmlFor="ctx" className="text-sm font-medium">Context (optional)</label>
          <Textarea id="ctx" value={context} onChange={(e) => setContext(e.target.value)} placeholder="Any notes, constraints, or specific angles." />
        </div>


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
