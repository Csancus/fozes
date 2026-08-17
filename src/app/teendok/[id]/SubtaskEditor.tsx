"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import type { Subtask } from "@/lib/types";
import { Check, Plus, X, ArrowUpRight, Loader2 } from "lucide-react";

// Alteendők a teendő oldalán: pipálás, gyors felvitel (Enter = mentés,
// több sor = több alteendő), törlés, és önálló teendővé emelés.
export function SubtaskEditor({
  taskId,
  subtasks,
  toggleAction,
  addAction,
  deleteAction,
  promoteAction,
}: {
  taskId: string;
  subtasks: Subtask[];
  toggleAction: (fd: FormData) => void | Promise<void>;
  addAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
  promoteAction: (fd: FormData) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [pending, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement | null>(null);
  const doneCount = subtasks.filter((s) => s.done).length;
  const pct = subtasks.length ? Math.round((doneCount / subtasks.length) * 100) : 0;

  function add() {
    const value = title.trim();
    if (!value || pending) return;
    const fd = new FormData();
    fd.set("id", taskId);
    fd.set("title", value);
    start(async () => {
      await addAction(fd);
      setTitle("");
      ref.current?.focus();
    });
  }

  function run(action: (fd: FormData) => void | Promise<void>, subId: string) {
    const fd = new FormData();
    fd.set("id", taskId);
    fd.set("subId", subId);
    start(async () => {
      await action(fd);
    });
  }

  return (
    <section className="mt-6">
      <h2 className="mb-2 flex items-center gap-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
        Alteendők
        {subtasks.length > 0 && (
          <span className="tabular-nums">
            {doneCount}/{subtasks.length}
          </span>
        )}
      </h2>

      {subtasks.length > 0 && (
        <div className="mb-3 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
          <div
            className="h-full rounded-full bg-emerald-500 transition-all"
            style={{ width: `${pct}%` }}
          />
        </div>
      )}

      <ul className="space-y-2">
        {subtasks.map((s) => (
          <li
            key={s.id}
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5"
          >
            <form action={toggleAction} className="shrink-0">
              <input type="hidden" name="id" value={taskId} />
              <input type="hidden" name="subId" value={s.id} />
              <button
                type="submit"
                aria-label={s.done ? "Vissza" : "Kész"}
                className={cn(
                  "w-6 h-6 rounded-md border flex items-center justify-center transition",
                  s.done
                    ? "bg-emerald-500 border-emerald-500 text-white"
                    : "border-[var(--color-border)] text-transparent hover:border-emerald-500"
                )}
              >
                <Check className="w-4 h-4" />
              </button>
            </form>
            <span
              className={cn(
                "flex-1 min-w-0 text-sm",
                s.done && "line-through text-[var(--color-muted-foreground)]"
              )}
            >
              {s.title}
            </span>
            <button
              type="button"
              onClick={() => run(promoteAction, s.id)}
              title="Önálló teendő lesz belőle"
              aria-label="Önálló teendő lesz belőle"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
            >
              <ArrowUpRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => run(deleteAction, s.id)}
              title="Törlés"
              aria-label="Törlés"
              className="h-8 w-8 rounded-lg flex items-center justify-center text-red-600 hover:bg-red-500/10 transition"
            >
              <X className="w-4 h-4" />
            </button>
          </li>
        ))}
      </ul>

      <div className={cn("flex items-start gap-2", subtasks.length > 0 && "mt-2")}>
        <textarea
          ref={ref}
          rows={1}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              add();
            }
          }}
          placeholder="Új alteendő… (Enter = mentés)"
          className="flex-1 min-h-10 max-h-32 resize-y rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3 py-2 text-sm placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition"
        />
        <button
          type="button"
          onClick={add}
          disabled={!title.trim() || pending}
          aria-label="Alteendő hozzáadása"
          className="h-10 w-10 shrink-0 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center disabled:opacity-40 transition active:scale-95"
        >
          {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        </button>
      </div>
    </section>
  );
}
