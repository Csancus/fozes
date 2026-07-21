"use client";

import { useCallback, useRef, useState } from "react";
import { cn } from "@/lib/cn";
import {
  Camera,
  Loader2,
  X,
  RefreshCcw,
  ImagePlus,
  Save,
  Trash2,
} from "lucide-react";
import { KindSelect } from "../KindSelect";
import type { SavedType } from "@/lib/types";

const URL_RE = /\bhttps?:\/\/[^\s()<>"']+/gi;
const COVER_MAX = 1200;
const COVER_QUALITY = 0.82;

function detectLinkKind(url: string): string | null {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "video";
  if (u.includes("/maps") || u.includes("maps.app") || u.includes("goo.gl/maps"))
    return "helyszin";
  if (u.includes("imdb.com") || u.includes("netflix.com")) return "film";
  if (u.includes("moly.hu") || u.includes("goodreads.com")) return "konyv";
  if (u.includes("booking.com") || u.includes("airbnb.") || u.includes("tripadvisor."))
    return "utazas";
  return "cikk";
}

const KEYWORDS: { kind: string; words: string[] }[] = [
  { kind: "etterem", words: ["étterem", "etterem", "restaurant", "bisztró", "bistro", "kávézó", "kavezo", "cukrászda", "vendéglő", "pizzéria", "pizza", "menü", "foglalás"] },
  { kind: "utazas", words: ["hotel", "szálloda", "apartman", "repülő", "repjegy", "flight", "járat", "booking", "airbnb", "nyaralás", "utazás", "túra", "szállás"] },
  { kind: "film", words: ["film", "sorozat", "évad", "epizód", "imdb", "netflix", "mozi"] },
  { kind: "konyv", words: ["könyv", "regény", "szerző", "kiadó", "goodreads"] },
  { kind: "helyszin", words: ["látnivaló", "kilátó", "múzeum", "kiállítás", "park", "vízesés", "templom"] },
];

const ADDRESS_RE =
  /(\b\d{4}\b|\butca\b|\bútja?\b|\bköru?t\b|\bkrt\.?\b|\btér\b|\bstreet\b|\bstr\.\b|\bavenue\b|\broad\b)/i;

function guessFromText(raw: string, types: SavedType[]) {
  const text = raw.replace(/\r/g, "");
  const lower = text.toLowerCase();
  const urls = Array.from(new Set(text.match(URL_RE) ?? [])).slice(0, 5);
  const links = urls.map((url) => ({ url, label: "" }));

  const known = (id: string) => types.some((t) => t.id === id);
  let kind = "egyeb";
  if (urls.length > 0) {
    const k = detectLinkKind(urls[0]);
    if (k && known(k)) kind = k;
  }
  if (kind === "egyeb" || kind === "cikk") {
    let best: { kind: string; hits: number } | null = null;
    for (const g of KEYWORDS) {
      const hits = g.words.reduce((n, w) => (lower.includes(w) ? n + 1 : n), 0);
      if (hits > 0 && (!best || hits > best.hits)) best = { kind: g.kind, hits };
    }
    if (best && known(best.kind)) kind = best.kind;
  }
  if (!known(kind)) kind = types[0]?.id ?? "egyeb";

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !URL_RE.test(l));
  const titleCandidates = lines
    .slice(0, 5)
    .filter((l) => /[a-zà-ú]/i.test(l) && l.length >= 3 && l.length <= 90);
  const title =
    titleCandidates.sort((a, b) => b.length - a.length)[0] ?? lines[0] ?? "";
  const location =
    lines.find((l) => l !== title && ADDRESS_RE.test(l))?.slice(0, 120) ?? "";

  return { title, kind, location, links, note: text.trim().slice(0, 2000) };
}

