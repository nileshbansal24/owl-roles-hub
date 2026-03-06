/**
 * Cloudflare Worker — Reverse proxy for Supabase
 * Bypasses regional domain blocking (e.g. India) by routing
 * all Supabase requests through a Cloudflare Worker URL.
 *
 * Deploy: cd cloudflare-worker && npx wrangler deploy
 * Then set your CF Pages env var VITE_SUPABASE_URL to the worker URL.
 */

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const supabaseUrl = env.SUPABASE_URL; // e.g. https://xxx.supabase.co

    // Build target URL: keep path + query, change origin
    const targetUrl = `${supabaseUrl}${url.pathname}${url.search}`;

    // Clone headers, remove host (CF will set it)
    const headers = new Headers(request.headers);
    headers.delete("host");

    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(request),
      });
    }

    try {
      const response = await fetch(targetUrl, {
        method: request.method,
        headers,
        body: request.method !== "GET" && request.method !== "HEAD"
          ? request.body
          : undefined,
        redirect: "follow",
      });

      // Clone response and add CORS headers
      const responseHeaders = new Headers(response.headers);
      setCors(responseHeaders, request);

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: responseHeaders,
      });
    } catch (err) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: 502,
        headers: { "Content-Type": "application/json", ...Object.fromEntries(corsHeaders(request)) },
      });
    }
  },
};

function corsHeaders(request) {
  const origin = request.headers.get("Origin") || "*";
  return new Headers({
    "Access-Control-Allow-Origin": origin,
    "Access-Control-Allow-Methods": "GET, POST, PUT, PATCH, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "authorization, x-client-info, apikey, content-type, range, prefer, x-supabase-api-version, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Max-Age": "86400",
  });
}

function setCors(headers, request) {
  const origin = request.headers.get("Origin") || "*";
  headers.set("Access-Control-Allow-Origin", origin);
  headers.set("Access-Control-Allow-Credentials", "true");
}
