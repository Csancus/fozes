"use client";

import { useEffect, useRef, useState } from "react";
import { Columns3, Check } from "lucide-react";
import { cn } from "@/lib/cn";

export type ColumnDef = {
  key: string;
  label: string;
  alwaysOn?: boolean; // nem kapcsolható ki
  defaultHidden?: boolean; // alapból rejtett
};

// Általános oszlop-láthatóság hook: localStorage-ben tárolja táblázatonként.
// Használat bármely táblázatnál: const { isVisible, ...cols } = useColumnVisibility("cols:xy", COLUMNS)
export function useColumnVisibility(storageKey: string, columns: ColumnDef[]) {
  const [hidden, setHidden] = useState<Set<string>>(
    () => new Set(columns.filter((c) => c.defaultHidden && !c.alwaysOn).map((c) => c.key))
  );
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      if (raw) {
        const arr = JSON.parse(raw);
        if (Array.isArray(arr)) setHidden(new Set(arr.map(String)));
      }
    } catch {
      /* ignore */
    }
    loadedRef.current = true;
  }, [storageKey]);

  useEffect(() => {
    if (!loadedRef.current) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify([...hidden]));
    } catch {
      /* ignore */
    }
  }, [hidden, storageKey]);

  function toggle(key: string) {
    setHidden((cur) => {
      const n = new Set(cur);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }

  const isVisible = (key: string) => !hidden.has(key);
  return { hidden, isVisible, toggle, columns, storageKey };
}

// A gomb + legördülő panel az oszlopok ki/bekapcsolásához.
export function ColumnToggle({
  columns,
  hidden,
  onToggle,
  label = "Oszlopok",
}: {
  columns: ColumnDef[];
  hidden: Set<string>;
  onToggle: (key: string) => void;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onDoc(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    if (open) document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [open]);

  const shownCount = columns.filter((c) => !hidden.has(c.key)).length;

  return (
    <div className="relative shrink-0" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 h-10 px-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition"
      >
        <Columns3 className="w-4 h-4" />
        {label}
        <span className="text-[var(--color-muted-foreground)] tabular-nums">
          {shownCount}/{columns.length}
        </span>
      </button>
      {open && (
        <div className="absolute right-0 mt-1 z-30 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-xl">
          {columns.map((c) => {
            const visible = !hidden.has(c.key);
            return (
              <button
                key={c.key}
                type="button"
                disabled={c.alwaysOn}
                onClick={() => onToggle(c.key)}
                className={cn(
                  "flex w-full items-center justify-between gap-2 px-3 h-9 rounded-lg text-sm transition",
                  c.alwaysOn
                    ? "text-[var(--color-muted-foreground)] cursor-default"
                    : "hover:bg-[var(--color-muted)]"
                )}
              >
                <span className="flex items-center gap-2">
                  <span
                    className={cn(
                      "w-4 h-4 rounded border flex items-center justify-center",
                      visible
                        ? "bg-[var(--color-primary)] border-transparent text-white"
                        : "border-[var(--color-border)]"
                    )}
                  >
                    {visible && <Check className="w-3 h-3" />}
                  </span>
                  {c.label}
                </span>
                {c.alwaysOn && <span className="text-[10px]">kötelező</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
