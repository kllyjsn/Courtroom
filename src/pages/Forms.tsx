import { useState } from "react";
import { FileSignature, Wand2, Download, Tags, FolderArchive, Sparkles } from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { useSettings } from "../store/useSettings";
import { buildCaseContext, streamGemini, LEGAL_GUARDRAIL, MissingKeyError } from "../lib/ai";
import { buildLegalDocPdf, buildExhibitBinderPdf, downloadBlob } from "../lib/pdf";
import { PageHeader, KeyWarning, ErrorNote, Spinner, Disclaimer } from "../components/common";
import { demoFormBody } from "../lib/demo";

const DOC_TYPES = [
  {
    id: "motion-dismiss",
    label: "Motion to Dismiss",
    instruction:
      "Draft a Motion to Dismiss with: introduction, statement of facts, legal standard, argument (with placeholders [STATUTE] where a specific citation is needed), and a conclusion/prayer for relief.",
  },
  {
    id: "answer",
    label: "Answer / Response",
    instruction:
      "Draft an Answer responding to the claims: admit/deny structure for each allegation, affirmative defenses, and a prayer for relief.",
  },
  {
    id: "declaration",
    label: "Declaration / Affidavit",
    instruction:
      "Draft a sworn Declaration in numbered paragraphs stating first-hand facts from the case, ending with a signature/perjury line.",
  },
  {
    id: "continuance",
    label: "Request for Continuance",
    instruction:
      "Draft a short Request/Motion for Continuance explaining good cause and the new proposed date placeholder.",
  },
  {
    id: "fee-waiver",
    label: "Fee Waiver Request",
    instruction:
      "Draft a Request to Waive Court Fees explaining inability to pay, with placeholders for income details.",
  },
];

export default function Forms() {
  const c = useCaseStore((s) => s.caseFile);
  const assignExhibitLabels = useCaseStore((s) => s.assignExhibitLabels);
  const hasKey = useSettings((s) => !!s.geminiKey || !!s.proxyUrl);

  const [docType, setDocType] = useState(DOC_TYPES[0].id);
  const [body, setBody] = useState("");
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = DOC_TYPES.find((d) => d.id === docType)!;

  async function generate() {
    setGenerating(true);
    setError(null);
    setBody("");
    const prompt =
      `CASE FILE:\n${buildCaseContext(c)}\n\n` +
      `${selected.instruction}\n\n` +
      `Write only the body of the document (no court caption — that is added automatically). ` +
      `Use clear headings and numbered paragraphs where appropriate. Where a specific legal citation ` +
      `is required but not certain for this jurisdiction, insert a bracketed placeholder like ` +
      `[CITE STATUTE] instead of inventing one.`;
    try {
      await streamGemini(
        prompt,
        (chunk) => setBody((b) => b + chunk),
        LEGAL_GUARDRAIL
      );
    } catch (e) {
      setError(
        e instanceof MissingKeyError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Generation failed."
      );
    } finally {
      setGenerating(false);
    }
  }

  async function downloadDoc() {
    if (!body.trim()) return;
    const blob = await buildLegalDocPdf(c, selected.label, body);
    downloadBlob(blob, `${selected.id}-${(c.title || "case").replace(/\s+/g, "-")}.pdf`);
  }

  async function downloadBinder() {
    const blob = await buildExhibitBinderPdf(c);
    downloadBlob(blob, `exhibit-binder-${(c.title || "case").replace(/\s+/g, "-")}.pdf`);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FileSignature size={20} />}
        title="Court Forms & Exhibits"
        subtitle="Generate court-ready document drafts with a proper caption, and assemble a labeled exhibit binder — all exported as PDF."
      />

      {!hasKey && <KeyWarning provider="Gemini" />}

      <section className="card p-5">
        <h2 className="mb-3 text-lg font-semibold text-ink-50">Document drafter</h2>
        <div className="flex flex-wrap items-end gap-3">
          <div className="min-w-[220px] flex-1">
            <label className="label">Document type</label>
            <select className="input" value={docType} onChange={(e) => setDocType(e.target.value)}>
              {DOC_TYPES.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.label}
                </option>
              ))}
            </select>
          </div>
          <button onClick={() => { setDocType("declaration"); setBody(demoFormBody); }} className="btn-ghost">
            <Sparkles size={16} /> Simulate
          </button>
          <button onClick={generate} disabled={generating || !hasKey} className="btn-primary">
            <Wand2 size={16} /> {generating ? "Drafting…" : "Draft with AI"}
          </button>
        </div>

        {error && <div className="mt-4"><ErrorNote message={error} /></div>}
        {generating && !body && (
          <div className="mt-4">
            <Spinner label="Drafting your document…" />
          </div>
        )}

        <label className="label mt-4">Document body (editable)</label>
        <textarea
          className="input min-h-[260px] resize-y font-mono text-sm"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Generate a draft above, or write/paste your own. The court caption (parties, case number) is added automatically from your case file when you export."
        />
        <div className="mt-3 flex justify-end">
          <button onClick={downloadDoc} disabled={!body.trim()} className="btn-primary">
            <Download size={16} /> Download as PDF
          </button>
        </div>
        <p className="mt-3 text-xs text-ink-400">
          The PDF adds a caption from your case file. These are <strong>drafts to adapt</strong>, not
          official court forms — check your court's required form numbers and local formatting rules
          before filing.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 flex items-center gap-2 text-lg font-semibold text-ink-50">
          <FolderArchive size={18} className="text-brass-300" /> Exhibit binder
        </h2>
        <p className="mb-3 text-sm text-ink-400">
          Turns your evidence into an indexed binder with a cover page and a labeled separator sheet
          for each exhibit.
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <button onClick={assignExhibitLabels} disabled={c.evidence.length === 0} className="btn-ghost">
            <Tags size={16} /> Auto-label exhibits (A, B, C…)
          </button>
          <button onClick={downloadBinder} disabled={c.evidence.length === 0} className="btn-primary">
            <Download size={16} /> Download binder PDF
          </button>
        </div>
        {c.evidence.length === 0 ? (
          <p className="mt-3 text-sm text-ink-500">Add evidence in Case Builder to build a binder.</p>
        ) : (
          <ul className="mt-4 space-y-1.5 text-sm text-ink-200">
            {c.evidence.map((e, i) => (
              <li key={e.id} className="flex items-center gap-2">
                <span className="chip">Exhibit {e.exhibitId || String.fromCharCode(65 + (i % 26))}</span>
                <span className="truncate">{e.label || "(untitled)"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Disclaimer />
    </div>
  );
}
