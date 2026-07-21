"use client";

import { useRef, useState } from "react";
import { cn } from "@/lib/cn";
import { Camera, Loader2, RefreshCcw, Sparkles } from "lucide-react";
import { SavedForm } from "../SavedForm";
import { SAVED_KINDS } from "@/lib/types";
import type { SavedItem, SavedKind, SavedLink } from "@/lib/types";

type Draft = SavedItem;

const URL_RE = /\bhttps?:\/\/[^\s()<>"']+/gi;

function detectLinkKind(url: string): SavedKind | null {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "video";
  if (u.includes("/maps") || u.includes("maps.app") || u.includes("goo.gl/maps"))
    return "helyszin";
  if (u.includes("imdb.com") || u.includes("netflix.com")) return "film";
  if (u.includes("moly.hu") || u.includes("goodreads.com")) return "konyv";
  if (
    u.includes("booking.com") ||
    u.includes("airbnb.") ||
    u.includes("tripadvisor.")
  )
    return "utazas";
  return "cikk";
}

const KEYWORDS: { kind: SavedKind; words: string[] }[] = [
  {
    kind: "etterem",
    words: [
      "étterem",
      "etterem",
      "restaurant",
      "bisztró",
      "bistro",
      "kávézó",
      "kavezo",
      "cukrászda",
      "vendéglő",
      "pizzéria",
      "pizza",
      "menü",
      "foglalás",
      "asztalfoglalás",
    ],
  },
  {
    kind: "utazas",
    words: [
      "hotel",
      "szálloda",
      "apartman",
      "repülő",
      "repjegy",
      "flight",
      "járat",
      "booking",
      "airbnb",
      "nyaralás",
      "utazás",
      "túra",
      "szállás",
    ],
  },
  {
    kind: "film",
    words: ["film", "sorozat", "évad", "epizód", "imdb", "netflix", "mozi"],
  },
  {
    kind: "konyv",
    words: ["könyv", "regény", "szerző", "kiadó", "olvasnivaló", "goodreads"],
  },
  {
    kind: "helyszin",
    words: [
      "látnivaló",
      "kilátó",
      "múzeum",
      "kiállítás",
      "park",
      "vízesés",
      "templom",
    ],
  },
];

const ADDRESS_RE =
  /(\b\d{4}\b|\butca\b|\bútja?\b|\bköru?t\b|\bkrt\.?\b|\btér\b|\bstreet\b|\bstr\.\b|\bavenue\b|\broad\b)/i;

function guessFromText(raw: string): {
  title: string;
  kind: SavedKind;
  location: string;
  links: SavedLink[];
  note: string;
} {
  const text = raw.replace(/\r/g, "");
  const lower = text.toLowerCase();

  // Linkek
  const urls = Array.from(new Set(text.match(URL_RE) ?? [])).slice(0, 5);
  const links: SavedLink[] = urls.map((url) => ({ url, label: "" }));

  // Típus: előbb linkből, aztán kulcsszavakból
  let kind: SavedKind = "egyeb";
  if (urls.length > 0) {
    const k = detectLinkKind(urls[0]);
    if (k) kind = k;
  }
  if (kind === "egyeb" || kind === "cikk") {
    let best: { kind: SavedKind; hits: number } | null = null;
    for (const group of KEYWORDS) {
      const hits = group.words.reduce(
        (n, w) => (lower.includes(w) ? n + 1 : n),
        0
      );
      if (hits > 0 && (!best || hits > best.hits))
        best = { kind: group.kind, hits };
    }
    if (best) kind = best.kind;
  }

  // Sorok tisztítása
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !URL_RE.test(l));

  // Cím: az első 5 sorból a leghosszabb értelmes (nem csak szám / szimbólum)
  const titleCandidates = lines
    .slice(0, 5)
    .filter((l) => /[a-zà-ú]/i.test(l) && l.length >= 3 && l.length <= 90);
  const title =
    titleCandidates.sort((a, b) => b.length - a.length)[0] ?? lines[0] ?? "";

  // Helyszín: első cím-szerű sor (a címként választottat kivéve)
  const location =
    lines.find((l) => l !== title && ADDRESS_RE.test(l))?.slice(0, 120) ?? "";

  return { title, kind, location, links, note: text.trim().slice(0, 2000) };
}

