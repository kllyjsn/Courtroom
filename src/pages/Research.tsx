import { useState } from "react";
import { Search, Sparkles, ExternalLink, BookmarkPlus } from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { useSettings } from "../store/useSettings";
import {
  buildCaseContext,
  callPerplexity,
  MissingKeyError,
  type ResearchResult,
} from "../lib/ai";
import { PageHeader, KeyWarning, ErrorNote, Spinner, Disclaimer } from "../components/common";
import Markdown from "../components/Markdown";

export default function Research() {
  const c = useCaseStore((s) => s.caseFile);
  const saveDraft = useCaseStore((s) => s.saveDraft);
  const hasKey = useSettings((s) => !!s.perplexityKey);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [saved, setSaved] = useState(false);

  const presets = [
    {
      label: "Relevant law & rules",
      q: `What laws, statutes, and court rules are most relevant to this matter? List them with names/numbers and a one-line explanation of each, and tell me where to read the official text.`,
    },
    {
      label: "Elements the other side must prove",
      q: `Break down the legal "elements" the other side must prove to win this type of case, and what facts would defeat each element.`,
    },
    {
      label: "Possible defenses",
      q: `What defenses or counter-arguments are typically available to someone in my position for this type of matter? Explain when each applies.`,
    },
    {
      label: "Deadlines & procedure",
      q: `What are the typical procedural steps and deadlines (filing a response, discovery, evidence exchange) for this type of case in my jurisdiction, and what happens if a deadline is missed?`,
    },
  ];

  async function run(userQuery: string) {
    if (!userQuery.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSaved(false);
    const prompt = `CASE FILE:\n${buildCaseContext(c)}\n\nRESEARCH REQUEST:\n${userQuery}\n\nAnswer with specifics for the stated jurisdiction where possible. Cite official sources (statutes, court websites). If something varies or you're unsure, say so and explain how to verify it.`;
    try {
      const res = await callPerplexity(prompt);
      setResult(res);
    } catch (e) {
      setError(
        e instanceof MissingKeyError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Something went wrong."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <PageHeader
        icon={<Search size={20} />}
        title="Legal Research"
        subtitle="Web-grounded research with citations, tailored to your case. Powered by Perplexity."
      />

      {!hasKey && (
        <div className="mb-5">
          <KeyWarning provider="Perplexity" />
        </div>
      )}

      <div className="card p-5">
        <label className="label">Ask a research question</label>
        <textarea
          className="input min-h-[90px] resize-y"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="e.g. In California small claims, can a landlord keep my deposit for normal wear and tear?"
        />
        <div className="mt-3 flex flex-wrap gap-2">
          {presets.map((p) => (
            <button
              key={p.label}
              onClick={() => {
                setQuery(p.q);
                run(p.q);
              }}
              disabled={loading || !hasKey}
              className="chip hover:border-brass-400/50 hover:text-brass-200 disabled:opacity-50"
            >
              <Sparkles size={13} /> {p.label}
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end">
          <button
            onClick={() => run(query)}
            disabled={loading || !hasKey || !query.trim()}
            className="btn-primary"
          >
            <Search size={16} /> Research
          </button>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        {loading && (
          <div className="card p-5">
            <Spinner label="Researching the law and checking sources…" />
          </div>
        )}
        {error && <ErrorNote message={error} />}
        {result && (
          <div className="card animate-fade-in p-5">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-ink-50">Findings</h2>
              <button
                onClick={() => {
                  const cites = result.citations.length
                    ? "\n\nSources:\n" +
                      result.citations.map((u, i) => `[${i + 1}] ${u}`).join("\n")
                    : "";
                  saveDraft({
                    kind: "research",
                    title: query.slice(0, 80) || "Research",
                    content: result.content + cites,
                  });
                  setSaved(true);
                }}
                className="btn-ghost !py-1.5"
              >
                <BookmarkPlus size={15} /> {saved ? "Saved" : "Save"}
              </button>
            </div>
            <Markdown text={result.content} />
            {result.citations.length > 0 && (
              <div className="mt-5 border-t border-ink-800 pt-4">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
                  Sources
                </h3>
                <ol className="space-y-1.5">
                  {result.citations.map((url, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm">
                      <span className="text-ink-500">[{i + 1}]</span>
                      <a
                        href={url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="flex items-center gap-1 break-all text-brass-300 hover:underline"
                      >
                        {url}
                        <ExternalLink size={12} className="shrink-0" />
                      </a>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            <Disclaimer />
          </div>
        )}
      </div>
    </div>
  );
}
