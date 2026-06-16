import { useState } from "react";
import { CalendarClock, Wand2, Plus, Trash2, CalendarArrowDown } from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { useSettings } from "../store/useSettings";
import { generateDeadlines } from "../lib/analysis";
import { MissingKeyError } from "../lib/ai";
import { buildIcs } from "../lib/ics";
import { downloadBlob } from "../lib/download";
import { PageHeader, KeyWarning, ErrorNote, Spinner, Disclaimer } from "../components/common";

function daysUntil(dateStr: string): number | null {
  const [y, m, day] = dateStr.split("-").map(Number);
  if (!y || !m || !day) return null;
  const hearing = new Date(y, m - 1, day);
  if (isNaN(hearing.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.round((hearing.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function countdownLabel(dateStr: string): { text: string; tone: string } | null {
  const d = daysUntil(dateStr);
  if (d === null) return null;
  if (d < 0) return { text: `${Math.abs(d)}d ago`, tone: "text-ink-500" };
  if (d === 0) return { text: "Today", tone: "text-red-300" };
  if (d <= 7) return { text: `${d}d left`, tone: "text-amber-300" };
  return { text: `${d}d left`, tone: "text-ink-400" };
}

export default function Deadlines() {
  const c = useCaseStore((s) => s.caseFile);
  const setDeadlines = useCaseStore((s) => s.setDeadlines);
  const addDeadline = useCaseStore((s) => s.addDeadline);
  const updateDeadline = useCaseStore((s) => s.updateDeadline);
  const removeDeadline = useCaseStore((s) => s.removeDeadline);
  const hasKey = useSettings((s) => !!s.geminiKey);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function generate() {
    setLoading(true);
    setError(null);
    try {
      const generated = await generateDeadlines(c);
      const manual = c.deadlines.filter((d) => d.source === "manual");
      setDeadlines([...manual, ...generated]);
    } catch (e) {
      setError(
        e instanceof MissingKeyError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Failed to generate deadlines."
      );
    } finally {
      setLoading(false);
    }
  }

  function exportIcs() {
    const dated = c.deadlines.filter((d) => d.date);
    if (dated.length === 0) {
      setError("No deadlines have dates yet — add dates to export a calendar.");
      return;
    }
    const ics = buildIcs(dated);
    downloadBlob(new Blob([ics], { type: "text/calendar" }), "prose-deadlines.ics");
  }

  const sorted = [...c.deadlines].sort((a, b) => {
    if (!a.date) return 1;
    if (!b.date) return -1;
    return a.date.localeCompare(b.date);
  });

  return (
    <div>
      <PageHeader
        icon={<CalendarClock size={20} />}
        title="Deadlines & Procedure"
        subtitle="A jurisdiction-aware checklist of filing deadlines and prep tasks. Export to your calendar so you never miss a date."
        action={
          <div className="flex gap-2">
            <button onClick={exportIcs} disabled={c.deadlines.length === 0} className="btn-ghost">
              <CalendarArrowDown size={16} /> Export .ics
            </button>
            <button onClick={generate} disabled={loading || !hasKey} className="btn-primary">
              <Wand2 size={16} /> {c.deadlines.some((d) => d.source === "ai") ? "Regenerate" : "Generate"}
            </button>
          </div>
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
          <Spinner label="Building your deadline & prep checklist…" />
        </div>
      )}

      <div className="mb-4 flex justify-end">
        <button
          onClick={() =>
            addDeadline({ title: "", date: "", detail: "", done: false, source: "manual" })
          }
          className="btn-ghost"
        >
          <Plus size={16} /> Add task
        </button>
      </div>

      {sorted.length === 0 && !loading ? (
        <div className="card p-8 text-center text-sm text-ink-400">
          No deadlines yet. Generate a checklist from your case, or add tasks manually.
        </div>
      ) : (
        <div className="space-y-2.5">
          {sorted.map((d) => {
            const cd = countdownLabel(d.date);
            return (
              <div
                key={d.id}
                className={`card flex items-start gap-3 p-4 ${d.done ? "opacity-60" : ""}`}
              >
                <input
                  type="checkbox"
                  checked={d.done}
                  onChange={(e) => updateDeadline(d.id, { done: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-brass-400"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      className={`input flex-1 !py-1.5 ${d.done ? "line-through" : ""}`}
                      placeholder="Task / deadline title"
                      value={d.title}
                      onChange={(e) => updateDeadline(d.id, { title: e.target.value })}
                    />
                    <input
                      type="date"
                      className="input w-[150px] !py-1.5"
                      value={d.date}
                      onChange={(e) => updateDeadline(d.id, { date: e.target.value })}
                    />
                    {cd && (
                      <span className={`shrink-0 text-xs font-medium ${cd.tone}`}>{cd.text}</span>
                    )}
                  </div>
                  {(d.detail || d.source === "ai") && (
                    <input
                      className="input mt-2 !py-1.5 text-sm text-ink-300"
                      placeholder="Detail / what to do"
                      value={d.detail}
                      onChange={(e) => updateDeadline(d.id, { detail: e.target.value })}
                    />
                  )}
                </div>
                <button
                  onClick={() => removeDeadline(d.id)}
                  className="mt-1 text-ink-500 hover:text-red-300"
                  aria-label="Remove"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            );
          })}
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
