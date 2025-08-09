// PKCE utilities for OAuth 2.0 (S256)

function base64urlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

function base64urlFromString(input: string): string {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

export function randomString(length = 64): string {
  const charset = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~";
  const result: string[] = [];
  const randoms = new Uint32Array(length);
  crypto.getRandomValues(randoms);
  for (let i = 0; i < length; i++) result.push(charset[randoms[i] % charset.length]);
  return result.join("");
}

export async function generatePKCE() {
  const verifier = randomString(64);
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  const challenge = base64urlEncode(digest);
  return { verifier, challenge };
}

export function buildAuthorizeUrl(params: Record<string, string>, base: string) {
  const url = new URL(base.replace(/\/$/, ""));
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  return url.toString();
}

export function toFormUrlEncoded(params: Record<string, string>) {
  const usp = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => usp.append(k, v));
  return usp.toString();
}
