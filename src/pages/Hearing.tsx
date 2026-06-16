import { useEffect, useRef, useState } from "react";
import {
  Radio,
  Mic,
  MicOff,
  Sparkles,
  AlertTriangle,
  Eraser,
  Zap,
  ZapOff,
} from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { useSettings } from "../store/useSettings";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { buildCaseContext, callGemini, MissingKeyError } from "../lib/ai";
import { OBJECTIONS } from "../lib/content";
import { PageHeader, KeyWarning, ErrorNote } from "../components/common";

interface Suggestion {
  objections: { name: string; reason: string }[];
  response: string;
  facts: string[];
  watch: string;
}

const HEARING_SYSTEM =
  "You are a real-time courtroom assistant for a self-represented litigant. You are NOT a lawyer and do " +
  "not give legal advice — you give quick, practical prompts based on what was just said. Be extremely " +
  "concise. Respond ONLY with minified JSON matching this shape: " +
  '{"objections":[{"name":string,"reason":string}],"response":string,"facts":[string],"watch":string}. ' +
  "objections = evidentiary objections worth considering RIGHT NOW (0-3, empty if none). " +
  "response = one short thing the user could say or ask next. facts = 0-2 facts from their case file worth " +
  "raising now. watch = one short caution. Never invent facts not in the case file. No prose outside JSON.";

function parseSuggestion(raw: string): Suggestion | null {
  let txt = raw.trim();
  const fence = /```(?:json)?\s*([\s\S]*?)```/.exec(txt);
  if (fence) txt = fence[1].trim();
  const start = txt.indexOf("{");
  const end = txt.lastIndexOf("}");
  if (start === -1 || end === -1) return null;
  try {
    const obj = JSON.parse(txt.slice(start, end + 1));
    return {
      objections: Array.isArray(obj.objections) ? obj.objections : [],
      response: typeof obj.response === "string" ? obj.response : "",
      facts: Array.isArray(obj.facts) ? obj.facts : [],
      watch: typeof obj.watch === "string" ? obj.watch : "",
    };
  } catch {
    return null;
  }
}

