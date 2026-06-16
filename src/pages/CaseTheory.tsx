import { useState } from "react";
import { Scale, Wand2, ShieldCheck, Link2 } from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { useSettings } from "../store/useSettings";
import { generateClaims } from "../lib/analysis";
import { MissingKeyError } from "../lib/ai";
import type { LegalElement } from "../lib/types";
import { PageHeader, KeyWarning, ErrorNote, Spinner, Disclaimer } from "../components/common";

const STATUS_LABEL: Record<LegalElement["status"], string> = {
  unaddressed: "Unaddressed",
  disputed: "I dispute this",
  conceded: "Not contested",
};

const STATUS_STYLE: Record<LegalElement["status"], string> = {
  unaddressed: "border-ink-700 text-ink-300",
  disputed: "border-amber-500/50 text-amber-200",
  conceded: "border-ink-700 text-ink-500",
};

export default function CaseTheory() {
  const c = useCaseStore((s) => s.caseFile);
  const setClaims = useCaseStore((s) => s.setClaims);
  const updateElement = useCaseStore((s) => s.updateElement);
  const hasKey = useSettings((s) => !!s.geminiKey);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const claims = await generateClaims(c);
      if (claims.length === 0) setError("No claims could be identified. Add more facts in Case Builder.");
      else setClaims(claims);
    } catch (e) {
      setError(
        e instanceof MissingKeyError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to generate claims."
      );
    } finally {
      setLoading(false);
    }
  }

  function toggleEvidence(claimId: string, el: LegalElement, evId: string) {
    const has = el.evidenceIds.includes(evId);
    updateElement(claimId, el.id, {
      evidenceIds: has
        ? el.evidenceIds.filter((x) => x !== evId)
        : [...el.evidenceIds, evId],
    });
  }

  const totalElements = c.claims.reduce((n, cl) => n + cl.elements.length, 0);
  const coveredElements = c.claims.reduce(
    (n, cl) => n + cl.elements.filter((e) => e.evidenceIds.length > 0 || e.status === "conceded").length,
    0
  );

  return (
    <div>
      <PageHeader
        icon={<Scale size={20} />}
        title="Case Theory"
        subtitle="Break the case into the legal elements each side must prove, then map your evidence to each one. Gaps show where you're exposed."
        action={
          <button onClick={generate} disabled={loading || !hasKey} className="btn-primary">
            <Wand2 size={16} /> {c.claims.length ? "Regenerate" : "Generate claims & elements"}
          </button>
        }
      />

      {!hasKey && (
        <div className="mb-5">
          <KeyWarning provider="Gemini" />
        </div>
      )}
      {error && <div className="mb-5"><ErrorNote message={error} /></div>}
      {loading && (
        <div className="card mb-5 p-5">
          <Spinner label="Identifying claims and their legal elements…" />
        </div>
      )}

      {c.claims.length > 0 && (
        <div className="mb-5 flex items-center gap-3 rounded-xl border border-ink-800 bg-ink-900/40 p-4">
          <ShieldCheck size={20} className="text-brass-300" />
          <div className="flex-1">
            <div className="text-sm font-medium text-ink-100">
              Evidence coverage: {coveredElements}/{totalElements} elements addressed
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-ink-800">
              <div
                className="h-full rounded-full bg-brass-400 transition-all"
                style={{ width: `${totalElements ? (coveredElements / totalElements) * 100 : 0}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {c.claims.length === 0 && !loading ? (
        <div className="card p-8 text-center text-sm text-ink-400">
          No claims yet. Generate them from your case file, or upload documents in Documents & Intake
          first.
        </div>
      ) : (
        <div className="space-y-5">
          {c.claims.map((cl) => (
            <div key={cl.id} className="card p-5">
              <div className="mb-1 flex items-center justify-between gap-3">
                <h2 className="text-lg font-semibold text-ink-50">{cl.name}</h2>
                {cl.byParty && (
                  <span className="chip shrink-0">Burden: {cl.byParty}</span>
                )}
              </div>
              <div className="mt-3 space-y-4">
                {cl.elements.map((el) => (
                  <div key={el.id} className="rounded-xl border border-ink-800 p-3">
                    <div className="flex items-start justify-between gap-3">
                      <p className="text-sm text-ink-100">{el.text}</p>
                      <select
                        className={`shrink-0 rounded-lg border bg-ink-950/60 px-2 py-1 text-xs ${STATUS_STYLE[el.status]}`}
                        value={el.status}
                        onChange={(e) =>
                          updateElement(cl.id, el.id, {
                            status: e.target.value as LegalElement["status"],
                          })
                        }
                      >
                        {(["unaddressed", "disputed", "conceded"] as const).map((s) => (
                          <option key={s} value={s}>
                            {STATUS_LABEL[s]}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="mt-2.5">
                      <div className="mb-1.5 flex items-center gap-1.5 text-xs font-medium text-ink-400">
                        <Link2 size={13} /> Evidence that addresses this element
                      </div>
                      {c.evidence.length === 0 ? (
                        <p className="text-xs text-ink-500">
                          No evidence in your case file yet. Add some in Case Builder.
                        </p>
                      ) : (
                        <div className="flex flex-wrap gap-1.5">
                          {c.evidence.map((ev) => {
                            const on = el.evidenceIds.includes(ev.id);
                            return (
                              <button
                                key={ev.id}
                                onClick={() => toggleEvidence(cl.id, el, ev.id)}
                                className={`chip text-xs ${
                                  on
                                    ? "border-brass-400/60 bg-brass-400/15 text-brass-200"
                                    : "hover:border-ink-600"
                                }`}
                              >
                                {ev.exhibitId ? `Ex. ${ev.exhibitId}: ` : ""}
                                {ev.label || "(untitled)"}
                              </button>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <input
                      className="input mt-2.5 text-sm"
                      placeholder="Your note / argument on this element…"
                      value={el.notes}
                      onChange={(e) => updateElement(cl.id, el.id, { notes: e.target.value })}
                    />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
