import { useState } from "react";
import {
  Search,
  Sparkles,
  ExternalLink,
  BookmarkPlus,
  ShieldCheck,
  ShieldQuestion,
  ShieldAlert,
  BadgeCheck,
} from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { useSettings } from "../store/useSettings";
import {
  buildCaseContext,
  callPerplexity,
  MissingKeyError,
  type ResearchResult,
} from "../lib/ai";
import { extractAuthorities, verifyAuthorities } from "../lib/citations";
import type { Authority } from "../lib/types";
import { demoResearch, demoAuthorities } from "../lib/demo";
import { PageHeader, KeyWarning, ErrorNote, Spinner, Disclaimer } from "../components/common";
import Markdown from "../components/Markdown";

export default function Research() {
  const c = useCaseStore((s) => s.caseFile);
  const saveDraft = useCaseStore((s) => s.saveDraft);
  const hasKey = useSettings((s) => !!s.perplexityKey || !!s.proxyUrl);

  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ResearchResult | null>(null);
  const [saved, setSaved] = useState(false);
  const [authorities, setAuthorities] = useState<Authority[] | null>(null);
  const [verifying, setVerifying] = useState(false);

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
    setAuthorities(null);
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

  async function verify() {
    if (!result) return;
    const found = extractAuthorities(result.content);
    if (found.length === 0) {
      setAuthorities([]);
      return;
    }
    setVerifying(true);
    setAuthorities(found.map((citation) => ({
      id: citation,
      citation,
      url: "",
      quote: "",
      status: "unverified" as const,
      note: "Checking…",
    })));
    try {
      const ctx = `${c.jurisdiction} ${c.caseType}`.trim();
      const verified = await verifyAuthorities(found, ctx, (a) => {
        setAuthorities((prev) =>
          prev ? prev.map((p) => (p.citation === a.citation ? a : p)) : prev
        );
      });
      setAuthorities(verified);
    } finally {
      setVerifying(false);
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
            onClick={() => {
              setResult(demoResearch);
              setAuthorities(demoAuthorities);
              setQuery("Relevant law & rules (simulated)");
            }}
            className="btn-ghost"
          >
            <Sparkles size={16} /> Simulate
          </button>
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

            <CitationVerifier
              authorities={authorities}
              verifying={verifying}
              onVerify={verify}
            />

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

function CitationVerifier({
  authorities,
  verifying,
  onVerify,
}: {
  authorities: Authority[] | null;
  verifying: boolean;
  onVerify: () => void;
}) {
  const counts = authorities
    ? {
        verified: authorities.filter((a) => a.status === "verified").length,
        failed: authorities.filter((a) => a.status === "failed").length,
        unverified: authorities.filter((a) => a.status === "unverified").length,
      }
    : null;

  return (
    <div className="mt-5 border-t border-ink-800 pt-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h3 className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-400">
          <BadgeCheck size={14} /> Citation check
        </h3>
        <button onClick={onVerify} disabled={verifying} className="btn-ghost !py-1.5 text-xs">
          {verifying ? "Verifying…" : authorities ? "Re-check citations" : "Verify cited authorities"}
        </button>
      </div>
      <p className="mt-1 text-xs text-ink-500">
        AI can cite statutes that don't exist. This independently re-checks each cited authority
        against the web.
      </p>

      {authorities && authorities.length === 0 && (
        <p className="mt-3 text-sm text-ink-400">
          No specific statutes, rules, or cases were detected in the answer to verify.
        </p>
      )}

      {counts && authorities!.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-3 text-xs">
          <span className="text-emerald-300">{counts.verified} verified</span>
          <span className="text-red-300">{counts.failed} unconfirmed</span>
          {counts.unverified > 0 && (
            <span className="text-ink-400">{counts.unverified} pending/errored</span>
          )}
        </div>
      )}

      {authorities && authorities.length > 0 && (
        <ul className="mt-3 space-y-2">
          {authorities.map((a) => {
            const Icon =
              a.status === "verified"
                ? ShieldCheck
                : a.status === "failed"
                  ? ShieldAlert
                  : ShieldQuestion;
            const tone =
              a.status === "verified"
                ? "text-emerald-300"
                : a.status === "failed"
                  ? "text-red-300"
                  : "text-ink-400";
            return (
              <li key={a.id} className="rounded-xl border border-ink-800 p-3 text-sm">
                <div className="flex items-start gap-2">
                  <Icon size={16} className={`mt-0.5 shrink-0 ${tone}`} />
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-ink-100">{a.citation}</div>
                    {a.note && <div className={`text-xs ${tone}`}>{a.note}</div>}
                    {a.quote && (
                      <div className="mt-1 border-l-2 border-ink-700 pl-2 text-xs italic text-ink-300">
                        “{a.quote}”
                      </div>
                    )}
                    {a.url && (
                      <a
                        href={a.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="mt-1 inline-flex items-center gap-1 break-all text-xs text-brass-300 hover:underline"
                      >
                        {a.url}
                        <ExternalLink size={11} className="shrink-0" />
                      </a>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
