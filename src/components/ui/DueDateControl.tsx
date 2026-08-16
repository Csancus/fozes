"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { CalendarDays, Loader2, X } from "lucide-react";

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
const DOW = ["vas", "hét", "kedd", "sze", "csüt", "pén", "szo"];
function fmtDue(due: string): string {
  const [y, m, d] = due.split("-").map(Number);
  return `${m}. ${d}. (${DOW[new Date(y, m - 1, d).getDay()]})`;
}

// Határidő-chip: kattintásra dátumválasztó nyílik, azonnal ment — a teendő
// megnyitása és részletes szerkesztés nélkül (kártyákról, kanbanból is).
export function DueDateControl({
  id,
  dueDate,
  dueDateAction,
  size = "sm",
}: {
  id: string;
  dueDate: string | null;
  dueDateAction: (fd: FormData) => void | Promise<void>;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const box = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  function set(next: string | null) {
    setOpen(false);
    if (next === dueDate) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("dueDate", next ?? "");
    start(async () => {
      await dueDateAction(fd);
    });
  }

  const overdue = !!dueDate && dueDate < todayStr();

  return (
    <div className="relative" ref={box} onClick={(e) => e.stopPropagation()}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium transition",
          dueDate
            ? overdue
              ? "bg-red-500/12 text-red-600 dark:text-red-400"
              : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
            : "border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)]",
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-[13px]"
        )}
      >
        {pending ? (
          <Loader2 className={cn("animate-spin", size === "sm" ? "w-3 h-3" : "w-4 h-4")} />
        ) : (
          <CalendarDays className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
        )}
        {dueDate ? fmtDue(dueDate) : "Határidő"}
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-56 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 shadow-lg">
          <input
            type="date"
            autoFocus
            min="1970-01-01"
            max="2099-12-31"
            defaultValue={dueDate ?? ""}
            onChange={(e) => set(e.target.value || null)}
            className="w-full h-10 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          />
          {dueDate && (
            <button
              type="button"
              onClick={() => set(null)}
              className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-lg py-1.5 text-[12px] font-medium text-red-600 hover:bg-red-500/10"
            >
              <X className="w-3.5 h-3.5" /> Határidő törlése
            </button>
          )}
        </div>
      )}
    </div>
  );
}
