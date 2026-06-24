import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CaseFile,
  Party,
  TimelineEvent,
  Evidence,
  SavedDraft,
  LegalClaim,
  Deadline,
  UploadedDoc,
} from "../lib/types";
import { demoCase } from "../lib/demo";

const uid = () => Math.random().toString(36).slice(2, 10);

const emptyCase: CaseFile = {
  title: "",
  jurisdiction: "",
  caseType: "small-claims",
  role: "defendant",
  caseNumber: "",
  hearingDate: "",
  summary: "",
  desiredOutcome: "",
  charges: "",
  parties: [],
  timeline: [],
  evidence: [],
  claims: [],
  deadlines: [],
  documents: [],
  updatedAt: Date.now(),
};

/** Ensure a (possibly older / partial) persisted case file has every array field. */
function normalizeCase(c: Partial<CaseFile> | undefined): CaseFile {
  return {
    ...emptyCase,
    ...c,
    parties: c?.parties ?? [],
    timeline: c?.timeline ?? [],
    evidence: c?.evidence ?? [],
    claims: c?.claims ?? [],
    deadlines: c?.deadlines ?? [],
    documents: c?.documents ?? [],
  };
}

interface CaseState {
  caseFile: CaseFile;
  drafts: SavedDraft[];
  updateCase: (patch: Partial<CaseFile>) => void;
  resetCase: () => void;

  addParty: () => void;
  updateParty: (id: string, patch: Partial<Party>) => void;
  removeParty: (id: string) => void;

  addEvent: () => void;
  updateEvent: (id: string, patch: Partial<TimelineEvent>) => void;
  removeEvent: (id: string) => void;

  addEvidence: () => void;
  updateEvidence: (id: string, patch: Partial<Evidence>) => void;
  removeEvidence: (id: string) => void;
  assignExhibitLabels: () => void;

  setClaims: (claims: LegalClaim[]) => void;
  updateElement: (
    claimId: string,
    elementId: string,
    patch: Partial<LegalClaim["elements"][number]>
  ) => void;

  setDeadlines: (deadlines: Deadline[]) => void;
  addDeadline: (d: Omit<Deadline, "id">) => void;
  updateDeadline: (id: string, patch: Partial<Deadline>) => void;
  removeDeadline: (id: string) => void;

  addDocument: (doc: Omit<UploadedDoc, "id" | "addedAt">) => void;
  removeDocument: (id: string) => void;

  /** Merge AI-extracted fields into the case file (append lists, fill blanks). */
  mergeExtraction: (patch: Partial<CaseFile>) => void;

  /** Load a fully-populated demo case for showcasing the app. */
  loadDemo: () => void;

  saveDraft: (draft: Omit<SavedDraft, "id" | "createdAt">) => void;
  removeDraft: (id: string) => void;
}

