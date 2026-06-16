# Pro Se key-proxy

A minimal, dependency-free proxy that holds the Gemini + Perplexity API keys
server-side so the frontend doesn't need bring-your-own-key.

## Run

```bash
GEMINI_API_KEY=your_gemini_key \
PERPLEXITY_API_KEY=your_pplx_key \
node server/index.js
```

Then in the app: **Settings → Backend proxy** → set the base URL (e.g.
`http://localhost:8787`). All AI requests now route through the proxy and the
key fields become optional.

## Endpoints

| Method | Path | Upstream |
| ------ | ---- | -------- |
| POST | `/api/gemini?model=…` | Gemini `generateContent` |
| POST | `/api/gemini/stream?model=…` | Gemini `streamGenerateContent` (SSE) |
| POST | `/api/perplexity` | Perplexity `chat/completions` |

## Before production

This example is intentionally small. Add at minimum:

- **Auth** — require a session token / API key per user so the proxy isn't an
  open relay.
- **CORS allow-list** — set `ALLOW_ORIGIN` to your app's origin (defaults to `*`).
- **Rate limiting & quotas** — per-user budgets to control cost.
- **Logging & abuse monitoring** — without logging request *contents* (privacy).
- **Accounts + case sync** — persist `CaseFile` server-side so cases follow the
  user across devices (today everything lives in `localStorage`).

See the root `README.md` "Productization" section for the full roadmap.
