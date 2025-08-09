import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import AIModelSelector from "@/components/AIModelSelector";
import { clearOpenAIKey, getOpenAIKey, setOpenAIKey } from "@/store/ai";
const Settings = () => {
  const {
    toast
  } = useToast();
  const [openaiKey, setKey] = useState<string>(() => getOpenAIKey() || "");
  const connected = Boolean(getOpenAIKey());
  const saveOpenAI = () => {
    if (!openaiKey) return;
    setOpenAIKey(openaiKey);
    toast({
      title: "ChatGPT connected",
      description: "OpenAI key saved to this browser."
    });
  };
  const disconnect = () => {
    clearOpenAIKey();
    setKey("");
    toast({
      title: "Disconnected",
      description: "ChatGPT connection removed from this browser."
    });
  };
  return <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Settings — AI & Providers</title>
        <meta name="description" content="Manage AI providers like ChatGPT and Perplexity, and choose default models." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://localhost:8080/settings"} />
      </Helmet>

      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Connect ChatGPT and choose your default AI models.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">Connect ChatGPT (OpenAI)</h2>
          <p className="text-sm text-muted-foreground">Use OAuth or an API key. For now, add an API key to connect.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="openai" className="text-sm font-medium">OpenAI API Key</label>
              <Input id="openai" value={openaiKey} onChange={e => setKey(e.target.value)} placeholder="sk-..." />
            </div>
            <div className="flex items-end gap-2">
              <Button type="button" className="w-full" onClick={saveOpenAI}>Save</Button>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">Tip: For production, store secrets in Supabase and call providers from an Edge Function.</p>
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">Default AI Model</h2>
          <p className="text-sm text-muted-foreground">Set global defaults for provider and model. You can override per feature.</p>
          <AIModelSelector />
        </Card>
      </div>
    </div>;
};
export default Settings;