export function OcrImport({
  action,
  types = [],
  members = [],
  myId,
  hasSurprisePw = false,
}: {
  action: (fd: FormData) => void | Promise<void>;
  types?: import("@/lib/types").SavedType[];
  members?: { id: string; name: string }[];
  myId?: string;
  hasSurprisePw?: boolean;
}) {
  const [phase, setPhase] = useState<"idle" | "running" | "done" | "error">(
    "idle"
  );
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [rawText, setRawText] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function runOcr(file: File) {
    setPhase("running");
    setError(null);
    setProgress(0);
    setStatus("Modell betöltése…");
    setDraft(null);

    const url = URL.createObjectURL(file);
    setPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    try {
      const tesseract = await import("tesseract.js");
      const result = await tesseract.recognize(file, "hun+eng", {
        logger: (m: { status: string; progress?: number }) => {
          if (typeof m.progress === "number")
            setProgress(Math.round(m.progress * 100));
          if (m.status) setStatus(m.status);
        },
      });
      const text = result.data.text ?? "";
      setRawText(text);

      const g = guessFromText(text);
      const now = Date.now();
      setDraft({
        id: "", // üres → új elemként mentődik
        title: g.title,
        kind: SAVED_KINDS.includes(g.kind) ? g.kind : "egyeb",
        note: g.note,
        location: g.location,
        imageUrl: null,
        links: g.links,
        files: [],
        tags: [],
        done: false,
        doneAt: null,
        surpriseFor: null,
        createdAt: now,
        updatedAt: now,
      });
      setProgress(100);
      setPhase("done");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Ismeretlen OCR hiba történt."
      );
      setPhase("error");
    }
  }

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) void runOcr(file);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="mt-6 space-y-6">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
        id="ocr-file"
      />

      {phase === "idle" && (
        <label
          htmlFor="ocr-file"
          className="flex flex-col items-center justify-center gap-3 h-52 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] cursor-pointer transition text-center px-6"
        >
          <Camera className="w-7 h-7" />
          <div>
            <p className="text-sm font-medium">Kép vagy képernyőkép választása</p>
            <p className="mt-1 text-xs">
              Kiolvassuk a szöveget, és megpróbálunk belőle elemet készíteni —
              utána szerkesztheted.
            </p>
          </div>
        </label>
      )}

      {phase === "running" && (
        <div className="flex flex-col items-center justify-center gap-3 h-52 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] text-center px-6">
          <Loader2 className="w-7 h-7 animate-spin text-[var(--color-primary)]" />
          <div className="w-full max-w-xs">
            <p className="text-sm font-medium">Szöveg kiolvasása…</p>
            <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)]">
              {status} · {progress}%
            </p>
            <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-muted)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {phase === "error" && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/5 p-5 text-center">
          <p className="text-sm font-medium text-red-600">Nem sikerült a kiolvasás</p>
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">{error}</p>
          <label
            htmlFor="ocr-file"
            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] cursor-pointer"
          >
            <RefreshCcw className="w-4 h-4" /> Másik kép
          </label>
        </div>
      )}

      {phase === "done" && draft && (
        <div className="space-y-5">
          <div className="flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-primary-soft)] px-4 py-3">
            <Sparkles className="w-5 h-5 text-[var(--color-primary)] shrink-0" />
            <p className="text-sm text-[var(--color-foreground)]">
              Kész a piszkozat a képből. Nézd át, javítsd, majd mentsd.
            </p>
            <label
              htmlFor="ocr-file"
              className="ml-auto inline-flex items-center gap-1.5 text-[13px] font-medium text-[var(--color-primary)] cursor-pointer whitespace-nowrap"
            >
              <RefreshCcw className="w-4 h-4" /> Másik kép
            </label>
          </div>

          <div className="grid gap-5 md:grid-cols-[200px_1fr] md:items-start">
            {preview && (
              <div className="space-y-2">
                <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-muted)]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={preview}
                    alt="Feltöltött kép"
                    className="w-full object-contain max-h-64"
                  />
                </div>
                {rawText.trim() && (
                  <details className="text-xs">
                    <summary className="cursor-pointer text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                      Kiolvasott szöveg
                    </summary>
                    <pre className="mt-2 whitespace-pre-wrap break-words rounded-lg bg-[var(--color-muted)] p-2 text-[11px] leading-snug text-[var(--color-muted-foreground)] max-h-48 overflow-auto">
                      {rawText.trim()}
                    </pre>
                  </details>
                )}
              </div>
            )}

            <div>
              <SavedForm
                key={draft.createdAt}
                action={action}
                initial={draft}
                types={types}
                members={members}
                myId={myId}
                hasSurprisePw={hasSurprisePw}
              />
            </div>
          </div>
        </div>
      )}

      {phase === "idle" && (
        <p className={cn("text-xs text-[var(--color-muted-foreground)]")}>
          Az OCR a böngésződben fut (tesseract.js, magyar+angol). Az első
          futtatás pár másodperccel tovább tart a modell letöltése miatt.
        </p>
      )}
    </div>
  );
}
