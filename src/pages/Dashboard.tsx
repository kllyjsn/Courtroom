import { Link } from "react-router-dom";
import {
  FolderOpen,
  Search,
  Gavel,
  BookOpen,
  Radio,
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  Circle,
} from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { Disclaimer } from "../components/common";

const MODULES = [
  {
    to: "/case",
    title: "Case Builder",
    desc: "Capture the facts, parties, timeline, and evidence that power everything else.",
    icon: FolderOpen,
  },
  {
    to: "/research",
    title: "Legal Research",
    desc: "Find the statutes, rules, and precedent for your jurisdiction — with citations.",
    icon: Search,
  },
  {
    to: "/arguments",
    title: "Arguments & Motions",
    desc: "Build your argument, anticipate the other side, and draft motions.",
    icon: Gavel,
  },
  {
    to: "/guide",
    title: "Rights & Objections",
    desc: "Know-your-rights, courtroom flow, and a tap-to-use objection cheat sheet.",
    icon: BookOpen,
  },
  {
    to: "/hearing",
    title: "Hearing Mode",
    desc: "Live transcription with real-time objection & response suggestions.",
    icon: Radio,
  },
];

function daysUntil(dateStr: string): number | null {
  const [y, m, day] = dateStr.split("-").map(Number);
  if (!y || !m || !day) return null;
  const hearing = new Date(y, m - 1, day);
  if (isNaN(hearing.getTime())) return null;
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const ms = hearing.getTime() - now.getTime();
  return Math.round(ms / (1000 * 60 * 60 * 24));
}

export default function Dashboard() {
  const c = useCaseStore((s) => s.caseFile);

  const checklist = [
    { label: "Jurisdiction set", done: !!c.jurisdiction },
    { label: "Your role & case type", done: !!c.role && !!c.caseType },
    { label: "What happened (summary)", done: c.summary.length > 20 },
    { label: "Desired outcome", done: !!c.desiredOutcome },
    { label: "Timeline added", done: c.timeline.length > 0 },
    { label: "Evidence listed", done: c.evidence.length > 0 },
  ];
  const completed = checklist.filter((i) => i.done).length;
  const pct = Math.round((completed / checklist.length) * 100);
  const days = daysUntil(c.hearingDate);

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-ink-50 sm:text-4xl">
          {c.title ? c.title : "Defend yourself, prepared."}
        </h1>
        <p className="mt-2 max-w-2xl text-ink-300">
          A step-by-step copilot for representing yourself in court — organize your case,
          research the law, draft what you need, and practice for the hearing.
        </p>
      </div>

      {/* Status row */}
      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Case readiness
          </div>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-3xl font-bold text-brass-300">{pct}%</span>
            <span className="mb-1 text-xs text-ink-400">
              {completed}/{checklist.length} done
            </span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-ink-800">
            <div
              className="h-full rounded-full bg-brass-400 transition-all"
              style={{ width: `${pct}%` }}
            />
          </div>
        </div>

        <div className="card p-5">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-ink-400">
            <CalendarClock size={14} /> Hearing
          </div>
          {days === null ? (
            <p className="mt-2 text-sm text-ink-300">
              No hearing date set.{" "}
              <Link to="/case" className="text-brass-300 underline">
                Add one
              </Link>
            </p>
          ) : (
            <div className="mt-2">
              <span className="text-3xl font-bold text-ink-50">
                {days >= 0 ? days : 0}
              </span>
              <span className="ml-2 text-sm text-ink-300">
                {days > 0 ? "days away" : days === 0 ? "today" : "past"}
              </span>
              <p className="mt-1 text-xs text-ink-400">{c.hearingDate}</p>
            </div>
          )}
        </div>

        <div className="card p-5">
          <div className="text-xs font-semibold uppercase tracking-wide text-ink-400">
            Checklist
          </div>
          <ul className="mt-2 space-y-1.5">
            {checklist.map((i) => (
              <li key={i.label} className="flex items-center gap-2 text-sm">
                {i.done ? (
                  <CheckCircle2 size={15} className="shrink-0 text-emerald-400" />
                ) : (
                  <Circle size={15} className="shrink-0 text-ink-500" />
                )}
                <span className={i.done ? "text-ink-200" : "text-ink-400"}>
                  {i.label}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Modules */}
      <div className="grid gap-4 sm:grid-cols-2">
        {MODULES.map(({ to, title, desc, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            className="card group flex items-start gap-4 p-5 transition-all hover:border-brass-400/50 hover:bg-ink-900"
          >
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brass-400/15 text-brass-300">
              <Icon size={22} />
            </span>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 font-semibold text-ink-50">
                {title}
                <ArrowRight
                  size={15}
                  className="opacity-0 transition-opacity group-hover:opacity-100"
                />
              </div>
              <p className="mt-1 text-sm text-ink-300">{desc}</p>
            </div>
          </Link>
        ))}
      </div>

      <Disclaimer />
    </div>
  );
}
