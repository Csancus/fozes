"use client";

import { useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { Tag, Pencil, Trash2, Check, X, Loader2 } from "lucide-react";

type TagRow = { name: string; taskCount: number; listCount: number };

// Címkék átnevezése / összevonása / törlése — visszamenőleg minden
// teendőn és teendő-listán.
export function TagManager({
  tags,
  renameAction,
  deleteAction,
}: {
  tags: TagRow[];
  renameAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
}) {
  const [editing, setEditing] = useState<string | null>(null);
  const [value, setValue] = useState("");
  const [confirming, setConfirming] = useState<string | null>(null);
  const [pending, start] = useTransition();

  function save(from: string) {
    const to = value.trim();
    if (!to || to === from) {
      setEditing(null);
      return;
    }
    const fd = new FormData();
    fd.set("from", from);
    fd.set("to", to);
    start(async () => {
      await renameAction(fd);
      setEditing(null);
    });
  }

  function remove(tag: string) {
    const fd = new FormData();
    fd.set("tag", tag);
    start(async () => {
      await deleteAction(fd);
      setConfirming(null);
    });
  }

  if (tags.length === 0) {
    return (
      <p className="text-xs text-[var(--color-muted-foreground)]">
        Még nincs címke. A teendőkön és a teendő-listákon tudsz felvenni —
        onnantól itt átnevezhetők és összevonhatók.
      </p>
    );
  }

  return (
    <div className="space-y-2">
      <p className="mb-1 text-xs text-[var(--color-muted-foreground)]">
        Az átnevezés minden teendőn és listán érvényesül. Ha egy létező címke
        nevére nevezed át, a kettő <b>összevonódik</b>.
      </p>
      {tags.map((t) => {
        const isEditing = editing === t.name;
        const isConfirming = confirming === t.name;
        return (
          <div
            key={t.name}
            className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5"
          >
            <div className="flex items-center gap-2">
              {isEditing ? (
                <>
                  <input
                    autoFocus
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        save(t.name);
                      }
                      if (e.key === "Escape") setEditing(null);
                    }}
                    className="h-9 flex-1 rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
                  />
                  <button
                    type="button"
                    onClick={() => save(t.name)}
                    disabled={pending}
                    aria-label="Mentés"
                    className="h-9 w-9 rounded-lg flex items-center justify-center bg-[var(--color-primary)] text-[var(--color-primary-foreground)] disabled:opacity-50"
                  >
                    {pending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditing(null)}
                    aria-label="Mégse"
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-muted)] px-2.5 py-1 text-[13px] font-medium text-[var(--color-muted-foreground)]">
                    <Tag className="w-3.5 h-3.5" /> {t.name}
                  </span>
                  <span className="flex-1 text-xs text-[var(--color-muted-foreground)] tabular-nums">
                    {t.taskCount} teendő
                    {t.listCount > 0 && ` · ${t.listCount} lista`}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(t.name);
                      setValue(t.name);
                      setConfirming(null);
                    }}
                    aria-label="Átnevezés"
                    className="h-9 w-9 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setConfirming(isConfirming ? null : t.name)}
                    aria-label="Törlés"
                    className={cn(
                      "h-9 w-9 rounded-lg flex items-center justify-center transition",
                      isConfirming
                        ? "bg-red-500/10 text-red-600"
                        : "text-red-600 hover:bg-red-500/10"
                    )}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>

            {isConfirming && !isEditing && (
              <div className="mt-2 flex items-center gap-2 rounded-lg bg-red-500/5 p-2">
                <span className="flex-1 text-xs text-[var(--color-muted-foreground)]">
                  Lekerül {t.taskCount} teendőről
                  {t.listCount > 0 && ` és ${t.listCount} listáról`} — a tételek
                  megmaradnak.
                </span>
                <button
                  type="button"
                  onClick={() => remove(t.name)}
                  disabled={pending}
                  className="h-8 rounded-lg bg-[var(--color-danger)] px-3 text-xs font-medium text-white disabled:opacity-50"
                >
                  {pending ? "Törlés…" : "Törlés"}
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
