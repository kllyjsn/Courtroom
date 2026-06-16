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
  updatedAt: number;
}

export interface SavedDraft {
  id: string;
  kind: "research" | "arguments" | "motion";
  title: string;
  content: string;
  createdAt: number;
}
