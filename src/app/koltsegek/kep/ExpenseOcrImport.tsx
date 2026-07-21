"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, ImagePlus, ScanText, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { BatchEntry } from "../gyors/BatchEntry";
import { parseBankText } from "@/lib/bank-ocr";
import type {
  ExpenseCategory,
  PaymentMethod,
  Person,
  Project,
  ExpenseGroup,
} from "@/lib/types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

type Seed = {
  kind: "expense" | "income";
  amount: string;
  merchant: string;
  categoryId: string;
  spentAt: string;
  note: string;
};
// Egy feltöltött kép + a belőle kiolvasott sorok (a kép csak a böngészőben él).
type Imported = { id: string; url: string; name: string; rows: Seed[] };

let uidCounter = 0;
function uid() {
  uidCounter += 1;
  return `img${uidCounter}`;
}

export function ExpenseOcrImport({
  action,
  categories,
  incomeCategories,
  paymentMethods,
  persons,
  projects,
  groups,
  merchantMap,
  knownMerchants,
}: {
  action: (fd: FormData) => void | Promise<void>;
  categories: ExpenseCategory[];
  incomeCategories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  persons: Person[];
  projects: Project[];
  groups: ExpenseGroup[];
  merchantMap: Record<string, string>;
  knownMerchants: string[];
}) {
  const [imports, setImports] = useState<Imported[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; pct: number } | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const dragDepth = useRef(0);

  const processFiles = useCallback(
    async (files: File[]) => {
      const images = files.filter((f) => f.type.startsWith("image/"));
      if (images.length === 0) return;
      setBusy(true);
      setProgress({ done: 0, total: images.length, pct: 0 });
      const tesseract = await import("tesseract.js");

      for (let i = 0; i < images.length; i++) {
        const file = images[i];
        setProgress({ done: i, total: images.length, pct: 0 });
        const id = uid();
        const url = URL.createObjectURL(file);

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

        const seeds: Seed[] = parseBankText(text).map((t) => ({
          kind: t.kind,
          amount: String(t.amount),
          merchant: t.merchant,
          categoryId: t.kind === "expense" ? merchantMap[slugify(t.merchant)] ?? "" : "",
          spentAt: t.day,
          note: t.note,
        }));

        setImports((cur) => [...cur, { id, url, name: file.name, rows: seeds }]);
        setProgress({ done: i + 1, total: images.length, pct: 100 });
      }

      setBusy(false);
      setProgress(null);
    },
    [merchantMap]
  );

  function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length) processFiles(files);
    e.target.value = "";
  }

  function removeImport(id: string) {
    setImports((cur) => {
      const found = cur.find((im) => im.id === id);
      if (found) URL.revokeObjectURL(found.url);
      return cur.filter((im) => im.id !== id);
    });
  }

  // Drag & drop
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current = 0;
    setDragOver(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    if (files.length) processFiles(files);
  }
  function onDragEnter(e: React.DragEvent) {
    e.preventDefault();
    dragDepth.current += 1;
    setDragOver(true);
  }
  function onDragLeave() {
    dragDepth.current = Math.max(0, dragDepth.current - 1);
    if (dragDepth.current === 0) setDragOver(false);
  }

  const allRows = imports.flatMap((im) => im.rows);
  const hasResult = imports.length > 0;
  const batchKey = imports.map((im) => im.id).join("-") + ":" + allRows.length;

  return (
    <div
      className="mt-5"
      onDrop={onDrop}
      onDragOver={(e) => e.preventDefault()}
      onDragEnter={onDragEnter}
      onDragLeave={onDragLeave}
    >
      <input ref={inputRef} type="file" accept="image/*" multiple className="hidden" onChange={onPick} />

      {!hasResult ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed py-14 px-5 text-center transition",
            dragOver
              ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
              : "border-[var(--color-border)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/50"
          )}
        >
          <span className="w-14 h-14 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
            <ImagePlus className="w-7 h-7" />
          </span>
          <span className="font-medium">Húzd ide a képeket, vagy kattints</span>
          <span className="text-sm text-[var(--color-muted-foreground)] max-w-sm">
            Egy vagy több képernyőkép a bank appból — kiolvassa a tételeket egy
            szerkeszthető táblázatba. A képeket a rendszer nem tárolja.
          </span>
        </button>
      ) : (
        <div
          className={cn(
            "grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4 rounded-2xl transition",
            dragOver && "ring-2 ring-[var(--color-primary)] ring-offset-2 ring-offset-[var(--color-background)]"
          )}
        >
          {/* Képek kicsiben, X-szel törölhető */}
          <div className="lg:sticky lg:top-3 self-start">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                Képek ({imports.length})
              </p>
              <button
                type="button"
                onClick={() => inputRef.current?.click()}
                disabled={busy}
                className="inline-flex items-center gap-1 text-xs font-medium text-[var(--color-primary)] hover:brightness-110 disabled:opacity-50"
              >
                <ImagePlus className="w-3.5 h-3.5" /> Több
              </button>
            </div>
            <div className="grid grid-cols-3 lg:grid-cols-2 gap-2">
              {imports.map((im) => (
                <div key={im.id} className="relative group">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={im.url}
                    alt={im.name}
                    className="w-full h-28 object-cover rounded-lg border border-[var(--color-border)]"
                  />
                  <span className="absolute bottom-1 left-1 text-[10px] px-1.5 py-0.5 rounded bg-black/60 text-white tabular-nums">
                    {im.rows.length} tétel
                  </span>
                  <button
                    type="button"
                    onClick={() => removeImport(im.id)}
                    aria-label="Kép törlése"
                    title="Kép és a hozzá tartozó sorok törlése"
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-red-600 transition"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
            {busy && progress && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Kiolvasás… {progress.done}/{progress.total} ({progress.pct}%)
              </div>
            )}
            <p className="mt-2 text-[11px] text-[var(--color-muted-foreground)]">
              Húzhatsz ide új képet is.
            </p>
          </div>

          {/* Táblázat a beolvasott tételekkel */}
          <div className="min-w-0">
            {allRows.length === 0 ? (
              <div className="flex flex-col items-center text-center py-12 text-[var(--color-muted-foreground)]">
                <ScanText className="w-8 h-8 mb-2" />
                <p className="text-sm">
                  {busy
                    ? "Feldolgozás folyamatban…"
                    : "Nem sikerült tételt kiolvasni. Próbálj élesebb képet, vagy vidd fel kézzel a Gyors táblázatban."}
                </p>
              </div>
            ) : (
              <>
                <p className="text-sm text-[var(--color-muted-foreground)] mb-1">
                  {allRows.length} tétel beolvasva — ellenőrizd és pontosítsd, majd mentsd.
                </p>
                <BatchEntry
                  key={batchKey}
                  action={action}
                  categories={categories}
                  incomeCategories={incomeCategories}
                  paymentMethods={paymentMethods}
                  persons={persons}
                  projects={projects}
                  groups={groups}
                  merchantMap={merchantMap}
                  knownMerchants={knownMerchants}
                  initialRows={allRows}
                />
              </>
            )}
          </div>
        </div>
      )}

      {!hasResult && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="secondary"
            onClick={() => inputRef.current?.click()}
            leftIcon={<ImagePlus className="w-4 h-4" />}
          >
            Képek feltöltése
          </Button>
        </div>
      )}
    </div>
  );
}
