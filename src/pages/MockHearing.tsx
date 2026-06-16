import { useRef, useState } from "react";
import {
  Swords,
  Play,
  Send,
  Mic,
  MicOff,
  RotateCcw,
  GraduationCap,
  Gavel,
  Sparkles,
} from "lucide-react";
import { useCaseStore } from "../store/useCaseStore";
import { useSettings } from "../store/useSettings";
import { useSpeechRecognition } from "../hooks/useSpeechRecognition";
import { buildCaseContext, callGeminiJSON, MissingKeyError } from "../lib/ai";
import { PageHeader, KeyWarning, ErrorNote, Spinner, Disclaimer } from "../components/common";
import { demoHearingTurns, demoFeedback } from "../lib/demo";

type Speaker = "Judge" | "Opposing Counsel" | "You";

interface Turn {
  speaker: Speaker;
  text: string;
}

interface AiTurnResponse {
  responses: { speaker: "Judge" | "Opposing Counsel"; text: string }[];
}

interface Feedback {
  score: number;
  strengths: string[];
  improvements: string[];
  missedObjections: string[];
}

const MOCK_SYSTEM =
  "You are running a realistic but supportive MOCK court hearing to help a self-represented litigant practice. " +
  "You play BOTH the Judge and the Opposing Counsel. You are NOT giving legal advice — this is rehearsal. " +
  "Stay in character, keep each turn short and realistic for the case type and jurisdiction, and gradually " +
  "apply pressure (objections, pointed questions) so the user can practice responding. " +
  "Respond ONLY with minified JSON: " +
  '{"responses":[{"speaker":"Judge"|"Opposing Counsel","text":string}]}. ' +
  "Usually return 1-2 responses per turn. The Judge should move the proceeding along and occasionally ask the " +
  "user direct questions. Opposing Counsel should argue the other side and sometimes object. Never speak for the user.";

const FEEDBACK_SYSTEM =
  "You are a courtroom-skills coach reviewing a mock hearing transcript for a self-represented litigant. " +
  "You are NOT giving legal advice. Respond ONLY with minified JSON: " +
  '{"score":number,"strengths":[string],"improvements":[string],"missedObjections":[string]}. ' +
  "score = 0-100 overall preparedness. strengths/improvements = 2-4 concise, specific items each. " +
  "missedObjections = moments the user could have objected or pushed back but didn't (0-4 items).";

