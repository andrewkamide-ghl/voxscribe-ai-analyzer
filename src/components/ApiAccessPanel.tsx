import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

function getInstallationId() {
  let id = localStorage.getItem('installation_id');
  if (!id) { id = crypto.randomUUID(); localStorage.setItem('installation_id', id); }
  return id;
}

export default function ApiAccessPanel({ embed = false }: { embed?: boolean }) {
  const { toast } = useToast();
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [installationId, setInstallationId] = useState<string>('');

  useEffect(() => setInstallationId(getInstallationId()), []);
  

  async function generate() {
    const { data, error } = await supabase.functions.invoke<{ apiKey: string; prefix: string; installation_id: string }>('apikeys-generate', {
      body: { name: 'default' },
      headers: { 'X-Installation-Id': getInstallationId() }
    });

    if (!error && data?.apiKey) {
      setApiKey(data.apiKey);
      localStorage.setItem('installation_id', data.installation_id);
      toast({ title: 'API key generated', description: 'Copy now — shown only once.' });
    } else {
      toast({ title: 'Failed', description: error?.message || 'Failed to generate key' });
    }
  }

  async function revoke() {
    const { error } = await supabase.functions.invoke<{ ok: boolean }>('apikeys-revoke', {
      headers: { 'X-Installation-Id': getInstallationId() }
    });
    if (error) toast({ title: 'Failed', description: error.message });
    else {
      setApiKey(null);
      toast({ title: 'Revoked', description: 'All keys for this installation were revoked.' });
    }
  }

  const Content = (
    <div className="space-y-3">
      <h3 className="text-base font-semibold">API Actions (for ChatGPT)</h3>
      <p className="text-sm text-muted-foreground">
        Generate an API key to call <code>/v1-crawl</code> from your own GPT Action.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="button" onClick={generate}>Generate API Key</Button>
        <Button type="button" variant="outline" onClick={revoke}>Revoke</Button>
      </div>
      {apiKey && (
        <div className="p-3 border rounded-md bg-muted/30">
          <div className="font-mono text-sm break-all">{apiKey}</div>
          <div className="text-xs text-muted-foreground mt-1">Copy now — shown only once.</div>
        </div>
      )}
      <div className="text-xs text-muted-foreground">Installation ID: <span className="font-mono">{installationId}</span></div>
      <details className="mt-2">
        <summary className="cursor-pointer text-sm">Connect a GPT Action</summary>
        <ol className="list-decimal pl-5 text-sm mt-2 space-y-1">
          <li>ChatGPT → Builder → <b>Actions</b> → <b>Add Action</b> → <b>Import OpenAPI</b>.</li>
          <li>OpenAPI URL: <code>https://&lt;your-project&gt;.functions.supabase.co/openapi</code></li>
          <li>Auth: <b>API Key</b>, header name <code>X-Api-Key</code>.</li>
        </ol>
      </details>
    </div>
  );

  if (embed) return Content;

  return (
    <Card className="p-4">
      {Content}
    </Card>
  );
}
