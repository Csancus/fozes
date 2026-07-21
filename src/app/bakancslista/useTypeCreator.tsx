"use client";

import { useCallback, useRef, useState } from "react";
import { Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { catColor, COLOR_KEYS } from "@/lib/expense-visuals";
import { SAVED_ICONS, SAVED_ICON_KEYS, savedIcon } from "@/lib/saved-visuals";
import { createSavedTypeInline } from "./actions";
import type { SavedType } from "@/lib/types";

// Modál új bakancslista-típushoz: név + ikonrács + színrács + előnézet.
// const { open, modal } = useTypeCreator(); const t = await open();
export function useTypeCreator() {
  const [visible, setVisible] = useState(false);
  const [name, setName] = useState("");
  const [icon, setIcon] = useState("star");
  const [color, setColor] = useState("sky");
  const [busy, setBusy] = useState(false);
  const resolverRef = useRef<((t: SavedType | null) => void) | null>(null);

  const open = useCallback(
    () =>
      new Promise<SavedType | null>((resolve) => {
        resolverRef.current = resolve;
        setName("");
        setIcon("star");
        setColor("sky");
        setBusy(false);
        setVisible(true);
      }),
    []
  );

  const finish = useCallback((result: SavedType | null) => {
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
      const t = await createSavedTypeInline({ name: n, icon, color });
      finish(t ?? null);
    } catch {
      finish(null);
    }
  }, [name, icon, color, finish]);

  const col = catColor(color);
  const PreviewIcon = savedIcon(icon);

  const modal = visible ? (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Új típus"
    >
      <button
        type="button"
        aria-label="Bezárás"
        onClick={() => finish(null)}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-md rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-5 shadow-2xl">
        <div className="flex items-center gap-2.5 mb-4">
          <span
            className={cn(
              "w-9 h-9 rounded-xl flex items-center justify-center",
              col.soft,
              col.text
            )}
          >
            <PreviewIcon className="w-4.5 h-4.5" />
          </span>
          <h2 className="font-semibold text-[15px]">Új típus</h2>
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
          placeholder="pl. Koncert, Kiállítás, Vendéglátás"
          className="w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]"
        />

        {/* Szín */}
        <p className="mt-4 mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
          Szín
        </p>
        <div className="flex flex-wrap gap-2">
          {COLOR_KEYS.map((c) => {
            const cc = catColor(c);
            return (
              <button
                key={c}
                type="button"
                onClick={() => setColor(c)}
                aria-label={c}
                className={cn(
                  "w-7 h-7 rounded-full transition ring-offset-2 ring-offset-[var(--color-card)]",
                  cc.dot,
                  color === c && "ring-2 ring-[var(--color-foreground)]"
                )}
              />
            );
          })}
        </div>

        {/* Ikon */}
        <p className="mt-4 mb-2 text-xs font-medium text-[var(--color-muted-foreground)]">
          Ikon
        </p>
        <div className="grid grid-cols-8 gap-1.5 max-h-44 overflow-y-auto pr-1">
          {SAVED_ICON_KEYS.map((k) => {
            const Icon = SAVED_ICONS[k];
            const active = icon === k;
            return (
              <button
                key={k}
                type="button"
                onClick={() => setIcon(k)}
                aria-label={k}
                className={cn(
                  "aspect-square rounded-lg flex items-center justify-center border transition",
                  active
                    ? cn(col.soft, col.text, "border-transparent ring-2", col.ring)
                    : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <Icon className="w-4.5 h-4.5" />
              </button>
            );
          })}
        </div>

        <div className="mt-5 flex gap-2 justify-end">
          <Button type="button" variant="secondary" onClick={() => finish(null)}>
            Mégse
          </Button>
          <Button
            type="button"
            onClick={submit}
            disabled={busy || !name.trim()}
            leftIcon={
              busy ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Sparkles className="w-4 h-4" />
              )
            }
          >
            {busy ? "Létrehozás…" : "Létrehozás"}
          </Button>
        </div>
      </div>
    </div>
  ) : null;

  return { open, modal };
}