export default function Hearing() {
  const c = useCaseStore((s) => s.caseFile);
  const hasKey = useSettings((s) => !!s.geminiKey);
  const speech = useSpeechRecognition();

  const [suggestion, setSuggestion] = useState<Suggestion | null>(null);
  const [thinking, setThinking] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [auto, setAuto] = useState(false);
  const lastAnalyzedLen = useRef(0);
  const transcriptRef = useRef<HTMLDivElement>(null);

  const transcript = speech.finalTranscript;

  useEffect(() => {
    transcriptRef.current?.scrollTo({ top: transcriptRef.current.scrollHeight });
  }, [transcript, speech.interim]);

  async function analyze() {
    if (!transcript.trim()) return;
    setThinking(true);
    setAiError(null);
    lastAnalyzedLen.current = transcript.length;
    const recent = transcript.slice(-1200);
    const prompt = `MY CASE FILE:\n${buildCaseContext(c)}\n\nLIVE TRANSCRIPT (most recent of the hearing):\n"""${recent}"""\n\nBased on the most recent statements, give me real-time prompts as JSON.`;
    try {
      const raw = await callGemini(prompt, HEARING_SYSTEM);
      const parsed = parseSuggestion(raw);
      if (parsed) setSuggestion(parsed);
      else setAiError("Could not parse the assistant's response. Try again.");
    } catch (e) {
      setAiError(
        e instanceof MissingKeyError
          ? e.message
          : e instanceof Error
            ? e.message
            : "Something went wrong."
      );
    } finally {
      setThinking(false);
    }
  }

  // Auto-assist: analyze when enough new final transcript has accumulated.
  useEffect(() => {
    if (!auto || !hasKey || thinking) return;
    const grown = transcript.length - lastAnalyzedLen.current;
    if (grown < 160) return;
    const t = setTimeout(() => analyze(), 1200);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [transcript, auto, hasKey, thinking]);

  return (
    <div>
      <PageHeader
        icon={<Radio size={20} />}
        title="Hearing Mode"
        subtitle="Live transcription with real-time objection, response, and fact prompts from your case file."
      />

      <div className="mb-5 flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-200">
        <AlertTriangle size={18} className="mt-0.5 shrink-0" />
        <span>
          <strong>Check your court's rules first.</strong> Recording, transcribing, or using a
          phone in a live courtroom is often prohibited and may be illegal. Use this for
          preparation, mock practice, or hearings where devices are expressly permitted.
        </span>
      </div>

      {!hasKey && (
        <div className="mb-5">
          <KeyWarning provider="Gemini" />
        </div>
      )}

      {!speech.supported && (
        <div className="mb-5">
          <ErrorNote message="Live transcription isn't supported in this browser. Try Chrome or Edge on desktop." />
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[1.4fr_1fr]">
        {/* Transcript column */}
        <div className="card flex flex-col p-5">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="flex items-center gap-2 text-lg font-semibold text-ink-50">
              Live transcript
              {speech.listening && (
                <span className="flex h-2.5 w-2.5 animate-pulse-ring rounded-full bg-red-500" />
              )}
            </h2>
            <div className="flex gap-2">
              <button
                onClick={() => setAuto((a) => !a)}
                disabled={!hasKey}
                className={`btn-ghost !py-1.5 ${auto ? "!border-brass-400/60 !text-brass-200" : ""}`}
                title="Automatically suggest as the hearing progresses"
              >
                {auto ? <Zap size={15} /> : <ZapOff size={15} />}
                Auto
              </button>
              <button
                onClick={() => {
                  speech.reset();
                  lastAnalyzedLen.current = 0;
                }}
                className="btn-ghost !px-2.5 !py-1.5"
                aria-label="Clear transcript"
              >
                <Eraser size={15} />
              </button>
            </div>
          </div>

          <div
            ref={transcriptRef}
            className="min-h-[260px] flex-1 overflow-y-auto rounded-xl border border-ink-800 bg-ink-950/50 p-4 text-sm leading-relaxed"
          >
            {transcript || speech.interim ? (
              <p className="whitespace-pre-wrap text-ink-200">
                {transcript}
                <span className="text-ink-400">{speech.interim}</span>
              </p>
            ) : (
              <p className="text-ink-500">
                Press <span className="text-ink-300">Start listening</span> and the transcript
                will appear here.
              </p>
            )}
          </div>

          {speech.error && (
            <p className="mt-2 text-xs text-red-300">Mic error: {speech.error}</p>
          )}

          <div className="mt-4 flex flex-wrap gap-2">
            {!speech.listening ? (
              <button
                onClick={speech.start}
                disabled={!speech.supported}
                className="btn-primary flex-1"
              >
                <Mic size={16} /> Start listening
              </button>
            ) : (
              <button onClick={speech.stop} className="btn-danger flex-1">
                <MicOff size={16} /> Stop
              </button>
            )}
            <button
              onClick={analyze}
              disabled={!hasKey || thinking || !transcript.trim()}
              className="btn-ghost"
            >
              <Sparkles size={16} /> {thinking ? "Thinking…" : "Suggest now"}
            </button>
          </div>
        </div>

        {/* Assist column */}
        <div className="space-y-4">
          <div className="card p-5">
            <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold text-ink-50">
              <Sparkles size={18} className="text-brass-300" /> Real-time assist
            </h2>
            {aiError && <ErrorNote message={aiError} />}
            {!suggestion && !aiError && (
              <p className="text-sm text-ink-400">
                Suggestions appear here. Turn on <strong className="text-ink-300">Auto</strong>{" "}
                or tap <strong className="text-ink-300">Suggest now</strong> while the hearing
                is being transcribed.
              </p>
            )}
            {suggestion && (
              <div className="animate-fade-in space-y-4">
                {suggestion.objections.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-red-300">
                      Consider objecting
                    </h3>
                    <div className="space-y-2">
                      {suggestion.objections.map((o, i) => (
                        <div
                          key={i}
                          className="rounded-lg border border-red-500/30 bg-red-500/10 p-2.5"
                        >
                          <div className="text-sm font-semibold text-red-200">
                            “Objection, {o.name.toLowerCase()}.”
                          </div>
                          <div className="text-xs text-ink-300">{o.reason}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {suggestion.response && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-brass-300">
                      You could say
                    </h3>
                    <p className="rounded-lg border border-brass-400/30 bg-brass-400/10 p-2.5 text-sm text-ink-100">
                      {suggestion.response}
                    </p>
                  </div>
                )}
                {suggestion.facts.length > 0 && (
                  <div>
                    <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-ink-300">
                      Raise from your file
                    </h3>
                    <ul className="space-y-1">
                      {suggestion.facts.map((f, i) => (
                        <li key={i} className="text-sm text-ink-200">
                          • {f}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {suggestion.watch && (
                  <p className="rounded-lg border border-ink-800 bg-ink-950/50 p-2.5 text-xs text-ink-400">
                    <AlertTriangle size={12} className="mr-1 inline" />
                    {suggestion.watch}
                  </p>
                )}
              </div>
            )}
          </div>

          <details className="card p-5">
            <summary className="cursor-pointer font-semibold text-ink-50">
              Objection quick reference
            </summary>
            <div className="mt-3 space-y-2">
              {OBJECTIONS.slice(0, 8).map((o) => (
                <div key={o.name} className="text-sm">
                  <span className="font-medium text-brass-200">{o.name}:</span>{" "}
                  <span className="text-ink-300">{o.trigger}</span>
                </div>
              ))}
            </div>
          </details>
        </div>
      </div>

      <p className="mt-4 rounded-lg border border-ink-800 bg-ink-950/50 p-3 text-xs leading-relaxed text-ink-400">
        <strong className="text-ink-300">Not legal advice.</strong> Real-time prompts are
        AI-generated and may be wrong. You are responsible for what you say in court. Transcription
        happens in your browser; transcript snippets are sent to your configured AI provider to
        generate suggestions.
      </p>
    </div>
  );
}
