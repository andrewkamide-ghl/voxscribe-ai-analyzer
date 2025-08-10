/* eslint-disable */
// deno-lint-ignore-file no-explicit-any
import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

const json = (data: any, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
    },
  });

function isValidUrl(input: string): boolean {
  try {
    const u = new URL(input);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
}

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return json({}, 204);
  }

  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return json({ error: "Invalid JSON body" }, 400);
  }

  const url = String(body?.url || "");
  if (!isValidUrl(url)) {
    return json({ error: "Invalid URL" }, 400);
  }

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), 12000);

    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; LovableFetcher/1.0; +https://lovable.dev)",
        "Accept":
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
      signal: controller.signal,
    });
    clearTimeout(id);

    if (!res.ok) {
      return json(
        { error: "Upstream fetch failed", status: res.status },
        502,
      );
    }

    const contentType = res.headers.get("content-type") || "";
    const raw = await res.text();

    const htmlExcerpt = raw.slice(0, 4000);
    const titleMatch = raw.match(/<title[^>]*>([\s\S]*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1].trim() : url;

    let text = raw;
    if (contentType.includes("text/html") || /<html/i.test(raw)) {
      text = stripHtml(raw);
    }

    // Safety limits
    const MAX_CHARS = 120_000;
    const safeText = text.slice(0, MAX_CHARS);

    return json({
      pages: [
        {
          url,
          title,
          text: safeText,
          htmlExcerpt,
        },
      ],
    });
  } catch (e: any) {
    const message = e?.message || "Unknown error";
    const aborted = message.includes("abort") || message.includes("signal");
    return json(
      { error: aborted ? "Timeout while fetching URL" : "Fetch error", message },
      aborted ? 504 : 500,
    );
  }
});
