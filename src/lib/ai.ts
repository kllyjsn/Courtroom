import type { CaseFile } from "./types";
import { useSettings } from "../store/useSettings";

export class MissingKeyError extends Error {
  constructor(public provider: "gemini" | "perplexity") {
    super(
      `No ${provider === "gemini" ? "Google Gemini" : "Perplexity"} API key configured. Add one in Settings.`
    );
    this.name = "MissingKeyError";
  }
}

/** Build a compact, plain-language description of the case for AI prompts. */
export function buildCaseContext(c: CaseFile): string {
  const lines: string[] = [];
  lines.push(`Case title: ${c.title || "(untitled)"}`);
  lines.push(`Jurisdiction: ${c.jurisdiction || "(not specified)"}`);
  lines.push(`Type of matter: ${c.caseType}`);
  lines.push(`The self-represented person's role: ${c.role}`);
  if (c.caseNumber) lines.push(`Case number: ${c.caseNumber}`);
  if (c.hearingDate) lines.push(`Hearing date: ${c.hearingDate}`);
  if (c.charges) lines.push(`Charges / claims at issue: ${c.charges}`);
  if (c.summary) lines.push(`\nWhat happened (their account):\n${c.summary}`);
  if (c.desiredOutcome) lines.push(`\nDesired outcome: ${c.desiredOutcome}`);

  if (c.parties.length) {
    lines.push(`\nParties / people involved:`);
    c.parties.forEach((p) =>
      lines.push(`- ${p.name || "(unnamed)"} — ${p.role}${p.notes ? ` (${p.notes})` : ""}`)
    );
  }
  if (c.timeline.length) {
    lines.push(`\nTimeline of events:`);
    c.timeline.forEach((e) => lines.push(`- ${e.date || "?"}: ${e.description}`));
  }
  if (c.evidence.length) {
    lines.push(`\nEvidence available:`);
    c.evidence.forEach((e) =>
      lines.push(
        `- ${e.exhibitId ? `Exhibit ${e.exhibitId} — ` : ""}[${e.type}] ${e.label || "(untitled)"}: ${e.description}${e.supports ? ` → supports: ${e.supports}` : ""}`
      )
    );
  }
  if (c.claims?.length) {
    lines.push(`\nLegal claims / elements at issue:`);
    c.claims.forEach((cl) => {
      lines.push(`- ${cl.name} (must be proven by ${cl.byParty || "?"}):`);
      cl.elements.forEach((el) =>
        lines.push(`    • [${el.status}] ${el.text}`)
      );
    });
  }
  if (c.deadlines?.length) {
    lines.push(`\nKnown deadlines / tasks:`);
    c.deadlines.forEach((d) =>
      lines.push(`- ${d.date || "(no date)"}: ${d.title}${d.done ? " (done)" : ""}`)
    );
  }
  return lines.join("\n");
}

/** Pull the first balanced JSON object/array out of an LLM response. */
export function extractJson<T = unknown>(raw: string): T | null {
  let txt = raw.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(txt);
  if (fence) txt = fence[1].trim();
  const firstObj = txt.indexOf("{");
  const firstArr = txt.indexOf("[");
  let start = -1;
  let close = "}";
  if (firstArr !== -1 && (firstObj === -1 || firstArr < firstObj)) {
    start = firstArr;
    close = "]";
  } else if (firstObj !== -1) {
    start = firstObj;
  }
  if (start === -1) return null;
  const end = txt.lastIndexOf(close);
  if (end <= start) return null;
  try {
    return JSON.parse(txt.slice(start, end + 1)) as T;
  } catch {
    return null;
  }
}

/** Call Gemini and parse a JSON object/array from the response. */
export async function callGeminiJSON<T>(
  prompt: string,
  system: string,
  signal?: AbortSignal
): Promise<T> {
  const raw = await callGemini(prompt, system, signal);
  const parsed = extractJson<T>(raw);
  if (parsed === null) throw new Error("The assistant did not return valid JSON.");
  return parsed;
}

