"use client";

import { useState } from "react";
import { createPurchaseAction } from "../actions";

function todayInput(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-50";

export function NewPurchaseForm() {
  const [source, setSource] = useState<"text" | "pdf">("text");

  return (
    <form action={createPurchaseAction} className="space-y-4">
      <input type="hidden" name="source" value={source} />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Bolt</span>
          <input
            name="store"
            placeholder="pl. Lidl, Tesco"
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Dátum</span>
          <input
            name="purchasedAt"
            type="date"
            defaultValue={todayInput()}
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>

      <div>
        <div className="text-sm text-zinc-700 dark:text-zinc-300 mb-2">Forrás</div>
        <div className="inline-flex rounded-lg border border-zinc-300 dark:border-zinc-700 overflow-hidden">
          <button
            type="button"
            onClick={() => setSource("text")}
            className={`px-4 py-2 text-sm ${
              source === "text"
                ? "bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900"
                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            Szöveg
          </button>
          <button
            type="button"
            onClick={() => setSource("pdf")}
            className={`px-4 py-2 text-sm border-l border-zinc-300 dark:border-zinc-700 ${
              source === "pdf"
                ? "bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900"
                : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
            }`}
          >
            PDF
          </button>
        </div>
      </div>

      {source === "text" ? (
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Blokk szövege
          </span>
          <textarea
            name="raw"
            rows={12}
            placeholder="Illeszd be ide a blokk teljes szövegét..."
            className={`${inputClass} mt-1 font-mono text-xs`}
          />
        </label>
      ) : (
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            PDF blokk
          </span>
          <input
            name="pdf"
            type="file"
            accept="application/pdf"
            className="mt-1 block w-full text-sm text-zinc-700 dark:text-zinc-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-900 dark:file:bg-zinc-50 file:text-zinc-50 dark:file:text-zinc-900 file:text-sm file:font-medium"
          />
          <span className="text-xs text-zinc-500 mt-1 block">
            A rendszer kinyeri a szöveget és értelmezi a tételeket.
          </span>
        </label>
      )}

      <button
        className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 py-3 font-medium"
      >
        Feldolgozás
      </button>
    </form>
  );
}
