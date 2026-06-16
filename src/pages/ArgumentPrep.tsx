import { useRef, useState } from "react";
import { Gavel, Sword, ShieldHalf, FileText, BookmarkPlus, Square, Sparkles } from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { useSettings } from "../store/useSettings";
import { buildCaseContext, streamGemini, MissingKeyError } from "../lib/ai";
import { PageHeader, KeyWarning, ErrorNote, Spinner, Disclaimer } from "../components/common";
import Markdown from "../components/Markdown";
import { demoArgument } from "../lib/demo";

type Mode = "argument" | "rebuttal" | "motion";

const MOTIONS = [
  "Motion to dismiss",
  "Motion for continuance (postponement)",
  "Motion to compel discovery",
  "Motion in limine (exclude evidence)",
  "Motion for default judgment",
  "Request to waive court fees (fee waiver)",
  "Motion to set aside / vacate judgment",
];

export default function ArgumentPrep() {
  const c = useCaseStore((s) => s.caseFile);
  const saveDraft = useCaseStore((s) => s.saveDraft);
  const hasKey = useSettings((s) => !!s.geminiKey || !!s.proxyUrl);

  const [mode, setMode] = useState<Mode>("argument");
  const [motionType, setMotionType] = useState(MOTIONS[0]);
  const [extra, setExtra] = useState("");
  const [output, setOutput] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  function buildPrompt(): string {
    const ctx = `CASE FILE:\n${buildCaseContext(c)}`;
    const note = extra.trim() ? `\n\nAdditional instructions: ${extra.trim()}` : "";
    if (mode === "argument") {
      return `${ctx}${note}\n\nTASK: Build a clear, persuasive argument outline I can use to present my side. Include: (1) a one-sentence theory of the case, (2) the key points in logical order with the facts/evidence that support each, (3) which legal elements each point addresses, and (4) a strong closing ask. Use plain language and headings.`;
    }
    if (mode === "rebuttal") {
      return `${ctx}${note}\n\nTASK: Anticipate the strongest arguments the OTHER side will make against me. For each, give: the argument, why it's persuasive, and my best factual/legal rebuttal. Then list likely tough questions a judge might ask me and how to answer them honestly and effectively.`;
    }
    return `${ctx}${note}\n\nTASK: Draft a "${motionType}" appropriate for a self-represented litigant. Provide: (1) a plain-language explanation of what this motion does and when it's appropriate, (2) a fill-in-the-blank template with [BRACKETED] placeholders for court caption, parties, and case number, (3) the factual and legal grounds tailored to my case, and (4) a short checklist for filing and serving it. Remind me to check local formatting rules.`;
  }

  async function generate() {
    setLoading(true);
    setError(null);
    setOutput("");
    setSaved(false);
    const controller = new AbortController();
    abortRef.current = controller;
    try {
      await streamGemini(
        buildPrompt(),
        (chunk) => setOutput((prev) => prev + chunk),
        undefined,
        controller.signal
      );
    } catch (e) {
      if (controller.signal.aborted) {
        /* user stopped */
      } else {
        setError(
          e instanceof MissingKeyError
            ? e.message
            : e instanceof Error
              ? e.message
              : "Something went wrong."
        );
      }
    } finally {
      setLoading(false);
      abortRef.current = null;
    }
  }

  const TABS: { id: Mode; label: string; icon: React.ReactNode }[] = [
    { id: "argument", label: "My argument", icon: <Sword size={16} /> },
    { id: "rebuttal", label: "Anticipate & rebut", icon: <ShieldHalf size={16} /> },
    { id: "motion", label: "Draft a motion", icon: <FileText size={16} /> },
  ];

  return (
    <div>
      <PageHeader
        icon={<Gavel size={20} />}
        title="Arguments & Motions"
        subtitle="Turn your case file into a structured argument, anticipate the other side, and draft filings. Powered by Gemini."
      />

      {!hasKey && (
        <div className="mb-5">
          <KeyWarning provider="Gemini" />
        </div>
      )}

      <div className="card p-5">
        <div className="mb-4 flex flex-wrap gap-2">
          {TABS.map((t) => (
            <button
              key={t.id}
              onClick={() => setMode(t.id)}
              className={`flex items-center gap-2 rounded-xl px-3.5 py-2 text-sm font-medium transition-colors ${
                mode === t.id
                  ? "bg-brass-400/15 text-brass-200"
                  : "bg-ink-800/60 text-ink-300 hover:text-ink-100"
              }`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </div>

        {mode === "motion" && (
          <div className="mb-4">
            <label className="label">Motion type</label>
            <select
              className="input"
              value={motionType}
              onChange={(e) => setMotionType(e.target.value)}
            >
              {MOTIONS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}

        <label className="label">Anything specific to add? (optional)</label>
        <textarea
          className="input min-h-[70px] resize-y"
          value={extra}
          onChange={(e) => setExtra(e.target.value)}
          placeholder="e.g. Focus on the missing signature; emphasize that I was never served"
        />

        <div className="mt-4 flex justify-end gap-2">
          {loading && (
            <button
              onClick={() => abortRef.current?.abort()}
              className="btn-ghost"
            >
              <Square size={14} /> Stop
            </button>
          )}
          <button
            onClick={() => setOutput(demoArgument)}
            className="btn-ghost"
          >
            <Sparkles size={16} /> Simulate
          </button>
          <button
            onClick={generate}
            disabled={loading || !hasKey}
            className="btn-primary"
          >
            <Gavel size={16} /> Generate
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {error && <ErrorNote message={error} />}
        {(output || loading) && (
          <div className="card animate-fade-in p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-50">Draft</h2>
              {output && !loading && (
                <button
                  onClick={() => {
                    saveDraft({
                      kind: mode === "motion" ? "motion" : "arguments",
                      title:
                        mode === "motion"
                          ? motionType
                          : mode === "argument"
                            ? "Argument outline"
                            : "Rebuttals & Q&A",
                      content: output,
                    });
                    setSaved(true);
                  }}
                  className="btn-ghost !py-1.5"
                >
                  <BookmarkPlus size={15} /> {saved ? "Saved" : "Save"}
                </button>
              )}
            </div>
            {output ? <Markdown text={output} /> : <Spinner label="Drafting…" />}
            <Disclaimer />
          </div>
        )}
      </div>
    </div>
  );
}
