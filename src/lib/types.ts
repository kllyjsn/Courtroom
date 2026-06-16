export type CaseRole =
  | "defendant"
  | "plaintiff"
  | "respondent"
  | "petitioner"
  | "appellant"
  | "other";

export type CaseType =
  | "small-claims"
  | "civil"
  | "criminal-misdemeanor"
  | "traffic"
  | "landlord-tenant"
  | "family"
  | "administrative"
  | "other";

export interface Party {
  id: string;
  name: string;
  role: string; // e.g. "Opposing counsel", "Witness for plaintiff"
  notes: string;
}

export interface TimelineEvent {
  id: string;
  date: string; // free text date
  description: string;
}

export interface Evidence {
  id: string;
  label: string;
  type: "document" | "photo" | "message" | "recording" | "physical" | "other";
  description: string;
  supports: string; // which point it supports
  exhibitId?: string; // assigned exhibit label, e.g. "A"
}

/** A single legal element the other side (or you) must prove for a claim. */
export interface LegalElement {
  id: string;
  text: string;
  status: "unaddressed" | "disputed" | "conceded";
  evidenceIds: string[]; // evidence mapped to this element
  notes: string;
}

/** A cause of action / charge broken into its provable elements. */
export interface LegalClaim {
  id: string;
  name: string; // e.g. "Breach of contract"
  byParty: string; // who must prove it (e.g. "Plaintiff")
  elements: LegalElement[];
}

/** A procedural deadline or task. */
export interface Deadline {
  id: string;
  title: string;
  date: string; // YYYY-MM-DD (may be empty if unknown)
  detail: string;
  done: boolean;
  source: "ai" | "manual";
}

/** An uploaded source document with extracted text. */
export interface UploadedDoc {
  id: string;
  name: string;
  kind: string; // mime-ish label
  text: string; // extracted text
  addedAt: number;
}

/** Verification status of a legal authority cited by the AI. */
export interface Authority {
  id: string;
  citation: string; // "California Civil Code § 1950.5"
  url: string;
  quote: string;
  status: "verified" | "unverified" | "failed";
  note: string;
}

export interface CaseFile {
  title: string;
  jurisdiction: string; // free text: country / state / court
  caseType: CaseType;
  role: CaseRole;
  caseNumber: string;
  hearingDate: string;
  summary: string; // plain-language description of what happened
  desiredOutcome: string;
  charges: string; // charges or claims against / by the user
  parties: Party[];
  timeline: TimelineEvent[];
  evidence: Evidence[];
  claims: LegalClaim[];
  deadlines: Deadline[];
  documents: UploadedDoc[];
  updatedAt: number;
}

export interface SavedDraft {
  id: string;
  kind: "research" | "arguments" | "motion";
  title: string;
  content: string;
  createdAt: number;
}
