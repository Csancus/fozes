"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, ImagePlus, ScanText } from "lucide-react";
import { Button } from "@/components/ui/Button";
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
type Thumb = { url: string; name: string };

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
  const [thumbs, setThumbs] = useState<Thumb[]>([]);
  const [rows, setRows] = useState<Seed[]>([]);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number; pct: number } | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

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
        setThumbs((cur) => [...cur, { url: URL.createObjectURL(file), name: file.name }]);

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

        const parsed = parseBankText(text);
        const seeds: Seed[] = parsed.map((t) => {
          const catId =
            t.kind === "expense" ? merchantMap[slugify(t.merchant)] ?? "" : "";
          return {
            kind: t.kind,
            amount: String(t.amount),
            merchant: t.merchant,
            categoryId: catId,
            spentAt: t.day,
            note: t.note,
          };
        });
        setRows((cur) => [...cur, ...seeds]);
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

  const hasResult = rows.length > 0 || thumbs.length > 0;

  return (
    <div className="mt-5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        className="hidden"
        onChange={onPick}
      />

      {!hasResult ? (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="w-full flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-card)] py-14 px-5 text-center hover:border-[var(--color-primary)]/50 transition"
        >
          <span className="w-14 h-14 rounded-2xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
            <ImagePlus className="w-7 h-7" />
          </span>
          <span className="font-medium">Képek kiválasztása</span>
          <span className="text-sm text-[var(--color-muted-foreground)] max-w-sm">
            Tölts fel egy vagy több képernyőképet a bank appból — a rendszer
            kiolvassa a tételeket egy szerkeszthető táblázatba.
          </span>
        </button>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-4">
          {/* Képek kicsiben */}
          <div className="lg:sticky lg:top-3 self-start">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider">
                Képek ({thumbs.length})
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
              {thumbs.map((t, i) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={i}
                  src={t.url}
                  alt={t.name}
                  className="w-full h-28 object-cover rounded-lg border border-[var(--color-border)]"
                />
              ))}
            </div>
            {busy && progress && (
              <div className="mt-3 flex items-center gap-2 text-xs text-[var(--color-muted-foreground)]">
                <Loader2 className="w-4 h-4 animate-spin" />
                Kiolvasás… {progress.done}/{progress.total} ({progress.pct}%)
              </div>
            )}
          </div>

          {/* Táblázat a beolvasott tételekkel */}
          <div className="min-w-0">
            {rows.length === 0 ? (
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
                  {rows.length} tétel beolvasva — ellenőrizd és pontosítsd, majd mentsd.
                </p>
                <BatchEntry
                  key={rows.length}
                  action={action}
                  categories={categories}
                  incomeCategories={incomeCategories}
                  paymentMethods={paymentMethods}
                  persons={persons}
                  projects={projects}
                  groups={groups}
                  merchantMap={merchantMap}
                  knownMerchants={knownMerchants}
                  initialRows={rows}
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
