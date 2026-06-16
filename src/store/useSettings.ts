import { create } from "zustand";
import { persist } from "zustand/middleware";

interface SettingsState {
  geminiKey: string;
  perplexityKey: string;
  geminiModel: string;
  disclaimerAccepted: boolean;
  setGeminiKey: (k: string) => void;
  setPerplexityKey: (k: string) => void;
  setGeminiModel: (m: string) => void;
  acceptDisclaimer: () => void;
}

export const DEFAULT_GEMINI_MODEL = "gemini-2.5-flash";

// Models Google has retired from the Generative Language API.
const RETIRED_GEMINI_MODELS = new Set(["gemini-2.0-flash", "gemini-1.5-flash"]);

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      geminiKey: "",
      perplexityKey: "",
      geminiModel: DEFAULT_GEMINI_MODEL,
      disclaimerAccepted: false,
      setGeminiKey: (k) => set({ geminiKey: k.trim() }),
      setPerplexityKey: (k) => set({ perplexityKey: k.trim() }),
      setGeminiModel: (m) => set({ geminiModel: m }),
      acceptDisclaimer: () => set({ disclaimerAccepted: true }),
    }),
    {
      name: "prose-settings",
      version: 1,
      migrate: (state, version) => {
        const s = state as Partial<SettingsState> | undefined;
        if (version < 1 && s && RETIRED_GEMINI_MODELS.has(s.geminiModel ?? "")) {
          s.geminiModel = DEFAULT_GEMINI_MODEL;
        }
        return s as SettingsState;
      },
    }
  )
);
