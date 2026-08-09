"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";

// Általános törlés-gomb megerősítő modállal (teendő, jegyzet, bármi).
export function ConfirmDeleteButton({
  id,
  title,
  deleteAction,
  variant = "full",
}: {
  id: string;
  title: string;
  deleteAction: (fd: FormData) => void | Promise<void>;
  variant?: "full" | "icon";
}) {
  const [confirm, setConfirm] = useState(false);
  // A modál a <body>-ba megy: a jegyzet-kártyák többoszlopos (columns)
  // konténerében a fixed pozicionálás eltörik, és a háttér elnyelné a
  // kattintást a gombokról.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!confirm) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setConfirm(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [confirm]);

  const dialog = (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      onClick={() => setConfirm(false)}
    >
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-semibold text-[15px] flex items-center gap-2">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-red-500/10 text-red-600">
            <X className="w-4.5 h-4.5" />
          </span>
          Biztosan törlöd?
        </h2>
        <p className="mt-3 text-sm text-[var(--color-muted-foreground)]">
          <span className="font-medium text-[var(--color-foreground)]">{title}</span>{" "}
          véglegesen törlődik.
        </p>
        <div className="mt-5 flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={() => setConfirm(false)}>
            Mégse
          </Button>
          <form action={deleteAction} onSubmit={() => setConfirm(false)}>
            <input type="hidden" name="id" value={id} />
            <Button type="submit" variant="danger" leftIcon={<X className="w-4 h-4" />}>
              Törlés
            </Button>
          </form>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {variant === "full" ? (
        <Button
          type="button"
          variant="ghost"
          fullWidth
          className="text-red-600 hover:text-red-700"
          leftIcon={<Trash2 className="w-4 h-4" />}
          onClick={() => setConfirm(true)}
        >
          Törlés
        </Button>
      ) : (
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setConfirm(true);
          }}
          className={cn(
            "shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-red-500/10 hover:text-red-600 transition"
          )}
          aria-label="Törlés"
        >
          <Trash2 className="w-4 h-4" />
        </button>
      )}

      {confirm && mounted && createPortal(dialog, document.body)}
    </>
  );
}