export default function MockHearing() {
  const c = useCaseStore((s) => s.caseFile);
  const hasKey = useSettings((s) => !!s.geminiKey || !!s.proxyUrl);
  const speech = useSpeechRecognition();

  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [started, setStarted] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  function scrollDown() {
    setTimeout(
      () => scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight }),
      50
    );
  }

  function transcriptText(list: Turn[]): string {
    return list.map((t) => `${t.speaker}: ${t.text}`).join("\n");
  }

  async function advance(history: Turn[]) {
    setBusy(true);
    setError(null);
    try {
      const prompt =
        `CASE FILE:\n${buildCaseContext(c)}\n\n` +
        `MOCK HEARING TRANSCRIPT SO FAR:\n${transcriptText(history) || "(the hearing is about to begin)"}\n\n` +
        `Continue the hearing. If it is just beginning, have the Judge call the case to order and invite ` +
        `the first argument. Otherwise respond to what the user just said.`;
      const data = await callGeminiJSON<AiTurnResponse>(prompt, MOCK_SYSTEM);
      const next = (data.responses ?? [])
        .filter((r) => r.text?.trim())
        .map<Turn>((r) => ({ speaker: r.speaker, text: r.text.trim() }));
      setTurns([...history, ...next]);
      scrollDown();
    } catch (e) {
      setError(
        e instanceof MissingKeyError
          ? e.message
          : e instanceof Error
            ? e.message
            : "The hearing could not continue."
      );
    } finally {
      setBusy(false);
    }
  }

  async function start() {
    setStarted(true);
    setFeedback(null);
    setTurns([]);
    await advance([]);
  }

  async function submit() {
    const said = (input.trim() || speech.finalTranscript.trim());
    if (!said || busy) return;
    const history = [...turns, { speaker: "You" as const, text: said }];
    setTurns(history);
    setInput("");
    speech.reset();
    if (speech.listening) speech.stop();
    scrollDown();
    await advance(history);
  }

  async function getFeedback() {
    setBusy(true);
    setError(null);
    try {
      const prompt =
        `CASE FILE:\n${buildCaseContext(c)}\n\nMOCK HEARING TRANSCRIPT:\n${transcriptText(turns)}\n\n` +
        `Evaluate the self-represented litigant's performance.`;
      const data = await callGeminiJSON<Feedback>(prompt, FEEDBACK_SYSTEM);
      setFeedback(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate feedback.");
    } finally {
      setBusy(false);
    }
  }

  function reset() {
    setTurns([]);
    setFeedback(null);
    setStarted(false);
    setInput("");
    speech.reset();
  }

  const speakerStyle: Record<Speaker, string> = {
    Judge: "border-brass-400/40 bg-brass-400/10",
    "Opposing Counsel": "border-red-500/30 bg-red-500/5",
    You: "border-emerald-500/30 bg-emerald-500/5",
  };

  return (
    <div>
      <PageHeader
        icon={<Swords size={20} />}
        title="Mock Hearing"
        subtitle="Rehearse against an AI judge and opposing counsel. Practice your arguments, get pressured with objections, then receive coaching."
        action={
          started ? (
            <button onClick={reset} className="btn-ghost">
              <RotateCcw size={16} /> Restart
            </button>
          ) : undefined
        }
      />

      {!hasKey && (
        <div className="mb-5">
          <KeyWarning provider="Gemini" />
        </div>
      )}

      {!started ? (
        <div className="card p-8 text-center">
          <Gavel size={28} className="mx-auto mb-3 text-brass-300" />
          <p className="mx-auto mb-4 max-w-md text-sm text-ink-300">
            The AI will run a realistic practice hearing based on your case file. You'll respond as
            yourself; the judge and opposing counsel will react. When you're done, get a scored
            critique.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => {
                setStarted(true);
                setTurns(demoHearingTurns);
                setFeedback(demoFeedback);
              }}
              className="btn-ghost"
            >
              <Sparkles size={16} /> Simulate
            </button>
            <button onClick={start} disabled={!hasKey} className="btn-primary">
              <Play size={16} /> Start mock hearing
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-5 lg:grid-cols-[1.5fr_1fr]">
          <div className="card flex flex-col p-5">
            <div
              ref={scrollRef}
              className="max-h-[460px] min-h-[300px] flex-1 space-y-3 overflow-y-auto pr-1"
            >
              {turns.map((t, i) => (
                <div key={i} className={`rounded-xl border p-3 ${speakerStyle[t.speaker]}`}>
                  <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-ink-400">
                    {t.speaker}
                  </div>
                  <p className="whitespace-pre-wrap text-sm text-ink-100">{t.text}</p>
                </div>
              ))}
              {busy && (
                <div className="px-1 py-2">
                  <Spinner label="The court is responding…" />
                </div>
              )}
            </div>

            {error && <div className="mt-3"><ErrorNote message={error} /></div>}

            <div className="mt-4">
              <textarea
                className="input min-h-[80px] resize-y"
                placeholder="Type what you'd say to the court…"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
                }}
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {speech.supported &&
                  (speech.listening ? (
                    <button onClick={speech.stop} className="btn-danger">
                      <MicOff size={16} /> Stop
                    </button>
                  ) : (
                    <button onClick={speech.start} className="btn-ghost">
                      <Mic size={16} /> Speak
                    </button>
                  ))}
                <button
                  onClick={submit}
                  disabled={busy || (!input.trim() && !speech.finalTranscript.trim())}
                  className="btn-primary flex-1"
                >
                  <Send size={16} /> Respond to the court
                </button>
              </div>
              {speech.finalTranscript && (
                <p className="mt-2 text-xs text-ink-400">
                  Captured: <span className="text-ink-200">{speech.finalTranscript}</span>
                </p>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card p-5">
              <h2 className="mb-2 flex items-center gap-2 text-lg font-semibold text-ink-50">
                <GraduationCap size={18} className="text-brass-300" /> Coaching
              </h2>
              <button
                onClick={getFeedback}
                disabled={busy || turns.length < 2}
                className="btn-primary w-full"
              >
                Score my performance
              </button>

              {feedback && (
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center gap-3">
                    <div className="text-3xl font-bold text-brass-300">{feedback.score}</div>
                    <div className="text-xs text-ink-400">/ 100 preparedness</div>
                  </div>
                  {feedback.strengths.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-emerald-300">
                        Strengths
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-200">
                        {feedback.strengths.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.improvements.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-amber-300">
                        Improve
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-200">
                        {feedback.improvements.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {feedback.missedObjections.length > 0 && (
                    <div>
                      <div className="text-xs font-semibold uppercase tracking-wide text-red-300">
                        Missed objections
                      </div>
                      <ul className="mt-1 list-disc space-y-1 pl-5 text-ink-200">
                        {feedback.missedObjections.map((s, i) => (
                          <li key={i}>{s}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <Disclaimer />
    </div>
  );
}
