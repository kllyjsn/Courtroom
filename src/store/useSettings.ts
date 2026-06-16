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

export const useSettings = create<SettingsState>()(
  persist(
    (set) => ({
      geminiKey: "",
      perplexityKey: "",
      geminiModel: "gemini-2.0-flash",
      disclaimerAccepted: false,
      setGeminiKey: (k) => set({ geminiKey: k.trim() }),
      setPerplexityKey: (k) => set({ perplexityKey: k.trim() }),
      setGeminiModel: (m) => set({ geminiModel: m }),
      acceptDisclaimer: () => set({ disclaimerAccepted: true }),
    }),
    { name: "prose-settings" }
  )
);
