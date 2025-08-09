import { Helmet } from "react-helmet-async";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import AIModelSelector from "@/components/AIModelSelector";
import { generatePKCE } from "@/utils/oauth";
import { getOpenAIProxyBase, setOpenAIProxyBase, getOpenAIClientId, setOpenAIClientId, isOpenAIConnected, clearOpenAIAuth, setEphemeral, getRedirectUri } from "@/store/openai-oauth";

const Settings = () => {
  const { toast } = useToast();
  const [proxyBase, setProxyBase] = useState<string>(() => getOpenAIProxyBase() || "");
  const [clientId, setClientId] = useState<string>(() => getOpenAIClientId() || "");
  const connected = isOpenAIConnected();

  const saveProxyConfig = () => {
    if (!proxyBase || !clientId) {
      toast({ title: "Missing details", description: "Enter Proxy Base URL and Client ID." });
      return;
    }
    setOpenAIProxyBase(proxyBase.trim());
    setOpenAIClientId(clientId.trim());
    toast({ title: "Saved", description: "Proxy settings saved to this browser." });
  };

  const disconnect = () => {
    clearOpenAIAuth();
    toast({ title: "Disconnected", description: "ChatGPT connection removed from this browser." });
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>Settings — AI & Providers</title>
        <meta name="description" content="Manage AI providers like ChatGPT and Perplexity, and choose default models." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://localhost:8080/settings"} />
      </Helmet>

      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">Connect ChatGPT via OAuth and choose your default AI models.</p>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">Connect ChatGPT (OpenAI)</h2>
          <p className="text-sm text-muted-foreground">Connect via OAuth through your proxy (no API key in browser).</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            <div className="md:col-span-2 space-y-2">
              <label htmlFor="proxy" className="text-sm font-medium">Proxy Base URL</label>
              <Input id="proxy" value={proxyBase} onChange={(e) => setProxyBase(e.target.value)} placeholder="https://your-proxy.example.com" />
            </div>
            <div className="md:col-span-1 space-y-2">
              <label htmlFor="clientId" className="text-sm font-medium">Client ID</label>
              <Input id="clientId" value={clientId} onChange={(e) => setClientId(e.target.value)} placeholder="app_client_id" />
            </div>
            <div className="md:col-span-3 flex items-end gap-2">
              <Button type="button" onClick={saveProxyConfig}>Save</Button>
              <Button type="button" variant="secondary" onClick={async () => {
                if (!proxyBase || !clientId) {
                  toast({ title: "Missing details", description: "Save Proxy Base URL and Client ID first." });
                  return;
                }
                const { verifier, challenge } = await generatePKCE();
                const state = Math.random().toString(36).slice(2);
                setEphemeral({ codeVerifier: verifier, state });
                const redirectUri = getRedirectUri();
                const authUrl = new URL("/oauth/authorize", proxyBase.replace(/\/$/, ""));
                authUrl.searchParams.set("response_type", "code");
                authUrl.searchParams.set("client_id", clientId);
                authUrl.searchParams.set("redirect_uri", redirectUri);
                authUrl.searchParams.set("code_challenge_method", "S256");
                authUrl.searchParams.set("code_challenge", challenge);
                authUrl.searchParams.set("state", state);
                authUrl.searchParams.set("scope", "openid offline_access");
                window.location.href = authUrl.toString();
              }}>Connect with ChatGPT</Button>
              {connected && (
                <Button variant="destructive" type="button" onClick={disconnect}>Disconnect</Button>
              )}
            </div>
          </div>
          <p className="text-xs text-muted-foreground">Your proxy should implement OAuth 2.0 with PKCE and forward to OpenAI.</p>
        </Card>

        <Card className="p-4 space-y-4">
          <h2 className="text-lg font-semibold">Default AI Model</h2>
          <p className="text-sm text-muted-foreground">Set global defaults for provider and model. You can override per feature.</p>
          <AIModelSelector />
        </Card>
      </div>
    </div>
  );
};

export default Settings;
