import type { CaseFile, CaseType, CaseRole, LegalClaim } from "./types";
import { callGeminiJSON, LEGAL_GUARDRAIL } from "./ai";

const uid = () => Math.random().toString(36).slice(2, 10);

const CASE_TYPES: CaseType[] = [
  "small-claims",
  "civil",
  "criminal-misdemeanor",
  "traffic",
  "landlord-tenant",
  "family",
  "administrative",
  "other",
];
const ROLES: CaseRole[] = [
  "defendant",
  "plaintiff",
  "respondent",
  "petitioner",
  "appellant",
  "other",
];

interface ExtractedCase {
  title?: string;
  jurisdiction?: string;
  caseType?: string;
  role?: string;
  caseNumber?: string;
  hearingDate?: string;
  summary?: string;
  desiredOutcome?: string;
  charges?: string;
  parties?: { name?: string; role?: string; notes?: string }[];
  timeline?: { date?: string; description?: string }[];
  deadlines?: { title?: string; date?: string; detail?: string }[];
  claims?: {
    name?: string;
    byParty?: string;
    elements?: { text?: string }[];
  }[];
}

const INTAKE_SYSTEM =
  LEGAL_GUARDRAIL +
  " You are extracting structured case data from court/legal documents a self-represented person uploaded. " +
  "Respond ONLY with minified JSON matching this TypeScript type: " +
  "{title?:string,jurisdiction?:string,caseType?:string,role?:string,caseNumber?:string,hearingDate?:string," +
  "summary?:string,desiredOutcome?:string,charges?:string,parties?:{name?:string,role?:string,notes?:string}[]," +
  "timeline?:{date?:string,description?:string}[],deadlines?:{title?:string,date?:string,detail?:string}[]," +
  "claims?:{name?:string,byParty?:string,elements?:{text?:string}[]}[]}. " +
  "Rules: caseType must be one of " +
  CASE_TYPES.join("/") +
  ". role (the self-represented user's role, infer if possible) one of " +
  ROLES.join("/") +
  ". Use ISO dates YYYY-MM-DD for hearingDate, timeline dates, and deadlines when a real date is present; " +
  "omit the field if unknown. For claims, list each cause of action/charge and break it into the legal ELEMENTS " +
  "the named party must prove. Only include facts present in the documents — never invent case numbers, dates, or parties. " +
  "Omit any field you cannot determine.";

/** Analyze extracted document text into a partial CaseFile ready to merge. */
export async function analyzeDocuments(
  combinedText: string,
  existing: CaseFile
): Promise<Partial<CaseFile>> {
  const prompt =
    `EXISTING CASE CONTEXT (may be partial — fill gaps, do not contradict):\n` +
    `Title: ${existing.title || "(none)"}; Jurisdiction: ${existing.jurisdiction || "(none)"}; ` +
    `Type: ${existing.caseType}; Role: ${existing.role}\n\n` +
    `DOCUMENT TEXT (may be OCR'd, may contain noise):\n"""${combinedText.slice(0, 24000)}"""\n\n` +
    `Extract the structured case data as JSON.`;

  const data = await callGeminiJSON<ExtractedCase>(prompt, INTAKE_SYSTEM);

  const caseType = (CASE_TYPES as string[]).includes(data.caseType ?? "")
    ? (data.caseType as CaseType)
    : undefined;
  const role = (ROLES as string[]).includes(data.role ?? "")
    ? (data.role as CaseRole)
    : undefined;

  const claims: LegalClaim[] | undefined = data.claims?.length
    ? data.claims.map((cl) => ({
        id: uid(),
        name: cl.name?.trim() || "Untitled claim",
        byParty: cl.byParty?.trim() || "",
        elements: (cl.elements ?? [])
          .filter((el) => el.text?.trim())
          .map((el) => ({
            id: uid(),
            text: el.text!.trim(),
            status: "unaddressed" as const,
            evidenceIds: [],
            notes: "",
          })),
      }))
    : undefined;

  const patch: Partial<CaseFile> = {
    title: data.title?.trim() || undefined,
    jurisdiction: data.jurisdiction?.trim() || undefined,
    caseType,
    role,
    caseNumber: data.caseNumber?.trim() || undefined,
    hearingDate: data.hearingDate?.trim() || undefined,
    summary: data.summary?.trim() || undefined,
    desiredOutcome: data.desiredOutcome?.trim() || undefined,
    charges: data.charges?.trim() || undefined,
    parties: data.parties
      ?.filter((p) => p.name?.trim() || p.role?.trim())
      .map((p) => ({
        id: uid(),
        name: p.name?.trim() || "",
        role: p.role?.trim() || "",
        notes: p.notes?.trim() || "",
      })),
    timeline: data.timeline
      ?.filter((t) => t.description?.trim())
      .map((t) => ({ id: uid(), date: t.date?.trim() || "", description: t.description!.trim() })),
    deadlines: data.deadlines
      ?.filter((d) => d.title?.trim())
      .map((d) => ({
        id: uid(),
        title: d.title!.trim(),
        date: d.date?.trim() || "",
        detail: d.detail?.trim() || "",
        done: false,
        source: "ai" as const,
      })),
    claims,
  };
  return patch;
}
