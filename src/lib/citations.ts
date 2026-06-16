import type { Authority } from "./types";
import { callPerplexity, LEGAL_GUARDRAIL } from "./ai";

const uid = () => Math.random().toString(36).slice(2, 10);

/**
 * Extract candidate legal authorities (statutes, codes, rules, cases) from
 * free text. Intentionally conservative — better to miss one than to flag noise.
 */
export function extractAuthorities(text: string): string[] {
  const found = new Set<string>();

  // Statutes / codes / rules: "... § 1950.5", "Civil Code section 1950.5",
  // "C.C.P. § 116.220", "Rule 12(b)(6)", "CRC 3.1110".
  const patterns: RegExp[] = [
    // Named code/act + section symbol or "section"
    /[A-Z][-A-Za-z.'& ]{2,60}?(?:Code|Act|Statute|Rules?|Constitution)\s*(?:§+|sec(?:tion)?\.?)\s*\d[\d.\-A-Za-z()]*\b/g,
    // Bare section symbol with a number (grab a little leading context)
    /(?:[A-Z][-A-Za-z.'& ]{0,40}?)?§+\s*\d[\d.\-A-Za-z()]*\b/g,
    // Rule N / Rule N(a)
    /\bRule\s+\d[\dA-Za-z.\-()]*\b/g,
    // Case citation "X v. Y"
    /\b[A-Z][-A-Za-z.']+(?:\s+[A-Z][-A-Za-z.']+)*\s+v\.?\s+[A-Z][-A-Za-z.']+(?:\s+[A-Z][-A-Za-z.']+)*/g,
  ];

  for (const re of patterns) {
    let m: RegExpExecArray | null;
    while ((m = re.exec(text)) !== null) {
      const raw = m[0].replace(/\s+/g, " ").trim().replace(/[.,;:]$/, "");
      if (raw.length >= 5 && raw.length <= 90) found.add(raw);
    }
  }
  return [...found];
}

interface VerifyResponse {
  exists: boolean;
  official_url?: string;
  quote?: string;
  note?: string;
}

const VERIFY_SYSTEM =
  LEGAL_GUARDRAIL +
  " You are now acting as a strict citation checker. For the single legal authority given, " +
  "determine whether it actually exists as cited. Respond ONLY with minified JSON: " +
  '{"exists":boolean,"official_url":string,"quote":string,"note":string}. ' +
  "quote = a SHORT verbatim snippet of the operative text if you can confirm it, else empty. " +
  "official_url = the most authoritative source URL (e.g. an official .gov code site) if known, else empty. " +
  "note = one short sentence on what it covers, or why it could not be confirmed. " +
  "If you cannot confirm it exists exactly as cited, set exists=false. Never guess a citation into existence.";

/**
 * Verify a single authority using web-grounded search. Returns an Authority
 * record with a status the UI can badge.
 */
export async function verifyAuthority(
  citation: string,
  caseContext: string
): Promise<Authority> {
  const prompt =
    `Jurisdiction context (may help disambiguate): ${caseContext || "(none given)"}\n\n` +
    `Authority to verify: "${citation}"\n\n` +
    `Confirm whether this exact authority exists, and if so quote a short operative passage ` +
    `and give the official source URL.`;
  try {
    const { content, citations } = await callPerplexity(prompt, VERIFY_SYSTEM);
    let data: VerifyResponse | null = null;
    try {
      let txt = content.trim();
      const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(txt);
      if (fence) txt = fence[1].trim();
      const s = txt.indexOf("{");
      const e = txt.lastIndexOf("}");
      if (s !== -1 && e > s) data = JSON.parse(txt.slice(s, e + 1)) as VerifyResponse;
    } catch {
      data = null;
    }
    const url = data?.official_url || citations[0] || "";
    if (data && data.exists) {
      return {
        id: uid(),
        citation,
        url,
        quote: data.quote || "",
        status: "verified",
        note: data.note || "",
      };
    }
    return {
      id: uid(),
      citation,
      url,
      quote: data?.quote || "",
      status: "failed",
      note: data?.note || "Could not confirm this authority exists as cited.",
    };
  } catch (e) {
    return {
      id: uid(),
      citation,
      url: "",
      quote: "",
      status: "unverified",
      note: e instanceof Error ? e.message : "Verification request failed.",
    };
  }
}

/** Verify many authorities with limited concurrency to respect rate limits. */
export async function verifyAuthorities(
  citations: string[],
  caseContext: string,
  onResult?: (a: Authority) => void
): Promise<Authority[]> {
  const results: Authority[] = [];
  const concurrency = 2;
  let i = 0;
  async function worker() {
    while (i < citations.length) {
      const idx = i++;
      const a = await verifyAuthority(citations[idx], caseContext);
      results[idx] = a;
      onResult?.(a);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, citations.length) }, worker));
  return results;
}
