import { useRef, useState } from "react";
import {
  FileUp,
  FileText,
  Trash2,
  Sparkles,
  Wand2,
  CheckCircle2,
} from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { useSettings } from "../store/useSettings";
import { extractTextFromFile, type ExtractProgress } from "../lib/extract";
import { analyzeDocuments } from "../lib/intake";
import { MissingKeyError } from "../lib/ai";
import type { CaseFile } from "../lib/types";
import { PageHeader, KeyWarning, ErrorNote, Spinner, Disclaimer } from "../components/common";

function summarizePatch(p: Partial<CaseFile>): string[] {
  const out: string[] = [];
  const scalar: [keyof CaseFile, string][] = [
    ["title", "Title"],
    ["jurisdiction", "Jurisdiction"],
    ["caseType", "Case type"],
    ["role", "Your role"],
    ["caseNumber", "Case number"],
    ["hearingDate", "Hearing date"],
    ["desiredOutcome", "Desired outcome"],
    ["charges", "Charges/claims"],
  ];
  for (const [k, label] of scalar) {
    const v = p[k];
    if (typeof v === "string" && v.trim()) out.push(`${label}: ${v}`);
  }
  if (p.summary?.trim()) out.push("Summary of what happened");
  if (p.parties?.length) out.push(`${p.parties.length} parties`);
  if (p.timeline?.length) out.push(`${p.timeline.length} timeline events`);
  if (p.deadlines?.length) out.push(`${p.deadlines.length} deadlines`);
  if (p.claims?.length)
    out.push(
      `${p.claims.length} claims (${p.claims.reduce((n, c) => n + c.elements.length, 0)} elements)`
    );
  return out;
}

export default function Documents() {
  const c = useCaseStore((s) => s.caseFile);
  const addDocument = useCaseStore((s) => s.addDocument);
  const removeDocument = useCaseStore((s) => s.removeDocument);
  const mergeExtraction = useCaseStore((s) => s.mergeExtraction);
  const hasKey = useSettings((s) => !!s.geminiKey);

  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [patch, setPatch] = useState<Partial<CaseFile> | null>(null);
  const [applied, setApplied] = useState(false);

  async function onFiles(files: FileList | null) {
    if (!files?.length) return;
    setError(null);
    for (const file of Array.from(files)) {
      try {
        setBusy(`Reading ${file.name}…`);
        const text = await extractTextFromFile(file, (p: ExtractProgress) =>
          setBusy(`${file.name}: ${p.stage}`)
        );
        if (!text.trim()) {
          setError(
            `No text could be extracted from ${file.name}. If it's a scanned PDF, try exporting each page as an image.`
          );
          continue;
        }
        addDocument({ name: file.name, kind: file.type || "file", text });
      } catch (e) {
        setError(e instanceof Error ? e.message : `Failed to read ${file.name}.`);
      }
    }
    setBusy(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  async function analyze() {
    setAnalyzing(true);
    setError(null);
    setPatch(null);
    setApplied(false);
    try {
      const combined = c.documents
        .map((d) => `=== ${d.name} ===\n${d.text}`)
        .join("\n\n");
      const result = await analyzeDocuments(combined, c);
      setPatch(result);
    } catch (e) {
      setError(
        e instanceof MissingKeyError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Analysis failed."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  function apply() {
    if (!patch) return;
    mergeExtraction(patch);
    setApplied(true);
    setPatch(null);
  }

  const changes = patch ? summarizePatch(patch) : [];

  return (
    <div>
      <PageHeader
        icon={<FileUp size={20} />}
        title="Documents & Intake"
        subtitle="Upload your complaint, summons, lease, or evidence. Pro Se reads them and builds your case file — parties, timeline, claims, and deadlines."
      />

      {!hasKey && (
        <div className="mb-5">
          <KeyWarning provider="Gemini" />
        </div>
      )}

      <div
        className="card flex flex-col items-center justify-center gap-3 border-dashed p-8 text-center"
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          onFiles(e.dataTransfer.files);
        }}
      >
        <FileUp size={28} className="text-brass-300" />
        <div className="text-sm text-ink-300">
          Drag & drop files here, or
          <button
            className="ml-1 text-brass-300 hover:underline"
            onClick={() => inputRef.current?.click()}
          >
            browse
          </button>
        </div>
        <p className="text-xs text-ink-500">
          PDF, images (OCR), and text files. Everything stays in your browser.
        </p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.webp,.bmp,.tif,.tiff,.txt,.md,.csv,application/pdf,image/*,text/*"
          className="hidden"
          onChange={(e) => onFiles(e.target.files)}
        />
      </div>

      {busy && (
        <div className="mt-4">
          <Spinner label={busy} />
        </div>
      )}
      {error && <div className="mt-4"><ErrorNote message={error} /></div>}

      {c.documents.length > 0 && (
        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-ink-50">
              Uploaded documents ({c.documents.length})
            </h2>
            <button
              onClick={analyze}
              disabled={analyzing || !hasKey}
              className="btn-primary"
            >
              <Wand2 size={16} /> {analyzing ? "Analyzing…" : "Build my case from these"}
            </button>
          </div>
          {c.documents.map((d) => (
            <div
              key={d.id}
              className="flex items-start gap-3 rounded-xl border border-ink-800 p-3"
            >
              <FileText size={18} className="mt-0.5 shrink-0 text-brass-300" />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-ink-100">{d.name}</div>
                <div className="text-xs text-ink-500">
                  {d.text.length.toLocaleString()} characters extracted
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-ink-400">{d.text.slice(0, 240)}</p>
              </div>
              <button
                onClick={() => removeDocument(d.id)}
                className="text-ink-500 hover:text-red-300"
                aria-label="Remove document"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>
      )}

      {analyzing && (
        <div className="card mt-5 p-5">
          <Spinner label="Reading your documents and extracting the case…" />
        </div>
      )}

      {patch && (
        <div className="card animate-fade-in mt-5 p-5">
          <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-ink-50">
            <Sparkles size={18} className="text-brass-300" /> Proposed case details
          </h2>
          {changes.length === 0 ? (
            <p className="text-sm text-ink-400">
              Nothing new could be extracted. Try uploading the complaint or summons.
            </p>
          ) : (
            <>
              <p className="mb-3 text-sm text-ink-400">
                Review what Pro Se found. Applying fills blank fields and appends parties, timeline,
                claims, and deadlines to your case file (it won't overwrite text you've already
                written).
              </p>
              <ul className="space-y-1.5 text-sm text-ink-200">
                {changes.map((ch, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle2 size={15} className="mt-0.5 shrink-0 text-emerald-400" />
                    <span>{ch}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-4 flex gap-2">
                <button onClick={apply} className="btn-primary">
                  Apply to case file
                </button>
                <button onClick={() => setPatch(null)} className="btn-ghost">
                  Discard
                </button>
              </div>
            </>
          )}
        </div>
      )}

      {applied && (
        <div className="mt-5 flex items-center gap-2 rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          <CheckCircle2 size={18} /> Applied to your case file. Review it in Case Builder and Case
          Theory.
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
