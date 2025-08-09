import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { useToast } from "@/components/ui/use-toast";
import { getEphemeral, clearEphemeral, getOpenAIClientId, getOpenAIProxyBase, getRedirectUri, setOpenAIAuth } from "@/store/openai-oauth";
import { toFormUrlEncoded } from "@/utils/oauth";

export default function OpenAICallback() {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [status, setStatus] = useState("Finishing connection…");

  useEffect(() => {
    async function run() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const state = url.searchParams.get("state");
        if (!code || !state) throw new Error("Missing authorization code or state");

        const { codeVerifier, state: storedState } = getEphemeral();
        if (!codeVerifier) throw new Error("Missing PKCE verifier");
        if (!storedState || storedState !== state) throw new Error("State mismatch");

        const proxyBase = getOpenAIProxyBase();
        const clientId = getOpenAIClientId();
        const redirectUri = getRedirectUri();
        if (!proxyBase || !clientId) throw new Error("Missing proxy configuration");

        setStatus("Exchanging code for tokens…");
        const resp = await fetch(`${proxyBase.replace(/\/$/, "")}/oauth/token`, {
          method: "POST",
          headers: { "Content-Type": "application/x-www-form-urlencoded" },
          body: toFormUrlEncoded({
            grant_type: "authorization_code",
            client_id: clientId,
            code,
            code_verifier: codeVerifier,
            redirect_uri: redirectUri,
          }),
        });
        if (!resp.ok) throw new Error("Token exchange failed");
        const data = await resp.json();
        const expiresIn = Number(data.expires_in ?? 3600);
        const expiresAt = Date.now() + expiresIn * 1000;
        setOpenAIAuth({ accessToken: data.access_token, refreshToken: data.refresh_token, expiresAt });
        clearEphemeral();
        toast({ title: "ChatGPT connected", description: "OpenAI is now connected via OAuth." });
        navigate("/settings");
      } catch (err: any) {
        console.error(err);
        toast({ title: "Connection failed", description: err?.message ?? "Unknown error" });
        setStatus("Connection failed. You can close this tab.");
      }
    }
    run();
  }, [navigate, toast]);

  return (
    <div className="container mx-auto px-4 py-6">
      <Helmet>
        <title>OpenAI OAuth Callback — Connecting ChatGPT</title>
        <meta name="description" content="Completing ChatGPT connection via OAuth." />
        <link rel="canonical" href={typeof window !== "undefined" ? window.location.href : "https://localhost:8080/auth/openai/callback"} />
      </Helmet>
      <header className="mb-4">
        <h1 className="text-2xl font-semibold">Connecting ChatGPT</h1>
        <p className="text-sm text-muted-foreground">{status}</p>
      </header>
    </div>
  );
}
