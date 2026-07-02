"use client";

import { useState, useRef } from "react";
import { Image as ImageIcon, X, RefreshCcw } from "lucide-react";

const MAX_DIM = 1200;
const QUALITY = 0.82;

async function fileToResizedDataUrl(file: File): Promise<string> {
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
    if (w > MAX_DIM || h > MAX_DIM) {
      const s = MAX_DIM / Math.max(w, h);
      w = Math.round(w * s);
      h = Math.round(h * s);
    }
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("no ctx");
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL("image/webp", QUALITY);
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function RecipeImageInput({ initial }: { initial?: string | null }) {
  const [dataUrl, setDataUrl] = useState<string | null>(initial ?? null);
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setBusy(true);
    try {
      const url = await fileToResizedDataUrl(file);
      setDataUrl(url);
    } catch {
      alert("Nem sikerült beolvasni a képet.");
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name="imageUrl" value={dataUrl ?? ""} />
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        onChange={onPick}
        className="hidden"
        id="recipe-image-file"
      />

      {dataUrl ? (
        <div className="relative rounded-2xl overflow-hidden border border-[var(--color-border)] bg-[var(--color-muted)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={dataUrl}
            alt="Recept borító"
            className="w-full h-48 md:h-64 object-cover"
          />
          <div className="absolute top-2 right-2 flex gap-2">
            <label
              htmlFor="recipe-image-file"
              className="h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75 cursor-pointer"
              aria-label="Kép cseréje"
              title="Kép cseréje"
            >
              <RefreshCcw className="w-4 h-4" />
            </label>
            <button
              type="button"
              onClick={() => setDataUrl(null)}
              className="h-9 w-9 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/75"
              aria-label="Kép eltávolítása"
              title="Kép eltávolítása"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        <label
          htmlFor="recipe-image-file"
          className="flex items-center justify-center gap-2 h-24 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/30 text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] cursor-pointer transition"
        >
          <ImageIcon className="w-4 h-4" />
          <span className="text-sm">
            {busy ? "Feltöltés…" : "Borítókép választása"}
          </span>
        </label>
      )}
    </div>
  );
}