async function compressImage(file: File): Promise<string> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new window.Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = url;
    });
    let w = img.naturalWidth;
    let h = img.naturalHeight;
    if (w > COVER_MAX || h > COVER_MAX) {
      const s = COVER_MAX / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no ctx");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/webp", COVER_QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

type LinkEntry = { url: string; label: string };
type Draft = {
  key: string;
  title: string;
  kind: string;
  location: string;
  note: string;
  tags: string;
  cover: string | null; // data URL (kép egészben, tömörítve)
  rawText: string;
  links: LinkEntry[];
};

let counter = 0;
function uid() {
  counter += 1;
  return `d${counter}`;
}

export function OcrImport({
  action,
  types = [],
  myId,
  members = [],
  hasSurprisePw = false,
}: {
  action: (fd: FormData) => void | Promise<void>;
  types?: SavedType[];
  myId?: string;
  members?: { id: string; name: string }[];
  hasSurprisePw?: boolean;
}) {
  void myId;
  void members;
  void hasSurprisePw;
  const [typeList, setTypeList] = useState<SavedType[]>(types);
  const [drafts, setDrafts] = useState<Draft[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; status: string; pct: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [saving, setSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);

  const processFiles = useCallback(
    async (files: File[], curTypes: SavedType[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;
      setBusy(true);
      setProgress({ done: 0, total: images.length, status: "Modell betöltése…", pct: 0 });
      const tesseract = await import("tesseract.js");

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        setProgress({ done: i, total: images.length, status: "Szöveg kiolvasása…", pct: 0 });

        let cover: string | null = null;
        try {
          cover = await compressImage(file);
        } catch {
          cover = null;
        }

        let text = "";
        try {
          const result = await tesseract.recognize(file, "hun+eng", {
            logger: (m: { status: string; progress?: number }) => {
              if (typeof m.progress === "number")
                setProgress((p) => (p ? { ...p, pct: Math.round(m.progress! * 100) } : p));
            },
          });
          text = result.data.text ?? "";
        } catch {
          text = "";
        }

        const g = guessFromText(text, curTypes);
        setDrafts((cur) => [
          ...cur,
          {
            key: uid(),
            title: g.title,
            kind: g.kind,
            location: g.location,
            note: g.note,
            tags: "",
            cover,
            rawText: text,
            links: g.links,
          },
        ]);
        setProgress({ done: i + 1, total: images.length, status: "Kész", pct: 100 });
      }

      setBusy(false);
      setProgress(null);
    },
    []
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) void processFiles(files, typeList);
    if (inputRef.current) inputRef.current.value = "";
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) void processFiles(files, typeList);
  }

  function updateDraft(key: string, patch: Partial<Draft>) {
    setDrafts((cur) => cur.map((d) => (d.key === key ? { ...d, ...patch } : d)));
  }
  function removeDraft(key: string) {
    setDrafts((cur) => cur.filter((d) => d.key !== key));
  }
  function onTypeCreated(t: SavedType) {
    setTypeList((cur) => (cur.some((x) => x.id === t.id) ? cur : [...cur, t]));
  }

  const valid = drafts.filter((d) => d.title.trim());

  function saveAll() {
    const payload = valid.map((d) => ({
      title: d.title,
      kind: d.kind,
      location: d.location,
      note: d.note,
      tags: d.tags,
      imageUrl: d.cover ?? "",
      links: d.links.filter((l) => l.url.trim()),
    }));
    const fd = new FormData();
    fd.set("drafts", JSON.stringify(payload));
    setSaving(true);
    void action(fd);
  }

  return (
    <div
      className="mt-6"
      onDragEnter={(e) => {
        e.preventDefault();
        dragDepth.current += 1;
        setDragOver(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        dragDepth.current -= 1;
        if (dragDepth.current <= 0) setDragOver(false);
      }}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={onPick}
        className="hidden"
        id="ocr-file"
      />

      {/* Dropzone */}
      <label
        htmlFor="ocr-file"
        className={cn(
          "flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed cursor-pointer transition text-center px-6",
          drafts.length > 0 ? "h-28" : "h-52",
          dragOver
            ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            : "border-[var(--color-border)] bg-[var(--color-muted)]/30 text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]"
        )}
      >
        {drafts.length > 0 ? (
          <>
            <ImagePlus className="w-6 h-6" />
            <span className="text-sm font-medium">
              További képek húzása ide vagy tallózás
            </span>
          </>
        ) : (
          <>
            <Camera className="w-7 h-7" />
            <div>
              <p className="text-sm font-medium">
                Húzz ide képeket, vagy kattints a tallózáshoz
              </p>
              <p className="mt-1 text-xs">
                Több kép egyszerre is — mindegyikből külön elem lesz, amit
                szerkeszthetsz mentés előtt.
              </p>
            </div>
          </>
        )}
      </label>

      {/* Feldolgozás állapot */}
      {busy && progress && (
        <div className="mt-4 flex items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3">
          <Loader2 className="w-5 h-5 animate-spin text-[var(--color-primary)] shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">
              {progress.done}/{progress.total} kép feldolgozása — {progress.status}
            </p>
            <div className="mt-1.5 h-1.5 w-full rounded-full bg-[var(--color-muted)] overflow-hidden">
              <div
                className="h-full bg-[var(--color-primary)] transition-all"
                style={{ width: `${progress.pct}%` }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Piszkozat lista */}
      {drafts.length > 0 && (
        <div className="mt-5 space-y-4 pb-28">
          {drafts.map((d, i) => (
            <DraftCard
              key={d.key}
              index={i}
              draft={d}
              types={typeList}
              onChange={(patch) => updateDraft(d.key, patch)}
              onRemove={() => removeDraft(d.key)}
              onTypeCreated={onTypeCreated}
            />
          ))}
        </div>
      )}

      {/* Mentés-sáv */}
      {drafts.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-md md:pl-64">
          <div className="max-w-md md:max-w-4xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setDrafts([])}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-red-600"
            >
              <Trash2 className="w-4 h-4" /> Mind elvetése
            </button>
            <button
              type="button"
              onClick={saveAll}
              disabled={valid.length === 0 || saving}
              className="h-11 px-5 rounded-xl bg-[var(--color-primary)] text-white font-medium inline-flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-40 transition"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {valid.length} elem mentése
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function DraftCard({
  index,
  draft,
  types,
  onChange,
  onRemove,
  onTypeCreated,
}: {
  index: number;
  draft: Draft;
  types: SavedType[];
  onChange: (patch: Partial<Draft>) => void;
  onRemove: () => void;
  onTypeCreated: (t: SavedType) => void;
}) {
  const inputCls =
    "h-10 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]";
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="grid gap-4 sm:grid-cols-[160px_1fr]">
        {/* Kép */}
        <div>
          <span className="block text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">
            Kép
          </span>
          {draft.cover ? (
            <div className="relative rounded-xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-muted)]">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={draft.cover} alt="" className="w-full h-32 object-cover" />
              <button
                type="button"
                onClick={() => onChange({ cover: null })}
                className="absolute top-1.5 right-1.5 h-7 w-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75"
                aria-label="Kép eltávolítása"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <div className="h-32 rounded-xl border-2 border-dashed border-[var(--color-border)] flex items-center justify-center text-xs text-[var(--color-muted-foreground)]">
              nincs kép
            </div>
          )}
        </div>

        {/* Mezők */}
        <div className="space-y-2.5">
          <div className="flex items-start gap-2">
            <input
              value={draft.title}
              onChange={(e) => onChange({ title: e.target.value })}
              placeholder="Cím / név"
              autoFocus={index === 0}
              className={cn(inputCls, "font-medium")}
            />
            <button
              type="button"
              onClick={onRemove}
              className="mt-1 h-8 w-8 shrink-0 flex items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:text-red-600 hover:bg-red-500/10"
              aria-label="Elem elvetése"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <KindSelect
              types={types}
              value={draft.kind}
              onChange={(id) => onChange({ kind: id })}
              onCreated={onTypeCreated}
              className={cn(inputCls, "text-left")}
            />
            <input
              value={draft.location}
              onChange={(e) => onChange({ location: e.target.value })}
              placeholder="Hol / cím"
              className={inputCls}
            />
          </div>

          <input
            value={draft.tags}
            onChange={(e) => onChange({ tags: e.target.value })}
            placeholder="Címkék (vesszővel)"
            className={inputCls}
          />

          <textarea
            value={draft.note}
            onChange={(e) => onChange({ note: e.target.value })}
            placeholder="Jegyzet"
            rows={2}
            className="w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]"
          />

          {draft.rawText.trim() && (
            <details className="text-xs">
              <summary className="cursor-pointer text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
                Kiolvasott szöveg
              </summary>
              <pre className="mt-1.5 whitespace-pre-wrap break-words rounded-lg bg-[var(--color-muted)] p-2 text-[11px] leading-snug text-[var(--color-muted-foreground)] max-h-40 overflow-auto">
                {draft.rawText.trim()}
              </pre>
            </details>
          )}
        </div>
      </div>
    </div>
  );
}
