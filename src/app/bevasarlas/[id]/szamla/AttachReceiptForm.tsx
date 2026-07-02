"use client";

import { useRef, useState } from "react";
import type { Location, ShoppingList } from "@/lib/types";
import { parseAndMatchAction } from "./actions";

function todayInput(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-50";

type Mode = "text" | "pdf" | "photo";

export function AttachReceiptForm({
  list,
  locations: _locations,
}: {
  list: ShoppingList;
  locations: Location[];
}) {
  const [mode, setMode] = useState<Mode>("text");
  const [textValue, setTextValue] = useState("");
  const [ocrText, setOcrText] = useState("");
  const [ocrProgress, setOcrProgress] = useState<number | null>(null);
  const [ocrStatus, setOcrStatus] = useState<string>("");
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function runOcr(file: File) {
    setOcrError(null);
    setOcrText("");
    setOcrProgress(0);
    setOcrStatus("Modell betöltése...");

    // Preview
    const url = URL.createObjectURL(file);
    setPhotoPreview((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });

    try {
      // Dynamic import so tesseract.js only loads client-side on demand.
      const tesseract = await import("tesseract.js");
      const result = await tesseract.recognize(file, "hun+eng", {
        logger: (m: { status: string; progress?: number }) => {
          if (typeof m.progress === "number") {
            setOcrProgress(Math.round(m.progress * 100));
          }
          if (m.status) {
            setOcrStatus(m.status);
          }
        },
      });
      const text = result.data.text ?? "";
      setOcrText(text);
      setOcrProgress(100);
      setOcrStatus("Kész");
    } catch (err) {
      setOcrError(
        err instanceof Error ? err.message : "Ismeretlen OCR hiba történt."
      );
      setOcrProgress(null);
      setOcrStatus("");
    }
  }

  function onPhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    void runOcr(file);
  }

  return (
    <form
      ref={formRef}
      action={parseAndMatchAction}
      encType="multipart/form-data"
      className="space-y-4"
    >
      <input type="hidden" name="listId" value={list.id} />
      <input type="hidden" name="mode" value={mode} />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Bolt neve</span>
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
          <TabButton active={mode === "text"} onClick={() => setMode("text")}>
            Szöveg
          </TabButton>
          <TabButton
            active={mode === "pdf"}
            onClick={() => setMode("pdf")}
            border
          >
            PDF
          </TabButton>
          <TabButton
            active={mode === "photo"}
            onClick={() => setMode("photo")}
            border
          >
            Fotó
          </TabButton>
        </div>
      </div>

      {mode === "text" && (
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">
            Blokk szövege
          </span>
          <textarea
            name="raw"
            rows={12}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Illeszd be ide a blokk teljes szövegét..."
            className={`${inputClass} mt-1 font-mono text-xs`}
          />
        </label>
      )}

      {mode === "pdf" && (
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">PDF blokk</span>
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

      {mode === "photo" && (
        <div className="space-y-3">
          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Blokk fotó
            </span>
            <input
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPhotoChange}
              className="mt-1 block w-full text-sm text-zinc-700 dark:text-zinc-300 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:bg-zinc-900 dark:file:bg-zinc-50 file:text-zinc-50 dark:file:text-zinc-900 file:text-sm file:font-medium"
            />
            <span className="text-xs text-zinc-500 mt-1 block">
              Az OCR a böngésződben fut (tesseract.js, magyar+angol). Az első
              betöltés kb. 15 MB.
            </span>
          </label>

          {photoPreview && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Blokk előnézet"
                className="max-h-64 w-auto mx-auto rounded"
              />
            </div>
          )}

          {ocrProgress !== null && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
              <div className="text-xs text-zinc-600 dark:text-zinc-400 mb-1">
                {ocrStatus} — {ocrProgress}%
              </div>
              <div className="h-2 w-full rounded bg-zinc-200 dark:bg-zinc-800 overflow-hidden">
                <div
                  className="h-full bg-zinc-900 dark:bg-zinc-50 transition-[width] duration-200"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </div>
          )}

          {ocrError && (
            <div className="rounded-xl border border-red-300 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
              {ocrError}
            </div>
          )}

          <label className="block">
            <span className="text-sm text-zinc-700 dark:text-zinc-300">
              Felismert szöveg (szerkeszthető)
            </span>
            <textarea
              rows={10}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Itt jelenik meg az OCR eredménye..."
              className={`${inputClass} mt-1 font-mono text-xs`}
            />
          </label>

          {/* Server action reads the OCR text via `raw` when mode=photo */}
          <input type="hidden" name="raw" value={ocrText} />
        </div>
      )}

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 py-3 font-medium"
      >
        Parseolás és összekötés
      </button>
    </form>
  );
}

function TabButton({
  active,
  border = false,
  onClick,
  children,
}: {
  active: boolean;
  border?: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`px-4 py-2 text-sm ${
        border ? "border-l border-zinc-300 dark:border-zinc-700" : ""
      } ${
        active
          ? "bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900"
          : "bg-white dark:bg-zinc-900 text-zinc-700 dark:text-zinc-300"
      }`}
    >
      {children}
    </button>
  );
}
