"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Task } from "@/lib/types";
import { SHARED_OWNER } from "@/lib/types";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { StatusControl } from "@/components/ui/StatusControl";
import { DueDateControl } from "@/components/ui/DueDateControl";
import { TagChips } from "@/components/ui/TagChips";
import { TaskBoard } from "../../TaskBoard";
import {
  Check,
  ListChecks,
  Paperclip,
  Users,
  ChevronRight,
  LayoutGrid,
  List as ListIcon,
} from "lucide-react";

type Entry = Task & { ownerName: string | null };

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// Egy lista teendői: sor- vagy tábla (kanban) nézetben.
export function ListTasksView({
  tasks,
  inheritedTags = [],
  toggleDoneAction,
  deleteAction,
  statusAction,
  dueDateAction,
}: {
  tasks: Entry[];
  inheritedTags?: string[];
  toggleDoneAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
  statusAction: (fd: FormData) => void | Promise<void>;
  dueDateAction: (fd: FormData) => void | Promise<void>;
}) {
  const [view, setView] = useState<"list" | "board">("list");
  const [showDone, setShowDone] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("teendok-lista-view");
    if (saved === "board" || saved === "list") setView(saved);
  }, []);
  function pickView(v: "list" | "board") {
    setView(v);
    localStorage.setItem("teendok-lista-view", v);
  }

  const byDue = (a: Entry, b: Entry) =>
    (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") || a.createdAt - b.createdAt;
  const open = tasks.filter((t) => !t.done).sort(byDue);
  const done = tasks
    .filter((t) => t.done)
    .sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
          {tasks.length} teendő
        </span>
        <div className="flex rounded-xl border border-[var(--color-border)] p-0.5">
          {([
            { id: "list", icon: ListIcon, label: "Lista nézet" },
            { id: "board", icon: LayoutGrid, label: "Tábla nézet" },
          ] as const).map((v) => {
            const Icon = v.icon;
            return (
              <button
                key={v.id}
                type="button"
                aria-label={v.label}
                title={v.label}
                onClick={() => pickView(v.id)}
                className={cn(
                  "h-8 w-8 rounded-lg flex items-center justify-center transition",
                  view === v.id
                    ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <Icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
      </div>

      {view === "board" ? (
        <TaskBoard tasks={tasks} statusAction={statusAction} dueDateAction={dueDateAction} />
      ) : (
        <>
          {open.length > 0 ? (
            <ul className="mt-3 space-y-2">
              {open.map((t) => (
                <li key={t.id}>
                  <Row
                    task={t}
                    inheritedTags={inheritedTags}
                    toggleDoneAction={toggleDoneAction}
                    deleteAction={deleteAction}
                    statusAction={statusAction}
                    dueDateAction={dueDateAction}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
              {tasks.length === 0
                ? "Még üres a lista — írd be fent az első teendőt."
                : "Minden kész ezen a listán! 🎉"}
            </p>
          )}

          {done.length > 0 && (
            <div className="mt-6">
              <button
                type="button"
                onClick={() => setShowDone((v) => !v)}
                className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              >
                <ChevronRight className={cn("w-4 h-4 transition", showDone && "rotate-90")} />
                Kész ({done.length})
              </button>
              {showDone && (
                <ul className="mt-3 space-y-2">
                  {done.map((t) => (
                    <li key={t.id}>
                      <Row
                        task={t}
                        inheritedTags={inheritedTags}
                        toggleDoneAction={toggleDoneAction}
                        deleteAction={deleteAction}
                        statusAction={statusAction}
                        dueDateAction={dueDateAction}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

function Row({
  task,
  inheritedTags,
  toggleDoneAction,
  deleteAction,
  statusAction,
  dueDateAction,
}: {
  task: Entry;
  inheritedTags: string[];
  toggleDoneAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
  statusAction: (fd: FormData) => void | Promise<void>;
  dueDateAction: (fd: FormData) => void | Promise<void>;
}) {
  const subTotal = task.subtasks.length;
  const subDone = task.subtasks.filter((s) => s.done).length;
  const shared = task.ownerId === SHARED_OWNER;

  return (
    <div
      className={cn(
        "flex items-center gap-2.5 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] px-3 py-2 shadow-sm transition",
        task.done ? "opacity-70" : "hover:border-[var(--color-primary)]/40 hover:shadow-md"
      )}
    >
      <form action={toggleDoneAction} className="shrink-0">
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-label={task.done ? "Vissza" : "Kész"}
          className={cn(
            "w-6 h-6 rounded-lg border flex items-center justify-center transition",
            task.done
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-[var(--color-border)] text-transparent hover:border-emerald-500"
          )}
        >
          <Check className="w-3.5 h-3.5" />
        </button>
      </form>

      <div className="flex-1 min-w-0">
        <Link href={`/teendok/${task.id}`} className="block">
          <p className={cn("font-medium text-[14px] leading-tight truncate", task.done && "line-through")}>
            {task.title}
          </p>
        </Link>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <StatusControl id={task.id} status={task.status} statusAction={statusAction} />
          <DueDateControl id={task.id} dueDate={task.dueDate} dueDateAction={dueDateAction} />
          {subTotal > 0 && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
              <ListChecks className="w-3 h-3" /> {subDone}/{subTotal}
            </span>
          )}
          {task.files.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[11px] text-[var(--color-muted-foreground)]">
              <Paperclip className="w-3 h-3" /> {task.files.length}
            </span>
          )}
          <TagChips tags={task.tags} inherited={inheritedTags} />
        </div>
      </div>

      {shared ? (
        <span
          className="shrink-0 w-6 h-6 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] flex items-center justify-center"
          title="Közös"
        >
          <Users className="w-3.5 h-3.5" />
        </span>
      ) : (
        task.ownerName && (
          <span
            className="shrink-0 w-6 h-6 rounded-full brand-gradient text-white text-[9px] font-semibold flex items-center justify-center"
            title={task.ownerName}
          >
            {initials(task.ownerName)}
          </span>
        )
      )}

      <ConfirmDeleteButton
        id={task.id}
        title={task.title}
        deleteAction={deleteAction}
        variant="icon"
      />
    </div>
  );
}
