// Minimal key-proxy for Pro Se.
//
// Holds the Gemini + Perplexity API keys server-side so the frontend doesn't
// need bring-your-own-key. Set the proxy's public URL in the app's Settings →
// "Backend proxy". This is intentionally small and dependency-light; harden it
// (auth, rate limiting, logging, CORS allow-list) before any real deployment.
//
// Usage:
//   GEMINI_API_KEY=... PERPLEXITY_API_KEY=... node server/index.js
//
// Endpoints (mirrors what src/lib/ai.ts expects):
//   POST /api/gemini?model=gemini-2.5-flash        -> Gemini generateContent (JSON)
//   POST /api/gemini/stream?model=gemini-2.5-flash -> Gemini streamGenerateContent (SSE)
//   POST /api/perplexity                           -> Perplexity chat/completions (JSON)

import http from "node:http";

const PORT = process.env.PORT || 8787;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY || "";
const PERPLEXITY_API_KEY = process.env.PERPLEXITY_API_KEY || "";

// Tighten this to your app's origin in production.
const ALLOW_ORIGIN = process.env.ALLOW_ORIGIN || "*";

function cors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOW_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    let data = "";
    req.on("data", (c) => (data += c));
    req.on("end", () => resolve(data));
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  cors(res);
  if (req.method === "OPTIONS") {
    res.writeHead(204);
    return res.end();
  }
  const url = new URL(req.url, `http://${req.headers.host}`);

  try {
    if (req.method === "POST" && url.pathname === "/api/gemini") {
      const model = url.searchParams.get("model") || "gemini-2.5-flash";
      const body = await readBody(req);
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body }
      );
      res.writeHead(upstream.status, { "Content-Type": "application/json" });
      return res.end(await upstream.text());
    }

    if (req.method === "POST" && url.pathname === "/api/gemini/stream") {
      const model = url.searchParams.get("model") || "gemini-2.5-flash";
      const body = await readBody(req);
      const upstream = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${GEMINI_API_KEY}`,
        { method: "POST", headers: { "Content-Type": "application/json" }, body }
      );
      res.writeHead(upstream.status, {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      });
      if (!upstream.body) return res.end();
      const reader = upstream.body.getReader();
      const decoder = new TextDecoder();
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        res.write(decoder.decode(value, { stream: true }));
      }
      return res.end();
    }

    if (req.method === "POST" && url.pathname === "/api/perplexity") {
      const body = await readBody(req);
      const upstream = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${PERPLEXITY_API_KEY}`,
        },
        body,
      });
      res.writeHead(upstream.status, { "Content-Type": "application/json" });
      return res.end(await upstream.text());
    }

    res.writeHead(404, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: "Not found" }));
  } catch (e) {
    res.writeHead(500, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ error: String(e) }));
  }
});

server.listen(PORT, () => {
  console.log(`Pro Se key-proxy listening on http://localhost:${PORT}`);
  if (!GEMINI_API_KEY) console.warn("⚠  GEMINI_API_KEY not set");
  if (!PERPLEXITY_API_KEY) console.warn("⚠  PERPLEXITY_API_KEY not set");
});
