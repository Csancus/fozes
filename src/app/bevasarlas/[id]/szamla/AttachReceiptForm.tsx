"use client";

import { useRef, useState } from "react";
import type { Location, ShoppingList } from "@/lib/types";
import { parseAndMatchAction } from "./actions";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/cn";
import {
  Type,
  FileText,
  Camera,
  Upload,
  ArrowRight,
  AlertCircle,
} from "lucide-react";

function todayInput(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

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
  const [pdfName, setPdfName] = useState<string | null>(null);
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

  function onPdfChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    setPdfName(file ? file.name : null);
  }

  return (
    <form
      ref={formRef}
      action={parseAndMatchAction}
      encType="multipart/form-data"
      className="space-y-5"
    >
      <input type="hidden" name="listId" value={list.id} />
      <input type="hidden" name="mode" value={mode} />

      <div className="grid grid-cols-2 gap-3">
        <Field label="Bolt">
          <Input name="store" placeholder="pl. Lidl, Tesco" />
        </Field>
        <Field label="Dátum">
          <Input
            name="purchasedAt"
            type="date"
            defaultValue={todayInput()}
          />
        </Field>
      </div>

      <div className="flex items-center gap-1 p-1 bg-[var(--color-muted)] rounded-xl">
        <TabButton
          active={mode === "text"}
          onClick={() => setMode("text")}
          icon={<Type className="w-4 h-4" />}
        >
          Szöveg
        </TabButton>
        <TabButton
          active={mode === "pdf"}
          onClick={() => setMode("pdf")}
          icon={<FileText className="w-4 h-4" />}
        >
          PDF
        </TabButton>
        <TabButton
          active={mode === "photo"}
          onClick={() => setMode("photo")}
          icon={<Camera className="w-4 h-4" />}
        >
          Fotó
        </TabButton>
      </div>

      {mode === "text" && (
        <Field label="Blokk szövege">
          <Textarea
            name="raw"
            rows={12}
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            placeholder="Illeszd be ide a blokk teljes szövegét..."
            className="font-mono text-xs min-h-48"
          />
        </Field>
      )}

      {mode === "pdf" && (
        <div>
          <label
            htmlFor="pdf-upload"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-input)] bg-[var(--color-card)] p-8 text-center cursor-pointer hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary-soft)]/30 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
              <Upload className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">
              {pdfName ?? "PDF blokk feltöltése"}
            </p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Koppints ide, vagy húzz ide egy PDF-et
            </p>
            <input
              id="pdf-upload"
              name="pdf"
              type="file"
              accept="application/pdf"
              className="hidden"
              onChange={onPdfChange}
            />
          </label>
          <p className="mt-2 text-xs text-[var(--color-muted-foreground)] text-center">
            A rendszer kinyeri a szöveget és értelmezi a tételeket.
          </p>
        </div>
      )}

      {mode === "photo" && (
        <div className="space-y-3">
          <label
            htmlFor="photo-upload"
            className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-[var(--color-input)] bg-[var(--color-card)] p-8 text-center cursor-pointer hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary-soft)]/30 transition"
          >
            <div className="w-12 h-12 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
              <Camera className="w-6 h-6" />
            </div>
            <p className="text-sm font-medium">Blokk fotó készítése</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Koppints a fotózáshoz vagy válassz képet
            </p>
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={onPhotoChange}
              className="hidden"
            />
          </label>
          <p className="text-xs text-[var(--color-muted-foreground)] text-center">
            Az OCR a böngésződben fut (tesseract.js, magyar+angol). Az első
            betöltés kb. 15 MB.
          </p>

          {photoPreview && (
            <Card className="p-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoPreview}
                alt="Blokk előnézet"
                className="max-h-64 w-auto mx-auto rounded-xl"
              />
            </Card>
          )}

          {ocrProgress !== null && (
            <Card className="p-3.5">
              <div className="flex items-center justify-between text-xs text-[var(--color-muted-foreground)] mb-2">
                <span>{ocrStatus}</span>
                <span className="tabular-nums font-medium text-[var(--color-foreground)]">
                  {ocrProgress}%
                </span>
              </div>
              <div className="h-2 w-full rounded-full bg-[var(--color-muted)] overflow-hidden">
                <div
                  className="h-full bg-[var(--color-primary)] transition-[width] duration-200"
                  style={{ width: `${ocrProgress}%` }}
                />
              </div>
            </Card>
          )}

          {ocrError && (
            <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-3.5 flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-red-700 dark:text-red-400 mt-0.5 shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-400">
                {ocrError}
              </p>
            </div>
          )}

          <Field label="Felismert szöveg (szerkeszthető)">
            <Textarea
              rows={10}
              value={ocrText}
              onChange={(e) => setOcrText(e.target.value)}
              placeholder="Itt jelenik meg az OCR eredménye..."
              className="font-mono text-xs min-h-40"
            />
          </Field>

          {/* Server action reads the OCR text via `raw` when mode=photo */}
          <input type="hidden" name="raw" value={ocrText} />
        </div>
      )}

      <Button
        type="submit"
        size="lg"
        fullWidth
        rightIcon={<ArrowRight className="w-4 h-4" />}
      >
        Parseolás és összekötés
      </Button>
    </form>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 inline-flex items-center justify-center gap-1.5 py-2 rounded-lg text-sm font-medium transition",
        active
          ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      )}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}
