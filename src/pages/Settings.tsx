import { useState } from "react";
import {
  Settings as SettingsIcon,
  Eye,
  EyeOff,
  ExternalLink,
  FileText,
  Copy,
  Check,
  Trash2,
} from "lucide-react";
import { useSettings } from "../store/useSettings";
import { useCaseStore } from "../store/useCaseStore";
import { PageHeader } from "../components/common";

function KeyField({
  label,
  value,
  onChange,
  placeholder,
  help,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
  help: React.ReactNode;
}) {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="label">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          className="input pr-10"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          autoComplete="off"
          spellCheck={false}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-ink-400 hover:text-ink-200"
          aria-label={show ? "Hide" : "Show"}
        >
          {show ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      </div>
      <p className="mt-1.5 text-xs text-ink-400">{help}</p>
    </div>
  );
}

export default function Settings() {
  const s = useSettings();
  const drafts = useCaseStore((st) => st.drafts);
  const removeDraft = useCaseStore((st) => st.removeDraft);
  const [copied, setCopied] = useState<string | null>(null);

  return (
    <div className="space-y-6">
      <PageHeader
        icon={<SettingsIcon size={20} />}
        title="Settings"
        subtitle="Connect AI providers and manage your data. Keys are stored only in your browser."
      />

      <section className="card p-5">
        <h2 className="mb-4 text-lg font-semibold text-ink-50">AI providers</h2>
        <div className="space-y-5">
          <KeyField
            label="Google Gemini API key"
            value={s.geminiKey}
            onChange={s.setGeminiKey}
            placeholder="AIza…"
            help={
              <>
                Powers arguments, motions, and Hearing Mode.{" "}
                <a
                  href="https://aistudio.google.com/apikey"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-0.5 text-brass-300 hover:underline"
                >
                  Get a key <ExternalLink size={11} />
                </a>
              </>
            }
          />
          <div>
            <label className="label">Gemini model</label>
            <select
              className="input"
              value={s.geminiModel}
              onChange={(e) => s.setGeminiModel(e.target.value)}
            >
              <option value="gemini-2.5-flash">gemini-2.5-flash (fast, recommended)</option>
              <option value="gemini-2.5-pro">gemini-2.5-pro (slower, deeper)</option>
              <option value="gemini-flash-latest">gemini-flash-latest</option>
            </select>
          </div>
          <KeyField
            label="Perplexity API key"
            value={s.perplexityKey}
            onChange={s.setPerplexityKey}
            placeholder="pplx-…"
            help={
              <>
                Powers web-grounded Legal Research with citations.{" "}
                <a
                  href="https://www.perplexity.ai/settings/api"
                  target="_blank"
                  rel="noreferrer noopener"
                  className="inline-flex items-center gap-0.5 text-brass-300 hover:underline"
                >
                  Get a key <ExternalLink size={11} />
                </a>
              </>
            }
          />
        </div>
        <p className="mt-4 rounded-lg border border-ink-800 bg-ink-950/50 p-3 text-xs leading-relaxed text-ink-400">
          Keys never leave your device except in direct requests to each provider. For a shared
          or production deployment, route these through a backend proxy instead of storing keys
          in the browser.
        </p>
      </section>

      <section className="card p-5">
        <h2 className="mb-1 text-lg font-semibold text-ink-50">Backend proxy (optional)</h2>
        <p className="mb-4 text-sm text-ink-400">
          Point Pro Se at a hosted proxy that holds the API keys server-side. When set, all AI
          requests route through it and you don't need to paste your own keys. Leave blank to use
          bring-your-own-key mode above. See <code className="text-ink-300">server/</code> in the
          repo for a ready-to-run example.
        </p>
        <label className="label">Proxy base URL</label>
        <input
          className="input"
          value={s.proxyUrl}
          onChange={(e) => s.setProxyUrl(e.target.value)}
          placeholder="https://your-proxy.example.com"
          autoComplete="off"
          spellCheck={false}
        />
        {s.proxyUrl && (
          <p className="mt-2 text-xs text-emerald-300">
            Proxy mode active — requests go to {s.proxyUrl}/api/*
          </p>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-ink-50">
          <FileText size={18} className="text-brass-300" /> Saved documents
        </h2>
        {drafts.length === 0 ? (
          <p className="text-sm text-ink-400">
            Saved research, arguments, and motions will appear here.
          </p>
        ) : (
          <div className="space-y-3">
            {drafts.map((d) => (
              <div key={d.id} className="rounded-xl border border-ink-800 p-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <span className="chip mr-2 capitalize">{d.kind}</span>
                    <span className="font-medium text-ink-100">{d.title}</span>
                  </div>
                  <div className="flex shrink-0 gap-1">
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(d.content);
                        setCopied(d.id);
                        setTimeout(() => setCopied(null), 1500);
                      }}
                      className="btn-ghost !px-2 !py-1.5"
                      aria-label="Copy"
                    >
                      {copied === d.id ? <Check size={15} /> : <Copy size={15} />}
                    </button>
                    <button
                      onClick={() => removeDraft(d.id)}
                      className="btn-ghost !px-2 !py-1.5"
                      aria-label="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </div>
                <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-xs text-ink-400">
                  {d.content.slice(0, 280)}
                </p>
              </div>
            ))}
          </div>
        )}
      </section>

      <section className="card p-5">
        <h2 className="mb-2 text-lg font-semibold text-ink-50">Data</h2>
        <p className="mb-4 text-sm text-ink-400">
          All your data lives in this browser's localStorage. Clearing it cannot be undone.
        </p>
        <button
          onClick={() => {
            if (
              confirm(
                "Erase ALL local data (case file, drafts, keys, settings)? This cannot be undone."
              )
            ) {
              localStorage.clear();
              location.reload();
            }
          }}
          className="btn-danger"
        >
          <Trash2 size={16} /> Erase all local data
        </button>
      </section>
    </div>
  );
}
