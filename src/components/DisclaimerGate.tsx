import { ShieldAlert } from "lucide-react";
import { useSettings } from "../store/useSettings";

export default function DisclaimerGate({ children }: { children: React.ReactNode }) {
  const accepted = useSettings((s) => s.disclaimerAccepted);
  const accept = useSettings((s) => s.acceptDisclaimer);

  if (accepted) return <>{children}</>;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink-950/95 p-4">
      <div className="card max-w-xl animate-fade-in p-6 sm:p-8">
        <div className="mb-4 flex items-center gap-3">
          <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-brass-400/15 text-brass-300">
            <ShieldAlert size={22} />
          </span>
          <h1 className="text-2xl font-bold text-ink-50">Read this first</h1>
        </div>
        <div className="prose-legal space-y-3 text-sm">
          <p>
            <strong>Pro Se</strong> is an educational tool to help you organize a case,
            understand court procedure, and prepare. It is <strong>not a lawyer</strong> and
            does <strong>not provide legal advice</strong>.
          </p>
          <ul>
            <li>
              AI output can be wrong or incomplete. <strong>Verify everything</strong> against
              your court's official rules and, where possible, a licensed attorney or legal-aid
              service.
            </li>
            <li>
              Laws and procedures differ by country, state, and court. Always confirm what
              applies to <strong>your</strong> jurisdiction.
            </li>
            <li>
              <strong>Using a phone, recording, or transcribing in a live courtroom is often
              restricted or illegal.</strong> The live "Hearing Mode" is intended for permitted
              settings (prep, mock practice, or hearings where devices are expressly allowed).
              Check your court's rules before using it anywhere.
            </li>
            <li>Your data stays in your browser (localStorage). Nothing is sent to a server except calls to the AI providers you configure.</li>
          </ul>
        </div>
        <button onClick={accept} className="btn-primary mt-6 w-full">
          I understand — this is not legal advice
        </button>
      </div>
    </div>
  );
}
