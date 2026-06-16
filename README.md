# Pro Se — Defend Yourself

A real-time **self-representation legal copilot**. Pro Se helps a self-represented (pro se)
litigant organize a case, research the relevant law, draft arguments and motions, learn
courtroom procedure, and get live prompts during a hearing.

> [!WARNING]
> **This is an educational tool, not a lawyer, and not legal advice.** AI output can be wrong
> or incomplete. Laws and procedures vary by country, state, and court — verify everything
> against your court's official rules and consult a licensed attorney or legal-aid service
> where possible. **Recording, transcribing, or using a phone in a live courtroom is often
> restricted or illegal** — only use Hearing Mode where devices are expressly permitted.

## Features

- **Case Builder** — capture jurisdiction, role, facts, parties, timeline, evidence, and your
  desired outcome. This case file powers every other tool.
- **Legal Research** (Perplexity) — web-grounded answers with citations, tailored to your case
  and jurisdiction.
- **Arguments & Motions** (Gemini) — build a persuasive argument outline, anticipate the other
  side's arguments with rebuttals, and draft fill-in-the-blank motions.
- **Rights & Objections** — plain-language guide to courtroom procedure, burden of proof, and a
  tap-to-use objection cheat sheet.
- **Hearing Mode** — live speech-to-text (browser Web Speech API) with real-time, case-aware
  objection / response / fact prompts.
- **Privacy** — your case data, drafts, and API keys are stored only in your browser's
  `localStorage`. The only network calls are direct requests to the AI providers you configure.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Router · Web Speech API ·
Google Gemini · Perplexity.

## Getting started

```bash
npm install
npm run dev
```

Then open the app, accept the disclaimer, and go to **Settings** to add your API keys:

- **Google Gemini** — https://aistudio.google.com/apikey (arguments, motions, Hearing Mode)
- **Perplexity** — https://www.perplexity.ai/settings/api (Legal Research)

Keys are stored locally in your browser; nothing is sent to a backend.

## Scripts

| Command            | Description                       |
| ------------------ | --------------------------------- |
| `npm run dev`      | Start the dev server              |
| `npm run build`    | Type-check and build for production |
| `npm run preview`  | Preview the production build       |
| `npm run lint`     | Run ESLint                        |

## Notes for a production deployment

The app is BYO-key and entirely client-side for simplicity. For a shared/public deployment,
proxy the Gemini and Perplexity calls through a small backend so provider keys are never exposed
in the browser, and add rate limiting.
