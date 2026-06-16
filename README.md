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
- **Documents & Intake** — drop in your complaint, summons, lease, or evidence (PDF, images via
  OCR, or text). Pro Se extracts the text and auto-builds your case file: parties, timeline,
  claims, elements, and deadlines.
- **Legal Research** (Perplexity) — web-grounded answers with citations, tailored to your case,
  plus a **citation verifier** that independently re-checks each cited statute/rule/case so you
  never rely on an authority the AI invented.
- **Case Theory** — breaks the case into the legal **elements** each side must prove and lets you
  map your evidence to each one, surfacing the gaps in your proof.
- **Arguments & Motions** (Gemini) — build a persuasive argument outline, anticipate the other
  side's arguments with rebuttals, and draft fill-in-the-blank motions.
- **Court Forms & Exhibits** — generate court-ready document drafts (motion, answer, declaration,
  continuance, fee waiver) with an auto-built caption, and assemble a labeled **exhibit binder**
  — all exported as PDF.
- **Deadlines & Procedure** — a jurisdiction-aware checklist of filing deadlines and prep tasks
  with countdowns, exportable to your calendar as an `.ics` file.
- **Rights & Objections** — plain-language guide to courtroom procedure, burden of proof, and a
  tap-to-use objection cheat sheet.
- **Hearing Mode** — live speech-to-text (browser Web Speech API) with real-time, case-aware
  objection / response / fact prompts.
- **Mock Hearing** — rehearse against an AI judge and opposing counsel, then get a scored critique
  with strengths, improvements, and missed objections.
- **Privacy** — your case data, drafts, and API keys are stored only in your browser's
  `localStorage`. Document text never leaves your browser except in the AI requests you trigger.
  Optionally route all AI calls through a self-hosted [key-proxy](./server) instead of BYO-key.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · Zustand · React Router · Web Speech API ·
pdf.js (PDF text) · Tesseract.js (image OCR) · pdf-lib (PDF generation) · Google Gemini ·
Perplexity.

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

## Productization

The app is BYO-key and entirely client-side for simplicity. To run it as a real product:

- **Hosted key-proxy (included).** A minimal, dependency-free proxy lives in [`server/`](./server).
  Run it with your Gemini + Perplexity keys, then set its URL in **Settings → Backend proxy** —
  the app routes every AI call through it and users no longer paste their own keys.
- **Accounts + case sync.** Today a `CaseFile` lives in `localStorage`. Persist it server-side
  (behind auth) so cases follow the user across devices.
- **Mobile PWA.** The UI is responsive; add a manifest + service worker for installable/offline use.
- **Safety / unauthorized-practice.** Keep the prominent "not legal advice" guardrails, the citation
  verifier, and add an explicit handoff to local legal-aid and lawyer-referral services.
- **Hardening.** Add auth, a CORS allow-list, per-user rate limits/quotas, and abuse monitoring on
  the proxy before any public deployment. See [`server/README.md`](./server/README.md).
