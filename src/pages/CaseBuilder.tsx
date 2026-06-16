import { FolderOpen, Plus, Trash2, Users, CalendarDays, Paperclip } from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { PageHeader } from "../components/common";
import type { CaseType, CaseRole, Evidence } from "../lib/types";

const CASE_TYPES: { value: CaseType; label: string }[] = [
  { value: "small-claims", label: "Small claims" },
  { value: "civil", label: "Civil" },
  { value: "criminal-misdemeanor", label: "Criminal (misdemeanor)" },
  { value: "traffic", label: "Traffic" },
  { value: "landlord-tenant", label: "Landlord / tenant" },
  { value: "family", label: "Family" },
  { value: "administrative", label: "Administrative / agency" },
  { value: "other", label: "Other" },
];

const ROLES: { value: CaseRole; label: string }[] = [
  { value: "defendant", label: "Defendant" },
  { value: "plaintiff", label: "Plaintiff" },
  { value: "respondent", label: "Respondent" },
  { value: "petitioner", label: "Petitioner" },
  { value: "appellant", label: "Appellant" },
  { value: "other", label: "Other" },
];

const EVIDENCE_TYPES: Evidence["type"][] = [
  "document",
  "photo",
  "message",
  "recording",
  "physical",
  "other",
];

function Section({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="card p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-50">
          <span className="text-brass-300">{icon}</span>
          {title}
        </h2>
        {action}
      </div>
      {children}
    </section>
  );
}

