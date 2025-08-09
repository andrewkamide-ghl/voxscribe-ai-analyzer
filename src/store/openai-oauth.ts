// Lightweight localStorage-backed store for OpenAI OAuth (proxy-based)
// No React dependencies so it can be used in utilities

const KEYS = {
  proxyBase: "openai_oauth_proxy_base",
  clientId: "openai_oauth_client_id",
  accessToken: "openai_oauth_access_token",
  refreshToken: "openai_oauth_refresh_token",
  expiresAt: "openai_oauth_expires_at",
  codeVerifier: "openai_oauth_code_verifier",
  state: "openai_oauth_state",
} as const;

function getLS(key: string) {
  try {
    return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
  } catch {
    return null;
  }
}

function setLS(key: string, value: string) {
  try {
    if (typeof window !== "undefined") window.localStorage.setItem(key, value);
  } catch {
    // noop
  }
}

function removeLS(key: string) {
  try {
    if (typeof window !== "undefined") window.localStorage.removeItem(key);
  } catch {
    // noop
  }
}

export function getOpenAIProxyBase(): string | null {
  return getLS(KEYS.proxyBase);
}

export function setOpenAIProxyBase(url: string) {
  setLS(KEYS.proxyBase, url);
}

export function getOpenAIClientId(): string | null {
  return getLS(KEYS.clientId);
}

export function setOpenAIClientId(id: string) {
  setLS(KEYS.clientId, id);
}

export function setOpenAIAuth(auth: { accessToken: string; refreshToken?: string | null; expiresAt?: number | null }) {
  setLS(KEYS.accessToken, auth.accessToken);
  if (auth.refreshToken) setLS(KEYS.refreshToken, auth.refreshToken);
  if (auth.expiresAt != null) setLS(KEYS.expiresAt, String(auth.expiresAt));
}

export function getOpenAIAuth(): { accessToken: string; refreshToken?: string | null; expiresAt?: number | null } | null {
  const accessToken = getLS(KEYS.accessToken);
  if (!accessToken) return null;
  const refreshToken = getLS(KEYS.refreshToken);
  const expiresAtRaw = getLS(KEYS.expiresAt);
  const expiresAt = expiresAtRaw ? Number(expiresAtRaw) : null;
  return { accessToken, refreshToken, expiresAt };
}

export function clearOpenAIAuth() {
  removeLS(KEYS.accessToken);
  removeLS(KEYS.refreshToken);
  removeLS(KEYS.expiresAt);
}

export function setEphemeral(data: { codeVerifier: string; state: string }) {
  setLS(KEYS.codeVerifier, data.codeVerifier);
  setLS(KEYS.state, data.state);
}

export function getEphemeral(): { codeVerifier: string | null; state: string | null } {
  return { codeVerifier: getLS(KEYS.codeVerifier), state: getLS(KEYS.state) };
}

export function clearEphemeral() {
  removeLS(KEYS.codeVerifier);
  removeLS(KEYS.state);
}

export function isOpenAIConnected(): boolean {
  const auth = getOpenAIAuth();
  if (!auth?.accessToken) return false;
  if (!auth.expiresAt) return true; // if no expiry, assume valid
  return Date.now() < auth.expiresAt - 5_000; // small skew
}

export function getRedirectUri(): string {
  if (typeof window === "undefined") return "";
  return `${window.location.origin}/auth/openai/callback`;
}
