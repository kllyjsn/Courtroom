import { Link } from "react-router-dom";
import { AlertTriangle, KeyRound, Loader2 } from "lucide-react";
import type { ReactNode } from "react";

export function PageHeader({
  title,
  subtitle,
  icon,
  action,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div className="flex items-start gap-3">
        {icon && (
          <span className="mt-0.5 flex h-10 w-10 items-center justify-center rounded-xl bg-brass-400/15 text-brass-300">
            {icon}
          </span>
        )}
        <div>
          <h1 className="text-2xl font-bold text-ink-50 sm:text-3xl">{title}</h1>
          {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-300">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
}

export function ErrorNote({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-200">
      <AlertTriangle size={18} className="mt-0.5 shrink-0" />
      <span>{message}</span>
    </div>
  );
}

export function KeyWarning({ provider }: { provider: "Gemini" | "Perplexity" }) {
  return (
    <div className="flex flex-wrap items-center gap-3 rounded-xl border border-brass-400/40 bg-brass-400/10 p-4 text-sm text-brass-100">
      <KeyRound size={18} className="shrink-0" />
      <span className="flex-1">
        Add your {provider} API key to use this feature.
      </span>
      <Link to="/settings" className="btn-primary !py-1.5">
        Open Settings
      </Link>
    </div>
  );
}

export function Spinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-ink-300">
      <Loader2 size={16} className="animate-spin" />
      {label ?? "Working…"}
    </div>
  );
}

export function Disclaimer({ children }: { children?: ReactNode }) {
  return (
    <p className="mt-4 rounded-lg border border-ink-800 bg-ink-950/50 p-3 text-xs leading-relaxed text-ink-400">
      {children ?? (
        <>
          <strong className="text-ink-300">Not legal advice.</strong> AI output may be
          inaccurate. Verify against your court's official rules and consult a licensed
          attorney or legal-aid service where possible.
        </>
      )}
    </p>
  );
}