export const LEGAL_GUARDRAIL =
  "You are a legal-information assistant for a person representing themselves (pro se) in court. " +
  "You are NOT a lawyer and you do NOT provide legal advice. Provide general legal information, " +
  "procedure, and educational explanations. Always note that laws vary by jurisdiction and that the " +
  "user should verify against their local court rules and, where possible, consult a licensed attorney " +
  "or legal-aid service. Be concrete, practical, plain-spoken, and organized. Use the user's case facts " +
  "when given. Never fabricate statutes, case citations, or court rules — if unsure, say so and explain " +
  "how to find the authoritative source.";

interface GeminiPart {
  text?: string;
}
interface GeminiCandidate {
  content?: { parts?: GeminiPart[] };
}
interface GeminiResponse {
  candidates?: GeminiCandidate[];
  error?: { message?: string };
}

/** Non-streaming Gemini call. Returns the full text. */
export async function callGemini(
  prompt: string,
  system: string = LEGAL_GUARDRAIL,
  signal?: AbortSignal
): Promise<string> {
  const { geminiKey, geminiModel, proxyUrl } = useSettings.getState();
  if (!proxyUrl && !geminiKey) throw new MissingKeyError("gemini");

  const url = proxyUrl
    ? `${proxyUrl}/api/gemini?model=${geminiModel}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });

  const data: GeminiResponse = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Gemini error (${res.status})`);
  }
  const text =
    data.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") ?? "";
  if (!text) throw new Error("Gemini returned an empty response.");
  return text;
}

/** Streaming Gemini call. Invokes onChunk with incremental text. Returns full text. */
export async function streamGemini(
  prompt: string,
  onChunk: (text: string) => void,
  system: string = LEGAL_GUARDRAIL,
  signal?: AbortSignal
): Promise<string> {
  const { geminiKey, geminiModel, proxyUrl } = useSettings.getState();
  if (!proxyUrl && !geminiKey) throw new MissingKeyError("gemini");

  const url = proxyUrl
    ? `${proxyUrl}/api/gemini/stream?model=${geminiModel}`
    : `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:streamGenerateContent?alt=sse&key=${geminiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    signal,
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: system }] },
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.4, maxOutputTokens: 2048 },
    }),
  });

  if (!res.ok || !res.body) {
    const data: GeminiResponse = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || `Gemini error (${res.status})`);
  }

  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  let full = "";
  let finished = false;

  while (!finished) {
    const { done, value } = await reader.read();
    if (done) {
      finished = true;
      break;
    }
    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() ?? "";
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed.startsWith("data:")) continue;
      const json = trimmed.slice(5).trim();
      if (!json || json === "[DONE]") continue;
      try {
        const parsed: GeminiResponse = JSON.parse(json);
        const chunk =
          parsed.candidates?.[0]?.content?.parts
            ?.map((p) => p.text || "")
            .join("") ?? "";
        if (chunk) {
          full += chunk;
          onChunk(chunk);
        }
      } catch {
        /* ignore partial json */
      }
    }
  }
  return full;
}

export interface ResearchResult {
  content: string;
  citations: string[];
}

interface PerplexityResponse {
  choices?: { message?: { content?: string } }[];
  citations?: string[];
  error?: { message?: string };
}

/** Perplexity research call with web citations. */
export async function callPerplexity(
  prompt: string,
  system: string = LEGAL_GUARDRAIL
): Promise<ResearchResult> {
  const { perplexityKey, proxyUrl } = useSettings.getState();
  if (!proxyUrl && !perplexityKey) throw new MissingKeyError("perplexity");

  const res = await fetch(
    proxyUrl ? `${proxyUrl}/api/perplexity` : "https://api.perplexity.ai/chat/completions",
    {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(proxyUrl ? {} : { Authorization: `Bearer ${perplexityKey}` }),
    },
    body: JSON.stringify({
      model: "sonar",
      temperature: 0.2,
      messages: [
        { role: "system", content: system },
        { role: "user", content: prompt },
      ],
    }),
    }
  );

  const data: PerplexityResponse = await res.json();
  if (!res.ok) {
    throw new Error(data.error?.message || `Perplexity error (${res.status})`);
  }
  return {
    content: data.choices?.[0]?.message?.content ?? "",
    citations: data.citations ?? [],
  };
}
