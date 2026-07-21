"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { createCategoryInline } from "./actions";
import type { ExpenseCategory } from "@/lib/types";

// Szép saját modál az "Új kategória" bevitelhez a natív window.prompt helyett.
// Használat: const { open, modal } = useCategoryCreator();
//   const cat = await open(); ... és rendereld a {modal}-t a komponensben.
export function useCategoryCreator() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const resolverRef = useRef<((c: ExpenseCategory | null) => void) | null>(null);

  const open = useCallback(
    () =>
      new Promise<ExpenseCategory | null>((resolve) => {
        resolverRef.current = resolve;
        setName("");
        setBusy(false);
        setVisible(true);
      }),
    []
  );

  const finish = useCallback((result: ExpenseCategory | null) => {
    setVisible(false);
    setBusy(false);
    resolverRef.current?.(result);
    resolverRef.current = null;
  }, []);

  const submit = useCallback(async () => {
    const n = name.trim();
    if (!n) {
      finish(null);
      return;
    }
    setBusy(true);
    try {
      const cat = await createCategoryInline(n);
      finish(cat ?? null);
    } catch {
      finish(null);
    }
  }, [name, finish]);

  const modal = visible ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Új kategória"
    >
      <button
        type="button"
        aria-label="Bezárás"
        onClick={() => finish(null)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-sm rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-4">
          <span className="w-9 h-9 rounded-xl flex items-center justify-center bg-[var(--color-primary-soft)] text-[var(--color-primary)]">
            <Tag className="w-4.5 h-4.5" />
          </span>
          <h2 className="font-semibold text-[15px]">Új kategória</h2>
        </div>
        <input
          autoFocus
          value={name}
          disabled={busy}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              submit();
            } else if (e.key === "Escape") {
              e.preventDefault();
              finish(null);
            }
          }}
          placeholder="pl. Ajándék, Autó, Nyaralás"
          className="w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]"
        />
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          Színt és ikont később a Beállításokban állíthatsz be.
        </p>
        <div className="mt-5 flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={() => finish(null)}>
            Mégse
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={busy || !name.trim()}
            leftIcon={busy ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
          >
            {busy ? "Létrehozás…" : "Hozzáadás"}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return { open, modal };
}
