"use client";

import { useState } from "react";
import { createPurchaseAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { cn } from "@/lib/cn";
import { Type, FileText, Upload, ArrowRight } from "lucide-react";

function todayInput(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function NewPurchaseForm() {
  const [source, setSource] = useState<"text" | "pdf">("text");
  const [fileName, setFileName] = useState<string>("");

  return (
    <form action={createPurchaseAction} className="space-y-5">
      <input type="hidden" name="source" value={source} />

      <div className="flex items-center gap-1 p-1 bg-[var(--color-muted)] rounded-xl">
        <TabButton active={source === "text"} onClick={() => setSource("text")} icon={<Type className="w-4 h-4" />}>
          Szöveg
        </TabButton>
        <TabButton active={source === "pdf"} onClick={() => setSource("pdf")} icon={<FileText className="w-4 h-4" />}>
          PDF
        </TabButton>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Bolt">
          <Input name="store" placeholder="pl. Lidl, Tesco" />
        </Field>
        <Field label="Dátum">
          <Input name="purchasedAt" type="date" defaultValue={todayInput()} />
        </Field>
      </div>

      {source === "text" ? (
        <Field label="Blokk szövege" hint="Illeszd be ide a blokk teljes szövegét.">
          <Textarea
            name="raw"
            rows={12}
            placeholder="Termék név    darab    ár…"
            className="font-mono text-xs"
          />
        </Field>
      ) : (
        <Field label="PDF blokk" hint="A rendszer kinyeri a szöveget és értelmezi a tételeket.">
          <label className="relative flex flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-[var(--color-input)] bg-[var(--color-card)] hover:border-[var(--color-primary)]/60 hover:bg-[var(--color-primary-soft)]/40 transition py-8 px-4 cursor-pointer">
            <Upload className="w-6 h-6 text-[var(--color-primary)]" />
            <div className="text-sm font-medium text-[var(--color-foreground)]">
              {fileName ? fileName : "Kattints a fájl kiválasztásához"}
            </div>
            <div className="text-xs text-[var(--color-muted-foreground)]">PDF, max ~10 MB</div>
            <input
              name="pdf"
              type="file"
              accept="application/pdf"
              onChange={(e) => setFileName(e.target.files?.[0]?.name ?? "")}
              className="absolute inset-0 opacity-0 cursor-pointer"
            />
          </label>
        </Field>
      )}

      <Button type="submit" size="lg" fullWidth rightIcon={<ArrowRight className="w-4 h-4" />}>
        Feltöltés és feldolgozás
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
        "flex-1 inline-flex items-center justify-center gap-2 text-sm font-medium py-2 rounded-lg transition",
        active
          ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
      )}
    >
      {icon}
      {children}
    </button>
  );
}
