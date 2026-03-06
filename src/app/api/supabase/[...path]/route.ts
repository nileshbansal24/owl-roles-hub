import { NextRequest, NextResponse } from "next/server";

/**
 * Reverse proxy for Supabase — routes all client-side Supabase requests
 * through the Next.js server to bypass regional domain blocking.
 *
 * Works on both Node.js (local dev) and Cloudflare Workers (production).
 * On CF Workers, env vars come from runtime bindings via getRequestContext().
 */

export const runtime = "edge";

function getSupabaseUrl(): string {
  try {
    // Cloudflare Workers: env vars are runtime bindings
    const { getRequestContext } = require("@cloudflare/next-on-pages");
    return getRequestContext().env.SUPABASE_URL;
  } catch {
    // Node.js (local dev / non-CF deployment)
    return process.env.SUPABASE_URL!;
  }
}

const PASS_THROUGH_HEADERS = [
  "authorization",
  "apikey",
  "content-type",
  "range",
  "prefer",
  "x-client-info",
  "x-supabase-api-version",
];

function buildTargetUrl(req: NextRequest): string {
  const url = new URL(req.url);
  const path = url.pathname.replace(/^\/api\/supabase/, "");
  return `${getSupabaseUrl()}${path}${url.search}`;
}

function filterHeaders(incoming: Headers): Headers {
  const headers = new Headers();
  for (const key of PASS_THROUGH_HEADERS) {
    const val = incoming.get(key);
    if (val) headers.set(key, val);
  }
  return headers;
}

function setCorsHeaders(responseHeaders: Headers, origin: string) {
  // Remove any CORS headers from Supabase's response — they reference
  // the Supabase domain which the browser will reject.
  responseHeaders.delete("access-control-allow-origin");
  responseHeaders.delete("access-control-allow-methods");
  responseHeaders.delete("access-control-allow-headers");
  responseHeaders.delete("access-control-allow-credentials");
  responseHeaders.delete("access-control-expose-headers");
  responseHeaders.delete("access-control-max-age");

  // Set our own CORS headers matching the request origin
  responseHeaders.set("access-control-allow-origin", origin);
  responseHeaders.set("access-control-allow-credentials", "true");
  responseHeaders.set(
    "access-control-allow-methods",
    "GET, POST, PUT, PATCH, DELETE, OPTIONS"
  );
  responseHeaders.set(
    "access-control-allow-headers",
    "authorization, x-client-info, apikey, content-type, range, prefer, x-supabase-api-version"
  );
  responseHeaders.set("access-control-max-age", "86400");
}

async function proxyRequest(req: NextRequest): Promise<NextResponse> {
  const origin = req.headers.get("origin") || "*";

  // Handle CORS preflight immediately — no need to forward to Supabase
  if (req.method === "OPTIONS") {
    const headers = new Headers();
    setCorsHeaders(headers, origin);
    return new NextResponse(null, { status: 204, headers });
  }

  const targetUrl = buildTargetUrl(req);
  const headers = filterHeaders(req.headers);

  const body =
    req.method !== "GET" && req.method !== "HEAD" ? req.body : undefined;

  try {
    const response = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      redirect: "follow",
      // @ts-ignore — duplex is required for streaming request bodies in Node 18+
      duplex: body ? "half" : undefined,
    });

    // Read the full response body (auto-decompresses gzip/br from Supabase)
    const responseBody = await response.arrayBuffer();

    const responseHeaders = new Headers();
    // Forward safe response headers, skip encoding-related ones
    const skipHeaders = new Set([
      "transfer-encoding",
      "content-encoding",
      "content-length",
      "access-control-allow-origin",
      "access-control-allow-methods",
      "access-control-allow-headers",
      "access-control-allow-credentials",
      "access-control-expose-headers",
      "access-control-max-age",
    ]);
    response.headers.forEach((value, key) => {
      if (!skipHeaders.has(key.toLowerCase())) {
        responseHeaders.set(key, value);
      }
    });
    setCorsHeaders(responseHeaders, origin);

    return new NextResponse(responseBody, {
      status: response.status,
      statusText: response.statusText,
      headers: responseHeaders,
    });
  } catch (err: any) {
    const headers = new Headers();
    setCorsHeaders(headers, origin);
    headers.set("content-type", "application/json");
    return new NextResponse(JSON.stringify({ error: err.message ?? "Proxy error" }), {
      status: 502,
      headers,
    });
  }
}

export const GET = proxyRequest;
export const POST = proxyRequest;
export const PUT = proxyRequest;
export const PATCH = proxyRequest;
export const DELETE = proxyRequest;
export const OPTIONS = proxyRequest;
