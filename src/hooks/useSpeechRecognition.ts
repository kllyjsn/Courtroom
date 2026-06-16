import { useCallback, useEffect, useRef, useState } from "react";

// Minimal typings for the Web Speech API (not in lib.dom by default).
interface SpeechRecognitionAlternative {
  transcript: string;
}
interface SpeechRecognitionResult {
  0: SpeechRecognitionAlternative;
  isFinal: boolean;
  length: number;
}
interface SpeechRecognitionResultList {
  length: number;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}
interface ISpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((e: SpeechRecognitionEvent) => void) | null;
  onerror: ((e: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
}
type SpeechRecognitionCtor = new () => ISpeechRecognition;

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  }
}

export interface SpeechHook {
  supported: boolean;
  listening: boolean;
  finalTranscript: string;
  interim: string;
  error: string | null;
  start: () => void;
  stop: () => void;
  reset: () => void;
}

export function useSpeechRecognition(lang = "en-US"): SpeechHook {
  const Ctor =
    typeof window !== "undefined"
      ? window.SpeechRecognition || window.webkitSpeechRecognition
      : undefined;
  const supported = !!Ctor;

  const [listening, setListening] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [error, setError] = useState<string | null>(null);

  const recRef = useRef<ISpeechRecognition | null>(null);
  const wantOnRef = useRef(false);

  useEffect(() => {
    if (!Ctor) return;
    const rec = new Ctor();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = lang;

    rec.onresult = (e) => {
      let interimText = "";
      let finalText = "";
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const r = e.results[i];
        const txt = r[0].transcript;
        if (r.isFinal) finalText += txt + " ";
        else interimText += txt;
      }
      if (finalText) setFinalTranscript((prev) => prev + finalText);
      setInterim(interimText);
    };

    rec.onerror = (e) => {
      if (e.error === "no-speech" || e.error === "aborted") return;
      setError(e.error);
    };

    rec.onend = () => {
      // Chrome stops periodically; restart if the user still wants to listen.
      if (wantOnRef.current) {
        try {
          rec.start();
        } catch {
          /* already started */
        }
      } else {
        setListening(false);
      }
    };

    recRef.current = rec;
    return () => {
      wantOnRef.current = false;
      try {
        rec.abort();
      } catch {
        /* ignore */
      }
    };
  }, [Ctor, lang]);

  const start = useCallback(() => {
    if (!recRef.current) return;
    setError(null);
    wantOnRef.current = true;
    try {
      recRef.current.start();
      setListening(true);
    } catch {
      /* already started */
    }
  }, []);

  const stop = useCallback(() => {
    wantOnRef.current = false;
    setListening(false);
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
  }, []);

  const reset = useCallback(() => {
    setFinalTranscript("");
    setInterim("");
  }, []);

  return { supported, listening, finalTranscript, interim, error, start, stop, reset };
}
