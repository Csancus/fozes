"use client";

import { useEffect, useRef, useState } from "react";
import { ChevronDown, Plus, Check } from "lucide-react";
import { cn } from "@/lib/cn";
import { catColor } from "@/lib/expense-visuals";
import { savedIcon, resolveType } from "@/lib/saved-visuals";
import { useTypeCreator } from "./useTypeCreator";
import type { SavedType } from "@/lib/types";

// Ikonos típus-legördülő „+ Új típus" opcióval (natív select helyett).
export function KindSelect({
  types,
  value,
  onChange,
  onCreated,
  className,
}: {
  types: SavedType[];
  value: string;
  onChange: (id: string) => void;
  onCreated: (t: SavedType) => void;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement | null>(null);
  const { open: openCreator, modal } = useTypeCreator();

  useEffect(() => {
    if (!open) return;
    function onDoc(e: MouseEvent) {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node))
        setOpen(false);
    }
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const cur = resolveType(types, value);
  const CurIcon = savedIcon(cur.icon);
  const curCol = catColor(cur.color);

  async function handleNew() {
    setOpen(false);
    const t = await openCreator();
    if (t) {
      onCreated(t);
      onChange(t.id);
    }
  }

  return (
    <div className="relative" ref={wrapRef}>
      {modal}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "flex items-center gap-1.5 w-full",
          className
        )}
      >
        <span className={cn("shrink-0", curCol.text)}>
          <CurIcon className="w-4 h-4" />
        </span>
        <span className="truncate flex-1 text-left">{cur.name}</span>
        <ChevronDown className="w-3.5 h-3.5 text-[var(--color-muted-foreground)] shrink-0" />
      </button>

      {open && (
        <div className="absolute z-40 mt-1 w-56 max-h-72 overflow-y-auto rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-xl p-1">
          {types.map((t) => {
            const Icon = savedIcon(t.icon);
            const col = catColor(t.color);
            const active = t.id === value;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  onChange(t.id);
                  setOpen(false);
                }}
                className={cn(
                  "w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-left transition hover:bg-[var(--color-muted)]",
                  active && "bg-[var(--color-muted)]"
                )}
              >
                <span
                  className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center shrink-0",
                    col.soft,
                    col.text
                  )}
                >
                  <Icon className="w-4 h-4" />
                </span>
                <span className="flex-1 truncate">{t.name}</span>
                {active && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
              </button>
            );
          })}
          <button
            type="button"
            onClick={handleNew}
            className="w-full flex items-center gap-2 rounded-lg px-2 py-2 text-sm text-left text-[var(--color-primary)] font-medium hover:bg-[var(--color-primary-soft)] transition"
          >
            <span className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 border border-dashed border-[var(--color-primary)]/40">
              <Plus className="w-4 h-4" />
            </span>
            Új típus…
          </button>
        </div>
      )}
    </div>
  );
}
