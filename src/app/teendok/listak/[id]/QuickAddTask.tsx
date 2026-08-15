"use client";

import { useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Plus, CalendarDays, User as UserIcon, Loader2 } from "lucide-react";

// Gyors hozzáadás a lista oldalán: Enter = mentés, Shift+Enter = új sor
// (több sor egyszerre = több teendő). Opcionálisan határidő + felelős.
export function QuickAddTask({
  listId,
  members,
  addAction,
}: {
  listId: string;
  members: { id: string; name: string }[];
  addAction: (fd: FormData) => void | Promise<void>;
}) {
  const [title, setTitle] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [ownerId, setOwnerId] = useState("");
  const [extra, setExtra] = useState(false);
  const [pending, start] = useTransition();
  const ref = useRef<HTMLTextAreaElement | null>(null);

  function submit() {
    const value = title.trim();
    if (!value || pending) return;
    const fd = new FormData();
    fd.set("listId", listId);
    fd.set("title", value);
    fd.set("dueDate", dueDate);
    fd.set("ownerId", ownerId);
    start(async () => {
      await addAction(fd);
      setTitle("");
      ref.current?.focus();
    });
  }

  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5">
      <div className="flex items-start gap-2">
        <textarea
          ref={ref}
          rows={1}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              submit();
            }
          }}
          placeholder="Új teendő… (Enter = mentés)"
          className="flex-1 min-h-11 max-h-40 resize-y rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3.5 py-2.5 text-[15px] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] transition"
        />
        <button
          type="button"
          onClick={submit}
          disabled={!title.trim() || pending}
          aria-label="Hozzáadás"
          className="h-11 w-11 shrink-0 rounded-xl bg-[var(--color-primary)] text-[var(--color-primary-foreground)] flex items-center justify-center disabled:opacity-40 transition active:scale-95"
        >
          {pending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Plus className="w-5 h-5" />
          )}
        </button>
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setExtra((v) => !v)}
          className={cn(
            "h-8 px-3 rounded-full text-[12px] font-medium border transition",
            extra
              ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-transparent"
              : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          )}
        >
          Határidő / felelős
        </button>
        <span className="text-[11px] text-[var(--color-muted-foreground)]">
          Több sor beillesztve = több teendő
        </span>
      </div>

      {extra && (
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="flex items-center gap-2 rounded-xl border border-[var(--color-input)] px-3 h-11">
            <CalendarDays className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
            <input
              type="date"
              min="1970-01-01"
              max="2099-12-31"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none"
            />
          </label>
          <label className="flex items-center gap-2 rounded-xl border border-[var(--color-input)] px-3 h-11">
            <UserIcon className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
            <select
              value={ownerId}
              onChange={(e) => setOwnerId(e.target.value)}
              className="w-full bg-transparent text-sm focus:outline-none"
            >
              <option value="">Bárki</option>
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.name}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}
    </div>
  );
}
