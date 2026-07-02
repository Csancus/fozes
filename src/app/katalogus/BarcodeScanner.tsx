"use client";

import { useEffect, useRef, useState } from "react";
import { Camera, X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/Button";

type BarcodeDetectorLike = {
  detect: (
    source: HTMLVideoElement | HTMLCanvasElement | ImageBitmap
  ) => Promise<{ rawValue: string }[]>;
};

type BarcodeDetectorCtor = {
  new (options?: { formats?: string[] }): BarcodeDetectorLike;
  getSupportedFormats?: () => Promise<string[]>;
};

declare global {
  interface Window {
    BarcodeDetector?: BarcodeDetectorCtor;
  }
}

const FORMATS = ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"];

export function BarcodeScanner({
  open,
  onClose,
  onDetected,
}: {
  open: boolean;
  onClose: () => void;
  onDetected: (code: string) => void;
}) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [manual, setManual] = useState("");

  useEffect(() => {
    if (!open) return;
    const isSupported =
      typeof window !== "undefined" && "BarcodeDetector" in window;
    setSupported(isSupported);
    if (!isSupported) return;

    let cancelled = false;

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: "environment" } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const Ctor = window.BarcodeDetector!;
        const detector = new Ctor({ formats: FORMATS });

        const loop = async () => {
          if (cancelled || !videoRef.current) return;
          try {
            const codes = await detector.detect(videoRef.current);
            const c = codes[0]?.rawValue;
            if (c) {
              stop();
              onDetected(c);
              return;
            }
          } catch {
            // ignore per-frame errors
          }
          rafRef.current = requestAnimationFrame(loop);
        };
        rafRef.current = requestAnimationFrame(loop);
      } catch (e) {
        setError(
          e instanceof Error
            ? e.message
            : "Kamera nem elérhető. Írd be a vonalkódot kézzel."
        );
      }
    }

    function stop() {
      cancelled = true;
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
        streamRef.current = null;
      }
    }

    start();
    return stop;
  }, [open, onDetected]);

  function close() {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    onClose();
  }

  function submitManual(e: React.FormEvent) {
    e.preventDefault();
    const code = manual.replace(/\D/g, "");
    if (code.length >= 6) {
      onDetected(code);
    }
  }

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-[var(--color-card)] shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-2">
            <Camera className="w-4 h-4 text-[var(--color-primary)]" />
            <span className="font-semibold text-sm">Vonalkód olvasás</span>
          </div>
          <button
            onClick={close}
            className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-[var(--color-muted)]"
            aria-label="Bezárás"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="relative aspect-square bg-black">
          {supported === null && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              <Loader2 className="w-6 h-6 animate-spin" />
            </div>
          )}
          {supported === false && (
            <div className="absolute inset-0 flex items-center justify-center text-white p-6 text-center text-sm">
              A böngésző nem támogatja a natív vonalkód-olvasást. Írd be a
              vonalkódot kézzel:
            </div>
          )}
          {supported === true && (
            <>
              <video
                ref={videoRef}
                playsInline
                muted
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-4/5 h-24 border-2 border-white/60 rounded-lg" />
              </div>
            </>
          )}
          {error && (
            <div className="absolute bottom-2 left-2 right-2 bg-red-600/90 text-white text-xs rounded-lg p-2 text-center">
              {error}
            </div>
          )}
        </div>

        <form onSubmit={submitManual} className="p-3 flex gap-2">
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            value={manual}
            onChange={(e) => setManual(e.target.value)}
            placeholder="Vagy írd be kézzel (EAN-13)"
            className="flex-1 h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm"
          />
          <Button
            type="submit"
            size="sm"
            disabled={manual.replace(/\D/g, "").length < 6}
          >
            Kész
          </Button>
        </form>
      </div>
    </div>
  );
}