export const useCaseStore = create<CaseState>()(
  persist(
    (set) => ({
      caseFile: emptyCase,
      drafts: [],

      updateCase: (patch) =>
        set((s) => ({
          caseFile: { ...s.caseFile, ...patch, updatedAt: Date.now() },
        })),

      resetCase: () => set({ caseFile: { ...emptyCase, updatedAt: Date.now() } }),

      addParty: () =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            parties: [
              ...s.caseFile.parties,
              { id: uid(), name: "", role: "", notes: "" },
            ],
            updatedAt: Date.now(),
          },
        })),
      updateParty: (id, patch) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            parties: s.caseFile.parties.map((p) =>
              p.id === id ? { ...p, ...patch } : p
            ),
            updatedAt: Date.now(),
          },
        })),
      removeParty: (id) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            parties: s.caseFile.parties.filter((p) => p.id !== id),
            updatedAt: Date.now(),
          },
        })),

      addEvent: () =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            timeline: [
              ...s.caseFile.timeline,
              { id: uid(), date: "", description: "" },
            ],
            updatedAt: Date.now(),
          },
        })),
      updateEvent: (id, patch) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            timeline: s.caseFile.timeline.map((e) =>
              e.id === id ? { ...e, ...patch } : e
            ),
            updatedAt: Date.now(),
          },
        })),
      removeEvent: (id) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            timeline: s.caseFile.timeline.filter((e) => e.id !== id),
            updatedAt: Date.now(),
          },
        })),

      addEvidence: () =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            evidence: [
              ...s.caseFile.evidence,
              {
                id: uid(),
                label: "",
                type: "document",
                description: "",
                supports: "",
              },
            ],
            updatedAt: Date.now(),
          },
        })),
      updateEvidence: (id, patch) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            evidence: s.caseFile.evidence.map((e) =>
              e.id === id ? { ...e, ...patch } : e
            ),
            updatedAt: Date.now(),
          },
        })),
      removeEvidence: (id) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            evidence: s.caseFile.evidence.filter((e) => e.id !== id),
            updatedAt: Date.now(),
          },
        })),

      assignExhibitLabels: () =>
        set((s) => {
          const letters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          return {
            caseFile: {
              ...s.caseFile,
              evidence: s.caseFile.evidence.map((e, i) => ({
                ...e,
                exhibitId:
                  i < 26 ? letters[i] : `${letters[Math.floor(i / 26) - 1]}${letters[i % 26]}`,
              })),
              updatedAt: Date.now(),
            },
          };
        }),

      setClaims: (claims) =>
        set((s) => ({ caseFile: { ...s.caseFile, claims, updatedAt: Date.now() } })),
      updateElement: (claimId, elementId, patch) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            claims: s.caseFile.claims.map((cl) =>
              cl.id === claimId
                ? {
                    ...cl,
                    elements: cl.elements.map((el) =>
                      el.id === elementId ? { ...el, ...patch } : el
                    ),
                  }
                : cl
            ),
            updatedAt: Date.now(),
          },
        })),

      setDeadlines: (deadlines) =>
        set((s) => ({ caseFile: { ...s.caseFile, deadlines, updatedAt: Date.now() } })),
      addDeadline: (d) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            deadlines: [...s.caseFile.deadlines, { ...d, id: uid() }],
            updatedAt: Date.now(),
          },
        })),
      updateDeadline: (id, patch) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            deadlines: s.caseFile.deadlines.map((d) =>
              d.id === id ? { ...d, ...patch } : d
            ),
            updatedAt: Date.now(),
          },
        })),
      removeDeadline: (id) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            deadlines: s.caseFile.deadlines.filter((d) => d.id !== id),
            updatedAt: Date.now(),
          },
        })),

      addDocument: (doc) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            documents: [
              ...s.caseFile.documents,
              { ...doc, id: uid(), addedAt: Date.now() },
            ],
            updatedAt: Date.now(),
          },
        })),
      removeDocument: (id) =>
        set((s) => ({
          caseFile: {
            ...s.caseFile,
            documents: s.caseFile.documents.filter((d) => d.id !== id),
            updatedAt: Date.now(),
          },
        })),

      mergeExtraction: (patch) =>
        set((s) => {
          const c = s.caseFile;
          const fillStr = (cur: string, next?: string) =>
            cur && cur.trim() ? cur : next ?? cur;
          return {
            caseFile: {
              ...c,
              title: fillStr(c.title, patch.title),
              jurisdiction: fillStr(c.jurisdiction, patch.jurisdiction),
              caseType: c.caseType || patch.caseType || c.caseType,
              role: c.role || patch.role || c.role,
              caseNumber: fillStr(c.caseNumber, patch.caseNumber),
              hearingDate: fillStr(c.hearingDate, patch.hearingDate),
              summary: fillStr(c.summary, patch.summary),
              desiredOutcome: fillStr(c.desiredOutcome, patch.desiredOutcome),
              charges: fillStr(c.charges, patch.charges),
              parties: [
                ...c.parties,
                ...(patch.parties ?? []).map((p) => ({ ...p, id: uid() })),
              ],
              timeline: [
                ...c.timeline,
                ...(patch.timeline ?? []).map((t) => ({ ...t, id: uid() })),
              ],
              evidence: [
                ...c.evidence,
                ...(patch.evidence ?? []).map((e) => ({ ...e, id: uid() })),
              ],
              claims: patch.claims?.length ? patch.claims : c.claims,
              deadlines: [
                ...c.deadlines,
                ...(patch.deadlines ?? []).map((d) => ({ ...d, id: uid() })),
              ],
              updatedAt: Date.now(),
            },
          };
        }),

      loadDemo: () => set({ caseFile: { ...demoCase, updatedAt: Date.now() } }),

      saveDraft: (draft) =>
        set((s) => ({
          drafts: [
            { ...draft, id: uid(), createdAt: Date.now() },
            ...s.drafts,
          ].slice(0, 50),
        })),
      removeDraft: (id) =>
        set((s) => ({ drafts: s.drafts.filter((d) => d.id !== id) })),
    }),
    {
      name: "prose-case-file",
      version: 2,
      migrate: (state) => {
        const s = state as { caseFile?: Partial<CaseFile>; drafts?: SavedDraft[] } | undefined;
        return {
          caseFile: normalizeCase(s?.caseFile),
          drafts: s?.drafts ?? [],
        } as CaseState;
      },
      merge: (persisted, current) => {
        const p = persisted as { caseFile?: Partial<CaseFile>; drafts?: SavedDraft[] } | undefined;
        return {
          ...current,
          caseFile: normalizeCase(p?.caseFile),
          drafts: p?.drafts ?? current.drafts,
        };
      },
    }
  )
);
