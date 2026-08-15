"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";

// Lista törlése: a benne lévő teendők vagy megmaradnak (csak leválnak),
// vagy a listával együtt törlődnek.
export function DeleteTaskList({
  id,
  name,
  taskCount,
  deleteAction,
}: {
  id: string;
  name: string;
  taskCount: number;
  deleteAction: (fd: FormData) => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [withTasks, setWithTasks] = useState(false);

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="w-full h-12 rounded-xl border border-[var(--color-border)] text-[var(--color-danger)] font-medium inline-flex items-center justify-center gap-2 hover:bg-red-500/10 transition"
      >
        <Trash2 className="w-4 h-4" /> Lista törlése
      </button>
    );
  }

  return (
    <form
      action={deleteAction}
      className="rounded-2xl border border-[var(--color-danger)]/40 bg-[var(--color-card)] p-4"
    >
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="withTasks" value={withTasks ? "1" : "0"} />
      <p className="text-sm font-semibold">„{name}" törlése</p>
      <p className="mt-1 text-xs text-[var(--color-muted-foreground)]">
        {taskCount === 0
          ? "Nincs benne teendő."
          : `${taskCount} teendő van benne.`}
      </p>

      {taskCount > 0 && (
        <div className="mt-3 space-y-2">
          {[
            { v: false, label: "A teendők maradjanak (csak lekerülnek a listáról)" },
            { v: true, label: "A teendők is törlődjenek" },
          ].map((o) => (
            <button
              key={String(o.v)}
              type="button"
              onClick={() => setWithTasks(o.v)}
              className={cn(
                "w-full text-left rounded-xl border px-3 py-2.5 text-sm transition",
                withTasks === o.v
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                  : "border-[var(--color-border)] hover:bg-[var(--color-muted)]"
              )}
            >
              {o.label}
            </button>
          ))}
        </div>
      )}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="h-11 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)]"
        >
          Mégse
        </button>
        <SubmitButton variant="danger">Törlés</SubmitButton>
      </div>
    </form>
  );
}
