"use client";

import { useEffect, useState } from "react";
import { X, Maximize2 } from "lucide-react";

// Borító kép a detail oldalon: kattintásra teljes nézetben (lightbox) mutatja
// a feltöltött képet — vágás nélkül, object-contain.
export function SavedCover({ src, alt }: { src: string; alt: string }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open]);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 block w-full rounded-2xl overflow-hidden border border-[var(--color-border)] group relative"
        aria-label="Kép megnyitása teljes nézetben"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={src} alt={alt} className="w-full max-h-72 object-cover" />
        <span className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-black/55 text-white flex items-center justify-center opacity-80 group-hover:opacity-100 transition">
          <Maximize2 className="w-4 h-4" />
        </span>
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="absolute top-4 right-4 h-10 w-10 rounded-full bg-white/10 text-white flex items-center justify-center hover:bg-white/20"
            aria-label="Bezárás"
          >
            <X className="w-5 h-5" />
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            className="max-w-full max-h-full object-contain rounded-lg"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
