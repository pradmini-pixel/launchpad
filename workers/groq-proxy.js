// Cloudflare Worker: a tiny CORS proxy for Groq, so DayOne can call Groq from a
// static host (e.g. GitHub Pages) where no server-side proxy exists.
//
// Deploy (no CLI needed):
//   1. dash.cloudflare.com → Workers & Pages → Create → Worker.
//   2. Replace the default code with this file, Deploy.
//   3. Copy the worker URL, e.g. https://dayone-groq.<you>.workers.dev
//   4. In the app (or the VITE_GROQ_BASE_URL repo variable), use that URL plus
//      "/openai/v1" as the Groq base URL.
//
// Security: this forwards only the caller's Authorization header (their own Groq
// key) to api.groq.com. It stores nothing and holds no secret of its own.

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

export default {
  async fetch(request) {
    if (request.method === "OPTIONS") {
      return new Response(null, { status: 204, headers: CORS });
    }

    const url = new URL(request.url);
    const target = "https://api.groq.com" + url.pathname + url.search;

    // Forward only what Groq needs — never leak the Worker's own Host header.
    const headers = new Headers();
    const auth = request.headers.get("authorization");
    if (auth) headers.set("authorization", auth);
    headers.set("content-type", "application/json");

    const upstream = await fetch(target, {
      method: request.method,
      headers,
      body: request.method === "GET" ? undefined : request.body,
    });

    const res = new Response(upstream.body, upstream);
    for (const [k, v] of Object.entries(CORS)) res.headers.set(k, v);
    return res;
  },
};
