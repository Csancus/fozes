"use client";

import { useEffect, useRef, useState } from "react";
import { Mic, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/cn";

export type RecordedAudio = {
  id: string;
  name: string;
  mime: string;
  size: number;
  dataUrl: string;
};

function uid(): string {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
}

function readAsDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = reject;
    r.readAsDataURL(blob);
  });
}

function pickMimeType(): string {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"];
  for (const c of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported?.(c)) {
      return c;
    }
  }
  return "";
}

function fmtTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

// Hangjegyzet felvétele (MediaRecorder) + élő, ingyenes leirat a böngésző
// Web Speech API-jával (Chrome/Edge alatt van; máshol csak a felvétel megy,
// a leiratot a szülő kézzel is szerkeszthetővé teszi).
export function VoiceRecorder({
  onRecorded,
  onTranscript,
}: {
  onRecorded: (audio: RecordedAudio) => void;
  onTranscript?: (text: string) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [busy, setBusy] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [liveText, setLiveText] = useState("");
  const [speechSupported, setSpeechSupported] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const finalTextRef = useRef("");
  const stoppingRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const w = window as any;
    setSpeechSupported(!!(w.SpeechRecognition || w.webkitSpeechRecognition));
    return () => {
      stopAll();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function stopAll() {
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = null;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.onresult = null;
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }

  async function start() {
    setError(null);
    setLiveText("");
    finalTextRef.current = "";
    stoppingRef.current = false;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mimeType = pickMimeType();
      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined);
      chunksRef.current = [];
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorder.onstop = async () => {
        setBusy(true);
        try {
          const blob = new Blob(chunksRef.current, {
            type: recorder.mimeType || "audio/webm",
          });
          const dataUrl = await readAsDataUrl(blob);
          const ext = (recorder.mimeType || "audio/webm").includes("mp4") ? "m4a" : "webm";
          onRecorded({
            id: uid(),
            name: `hangjegyzet-${Date.now()}.${ext}`,
            mime: recorder.mimeType || "audio/webm",
            size: blob.size,
            dataUrl,
          });
          const finalTranscript = finalTextRef.current.trim();
          if (finalTranscript && onTranscript) onTranscript(finalTranscript);
        } catch {
          setError("Nem sikerült a felvétel mentése.");
        } finally {
          setBusy(false);
        }
      };
      recorder.start();
      recorderRef.current = recorder;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const SR = w.SpeechRecognition || w.webkitSpeechRecognition;
      if (SR) {
        const recognition = new SR();
        recognition.lang = "hu-HU";
        recognition.continuous = true;
        recognition.interimResults = true;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        recognition.onresult = (e: any) => {
          let interim = "";
          let final = finalTextRef.current;
          for (let i = e.resultIndex; i < e.results.length; i++) {
            const res = e.results[i];
            if (res.isFinal) {
              final = `${final} ${res[0].transcript}`.trim();
            } else {
              interim += res[0].transcript;
            }
          }
          finalTextRef.current = final;
          setLiveText(`${final} ${interim}`.trim());
        };
        recognition.onerror = () => {};
        recognition.onend = () => {
          // Chrome néha magától leállítja hosszabb csend után — amíg tényleg
          // felvétel megy (és nem mi állítottuk le), indítsuk újra.
          if (!stoppingRef.current) {
            try {
              recognition.start();
            } catch {}
          }
        };
        try {
          recognition.start();
          recognitionRef.current = recognition;
        } catch {}
      }

      setElapsed(0);
      timerRef.current = setInterval(() => setElapsed((s) => s + 1), 1000);
      setRecording(true);
    } catch {
      setError("Nincs hozzáférés a mikrofonhoz.");
    }
  }

  function stop() {
    stoppingRef.current = true;
    setRecording(false);
    stopAll();
    if (recorderRef.current && recorderRef.current.state !== "inactive") {
      recorderRef.current.stop();
    }
    recorderRef.current = null;
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-muted)]/30 p-4">
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={recording ? stop : start}
          disabled={busy}
          className={cn(
            "w-12 h-12 rounded-full flex items-center justify-center shrink-0 transition",
            recording
              ? "bg-red-600 text-white animate-pulse"
              : "bg-[var(--color-primary)] text-white hover:brightness-110",
            busy && "opacity-60"
          )}
          aria-label={recording ? "Felvétel leállítása" : "Hangfelvétel indítása"}
        >
          {busy ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : recording ? (
            <Square className="w-5 h-5" />
          ) : (
            <Mic className="w-5 h-5" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium">
            {recording
              ? `Felvétel… ${fmtTime(elapsed)}`
              : busy
              ? "Feldolgozás…"
              : "Hangjegyzet felvétele"}
          </p>
          {recording && liveText && (
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] italic line-clamp-2">
              {liveText}
            </p>
          )}
          {!recording && !speechSupported && (
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              Ez a böngésző nem támogatja az élő leiratot — a felvétel enélkül is
              elkészül, a leiratot kézzel is beírhatod.
            </p>
          )}
          {error && <p className="mt-0.5 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </div>
  );
}