export default function CaseBuilder() {
  const c = useCaseStore((s) => s.caseFile);
  const {
    updateCase,
    addParty,
    updateParty,
    removeParty,
    addEvent,
    updateEvent,
    removeEvent,
    addEvidence,
    updateEvidence,
    removeEvidence,
    resetCase,
  } = useCaseStore();

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<FolderOpen size={20} />}
        title="Case Builder"
        subtitle="Everything you enter here feeds the research, argument, and hearing tools. Be specific and factual."
        action={
          <button
            onClick={() => {
              if (confirm("Clear the entire case file? This cannot be undone.")) resetCase();
            }}
            className="btn-ghost"
          >
            <Trash2 size={16} /> Clear
          </button>
        }
      />

      <Section title="Basics" icon={<FolderOpen size={18} />}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label">Case title (for your reference)</label>
            <input
              className="input"
              value={c.title}
              onChange={(e) => updateCase({ title: e.target.value })}
              placeholder="e.g. Smith v. Me — unpaid security deposit"
            />
          </div>
          <div>
            <label className="label">Jurisdiction (country / state / court)</label>
            <input
              className="input"
              value={c.jurisdiction}
              onChange={(e) => updateCase({ jurisdiction: e.target.value })}
              placeholder="e.g. California, USA — Los Angeles Small Claims"
            />
          </div>
          <div>
            <label className="label">Case / docket number</label>
            <input
              className="input"
              value={c.caseNumber}
              onChange={(e) => updateCase({ caseNumber: e.target.value })}
              placeholder="optional"
            />
          </div>
          <div>
            <label className="label">Type of matter</label>
            <select
              className="input"
              value={c.caseType}
              onChange={(e) => updateCase({ caseType: e.target.value as CaseType })}
            >
              {CASE_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Your role</label>
            <select
              className="input"
              value={c.role}
              onChange={(e) => updateCase({ role: e.target.value as CaseRole })}
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>
                  {r.label}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Hearing date</label>
            <input
              type="date"
              className="input"
              value={c.hearingDate}
              onChange={(e) => updateCase({ hearingDate: e.target.value })}
            />
          </div>
          <div className="sm:col-span-2">
            <label className="label">Charges / claims at issue</label>
            <input
              className="input"
              value={c.charges}
              onChange={(e) => updateCase({ charges: e.target.value })}
              placeholder="e.g. Landlord claims I owe $2,400 unpaid rent; I claim wrongful withholding of deposit"
            />
          </div>
        </div>
      </Section>

      <Section title="Your account & goal" icon={<FolderOpen size={18} />}>
        <div className="space-y-4">
          <div>
            <label className="label">What happened? (plain language)</label>
            <textarea
              className="input min-h-[140px] resize-y"
              value={c.summary}
              onChange={(e) => updateCase({ summary: e.target.value })}
              placeholder="Tell the story in order. Who did what, when, and why it matters. Stick to facts you can support."
            />
          </div>
          <div>
            <label className="label">What outcome do you want?</label>
            <textarea
              className="input min-h-[80px] resize-y"
              value={c.desiredOutcome}
              onChange={(e) => updateCase({ desiredOutcome: e.target.value })}
              placeholder="e.g. Case dismissed; OR judgment that I owe nothing and recover my $1,200 deposit plus fees"
            />
          </div>
        </div>
      </Section>

      <Section
        title="Parties & people"
        icon={<Users size={18} />}
        action={
          <button onClick={addParty} className="btn-ghost !py-1.5">
            <Plus size={15} /> Add
          </button>
        }
      >
        {c.parties.length === 0 ? (
          <p className="text-sm text-ink-400">
            Add the other side, witnesses, and anyone relevant.
          </p>
        ) : (
          <div className="space-y-3">
            {c.parties.map((p) => (
              <div
                key={p.id}
                className="grid gap-3 rounded-xl border border-ink-800 p-3 sm:grid-cols-[1fr_1fr_auto]"
              >
                <input
                  className="input"
                  value={p.name}
                  onChange={(e) => updateParty(p.id, { name: e.target.value })}
                  placeholder="Name"
                />
                <input
                  className="input"
                  value={p.role}
                  onChange={(e) => updateParty(p.id, { role: e.target.value })}
                  placeholder="Role (e.g. opposing party, witness)"
                />
                <button
                  onClick={() => removeParty(p.id)}
                  className="btn-ghost !px-2.5"
                  aria-label="Remove party"
                >
                  <Trash2 size={16} />
                </button>
                <input
                  className="input sm:col-span-3"
                  value={p.notes}
                  onChange={(e) => updateParty(p.id, { notes: e.target.value })}
                  placeholder="Notes (optional)"
                />
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Timeline"
        icon={<CalendarDays size={18} />}
        action={
          <button onClick={addEvent} className="btn-ghost !py-1.5">
            <Plus size={15} /> Add
          </button>
        }
      >
        {c.timeline.length === 0 ? (
          <p className="text-sm text-ink-400">
            A clear chronology is one of your strongest tools. Add key dates and events.
          </p>
        ) : (
          <div className="space-y-3">
            {c.timeline.map((ev) => (
              <div
                key={ev.id}
                className="grid gap-3 rounded-xl border border-ink-800 p-3 sm:grid-cols-[180px_1fr_auto]"
              >
                <input
                  className="input"
                  value={ev.date}
                  onChange={(e) => updateEvent(ev.id, { date: e.target.value })}
                  placeholder="Date (e.g. 2024-03-01)"
                />
                <input
                  className="input"
                  value={ev.description}
                  onChange={(e) =>
                    updateEvent(ev.id, { description: e.target.value })
                  }
                  placeholder="What happened"
                />
                <button
                  onClick={() => removeEvent(ev.id)}
                  className="btn-ghost !px-2.5"
                  aria-label="Remove event"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Evidence"
        icon={<Paperclip size={18} />}
        action={
          <button onClick={addEvidence} className="btn-ghost !py-1.5">
            <Plus size={15} /> Add
          </button>
        }
      >
        {c.evidence.length === 0 ? (
          <p className="text-sm text-ink-400">
            List documents, photos, messages, etc. Note what each one proves.
          </p>
        ) : (
          <div className="space-y-3">
            {c.evidence.map((ev) => (
              <div
                key={ev.id}
                className="grid gap-3 rounded-xl border border-ink-800 p-3 sm:grid-cols-[1fr_160px_auto]"
              >
                <input
                  className="input"
                  value={ev.label}
                  onChange={(e) => updateEvidence(ev.id, { label: e.target.value })}
                  placeholder="Label (e.g. Lease agreement)"
                />
                <select
                  className="input"
                  value={ev.type}
                  onChange={(e) =>
                    updateEvidence(ev.id, { type: e.target.value as Evidence["type"] })
                  }
                >
                  {EVIDENCE_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
                <button
                  onClick={() => removeEvidence(ev.id)}
                  className="btn-ghost !px-2.5"
                  aria-label="Remove evidence"
                >
                  <Trash2 size={16} />
                </button>
                <input
                  className="input sm:col-span-3"
                  value={ev.supports}
                  onChange={(e) => updateEvidence(ev.id, { supports: e.target.value })}
                  placeholder="What does this prove / support?"
                />
              </div>
            ))}
          </div>
        )}
      </Section>
    </div>
  );
}
