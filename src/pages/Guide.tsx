import { useState } from "react";
import { BookOpen, Megaphone, ChevronDown } from "lucide-react";
import { RIGHTS_GUIDE, OBJECTIONS } from "../lib/content";
import { PageHeader, Disclaimer } from "../components/common";

export default function Guide() {
  const [tab, setTab] = useState<"rights" | "objections">("rights");
  const [open, setOpen] = useState<string | null>(RIGHTS_GUIDE[0].id);

  return (
    <div>
      <PageHeader
        icon={<BookOpen size={20} />}
        title="Rights & Objections"
        subtitle="Plain-language courtroom guidance and a quick objection cheat sheet. General common-law principles — confirm your jurisdiction's rules."
      />

      <div className="mb-5 flex gap-2">
        <button
          onClick={() => setTab("rights")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
            tab === "rights"
              ? "bg-brass-400/15 text-brass-200"
              : "bg-ink-800/60 text-ink-300 hover:text-ink-100"
          }`}
        >
          <BookOpen size={16} /> Rights & Procedure
        </button>
        <button
          onClick={() => setTab("objections")}
          className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium ${
            tab === "objections"
              ? "bg-brass-400/15 text-brass-200"
              : "bg-ink-800/60 text-ink-300 hover:text-ink-100"
          }`}
        >
          <Megaphone size={16} /> Objections
        </button>
      </div>

      {tab === "rights" ? (
        <div className="space-y-3">
          {RIGHTS_GUIDE.map((section) => {
            const isOpen = open === section.id;
            return (
              <div key={section.id} className="card overflow-hidden">
                <button
                  onClick={() => setOpen(isOpen ? null : section.id)}
                  className="flex w-full items-center justify-between p-4 text-left"
                >
                  <span className="font-semibold text-ink-50">{section.title}</span>
                  <ChevronDown
                    size={18}
                    className={`text-ink-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
                  />
                </button>
                {isOpen && (
                  <div className="animate-fade-in border-t border-ink-800 p-4">
                    <ul className="prose-legal">
                      {section.body.map((b, i) => (
                        <li key={i}>{b}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {OBJECTIONS.map((o) => (
            <div key={o.name} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-ink-50">{o.name}</h3>
                <span className="rounded-md bg-brass-400/15 px-2 py-0.5 text-xs font-medium text-brass-200">
                  “{o.say}”
                </span>
              </div>
              <p className="mt-2 text-sm text-ink-300">
                <span className="font-medium text-ink-200">When:</span> {o.trigger}
              </p>
              <p className="mt-1.5 text-xs text-ink-400">{o.note}</p>
            </div>
          ))}
        </div>
      )}

      <Disclaimer>
        <strong className="text-ink-300">General information only.</strong> Objection phrasing
        and rights vary by jurisdiction and court. These are common-law/US-leaning examples —
        confirm what applies where your case is heard.
      </Disclaimer>
    </div>
  );
}
