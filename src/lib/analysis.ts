import type { CaseFile, LegalClaim, Deadline } from "./types";
import { buildCaseContext, callGeminiJSON, LEGAL_GUARDRAIL } from "./ai";

const uid = () => Math.random().toString(36).slice(2, 10);

const CLAIMS_SYSTEM =
  LEGAL_GUARDRAIL +
  " Identify each legal claim / cause of action / charge at issue and break it into the legal ELEMENTS that " +
  "the responsible party must prove. Respond ONLY with minified JSON: " +
  '{"claims":[{"name":string,"byParty":string,"elements":[string]}]}. ' +
  "byParty = who bears the burden on that claim (e.g. \"Plaintiff\", \"Prosecution\"). " +
  "elements = the discrete things that party must prove for that claim, in plain language. " +
  "Base elements on the jurisdiction's general law for this claim type; if unsure, give the widely-recognized " +
  "elements and keep them general. Never invent claims not implied by the facts.";

interface ClaimsResponse {
  claims?: { name?: string; byParty?: string; elements?: string[] }[];
}

/** Ask the model to derive claims + elements for the current case. */
export async function generateClaims(c: CaseFile): Promise<LegalClaim[]> {
  const prompt =
    `CASE FILE:\n${buildCaseContext(c)}\n\n` +
    `List the legal claims/charges at issue and the elements each responsible party must prove.`;
  const data = await callGeminiJSON<ClaimsResponse>(prompt, CLAIMS_SYSTEM);
  return (data.claims ?? [])
    .filter((cl) => cl.name?.trim())
    .map((cl) => ({
      id: uid(),
      name: cl.name!.trim(),
      byParty: cl.byParty?.trim() || "",
      elements: (cl.elements ?? [])
        .filter((e) => e?.trim())
        .map((e) => ({
          id: uid(),
          text: e.trim(),
          status: "unaddressed" as const,
          evidenceIds: [],
          notes: "",
        })),
    }));
}

const DEADLINES_SYSTEM =
  LEGAL_GUARDRAIL +
  " Produce a practical, jurisdiction-aware checklist of procedural deadlines and prep tasks leading up to the " +
  "hearing for this self-represented litigant. Respond ONLY with minified JSON: " +
  '{"deadlines":[{"title":string,"date":string,"detail":string}]}. ' +
  "date = ISO YYYY-MM-DD ONLY when you can anchor it to a known date (e.g. counted back from the hearing date); " +
  "otherwise empty string. detail = one short sentence on what to do and (if relevant) the rule that sets the timing. " +
  "Prefer 5-10 high-value items. If timing varies by court, say so in detail and leave date empty. Never fabricate a specific date.";

interface DeadlinesResponse {
  deadlines?: { title?: string; date?: string; detail?: string }[];
}

/** Ask the model to derive a deadline/prep checklist for the current case. */
export async function generateDeadlines(c: CaseFile): Promise<Deadline[]> {
  const prompt =
    `CASE FILE:\n${buildCaseContext(c)}\n\nToday's date is ${new Date()
      .toISOString()
      .slice(0, 10)}. Build the deadline & prep checklist.`;
  const data = await callGeminiJSON<DeadlinesResponse>(prompt, DEADLINES_SYSTEM);
  return (data.deadlines ?? [])
    .filter((d) => d.title?.trim())
    .map((d) => ({
      id: uid(),
      title: d.title!.trim(),
      date: d.date?.trim() || "",
      detail: d.detail?.trim() || "",
      done: false,
      source: "ai" as const,
    }));
}
