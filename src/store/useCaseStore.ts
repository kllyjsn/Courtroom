import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  CaseFile,
  Party,
  TimelineEvent,
  Evidence,
  SavedDraft,
} from "../lib/types";

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
  updatedAt: Date.now(),
};

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
    { name: "prose-case-file" }
  )
);
