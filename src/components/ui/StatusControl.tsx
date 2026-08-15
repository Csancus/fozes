"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { STATUS_VISUAL } from "@/lib/task-visuals";
import { TASK_STATUSES } from "@/lib/types";
import type { TaskStatus } from "@/lib/types";
import { Check, ChevronDown, Loader2 } from "lucide-react";

// Státusz-chip legördülővel: kattintásra a 4 állapot közül lehet választani.
export function StatusControl({
  id,
  status,
  statusAction,
  size = "sm",
}: {
  id: string;
  status: TaskStatus;
  statusAction: (fd: FormData) => void | Promise<void>;
  size?: "sm" | "md";
}) {
  const [open, setOpen] = useState(false);
  const [pending, start] = useTransition();
  const box = useRef<HTMLDivElement | null>(null);
  const vis = STATUS_VISUAL[status];
  const Icon = vis.icon;

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

  function pick(next: TaskStatus) {
    setOpen(false);
    if (next === status) return;
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", next);
    start(async () => {
      await statusAction(fd);
    });
  }

  return (
    <div className="relative" ref={box}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={cn(
          "inline-flex items-center gap-1 rounded-full font-medium transition",
          vis.soft,
          vis.text,
          size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-3 py-1 text-[13px]"
        )}
      >
        {pending ? (
          <Loader2 className={cn("animate-spin", size === "sm" ? "w-3 h-3" : "w-4 h-4")} />
        ) : (
          <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
        )}
        {vis.label}
        <ChevronDown className={size === "sm" ? "w-3 h-3 opacity-60" : "w-4 h-4 opacity-60"} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-30 mt-1 w-44 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-1 shadow-lg">
          {TASK_STATUSES.map((s) => {
            const v = STATUS_VISUAL[s];
            const SIcon = v.icon;
            return (
              <button
                key={s}
                type="button"
                onClick={() => pick(s)}
                className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-sm hover:bg-[var(--color-muted)]"
              >
                <SIcon className={cn("w-4 h-4", v.text)} />
                <span className="flex-1">{v.label}</span>
                {s === status && <Check className="w-4 h-4 text-[var(--color-primary)]" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
