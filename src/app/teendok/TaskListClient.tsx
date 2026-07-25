"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Task, Project } from "@/lib/types";
import { catColor } from "@/lib/expense-visuals";
import {
  Check,
  CalendarDays,
  Paperclip,
  ListChecks,
  FolderKanban,
  ChevronRight,
  Image as ImageIcon,
} from "lucide-react";
import { DeleteTaskButton } from "./DeleteTaskButton";

type Entry = Task & { ownerName: string | null };

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

const DOW = ["vas", "hét", "kedd", "sze", "csüt", "pén", "szo"];
function fmtDue(due: string): string {
  const [y, m, d] = due.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return `${m}. ${d}. (${DOW[date.getDay()]})`;
}
function daysFromToday(due: string): number {
  const t = new Date(todayStr() + "T00:00:00");
  const dd = new Date(due + "T00:00:00");
  return Math.round((dd.getTime() - t.getTime()) / 86400000);
}

type Bucket = { key: string; label: string; tone: string; items: Entry[] };

export function TaskListClient({
  tasks,
  members,
  projects = [],
  myId,
  toggleDoneAction,
  deleteAction,
}: {
  tasks: Entry[];
  members: { id: string; name: string }[];
  projects?: Project[];
  myId?: string;
  toggleDoneAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
}) {
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const [owner, setOwner] = useState<string>("all"); // all | userId | me
  const [showDone, setShowDone] = useState(false);

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (owner === "all") return true;
      if (owner === "__me") return t.ownerId === myId;
      return t.ownerId === owner;
    });
  }, [tasks, owner, myId]);

  const open = filtered.filter((t) => !t.done);
  const done = filtered.filter((t) => t.done);

  const buckets = useMemo<Bucket[]>(() => {
    const overdue: Entry[] = [];
    const today: Entry[] = [];
    const soon: Entry[] = [];
    const later: Entry[] = [];
    const nodate: Entry[] = [];
    for (const t of open) {
      if (!t.dueDate) {
        nodate.push(t);
        continue;
      }
      const diff = daysFromToday(t.dueDate);
      if (diff < 0) overdue.push(t);
      else if (diff === 0) today.push(t);
      else if (diff <= 7) soon.push(t);
      else later.push(t);
    }
    const byDate = (a: Entry, b: Entry) =>
      (a.dueDate ?? "").localeCompare(b.dueDate ?? "");
    overdue.sort(byDate);
    today.sort(byDate);
    soon.sort(byDate);
    later.sort(byDate);
    return [
      { key: "overdue", label: "Lejárt", tone: "red", items: overdue },
      { key: "today", label: "Ma", tone: "primary", items: today },
      { key: "soon", label: "Következő 7 nap", tone: "amber", items: soon },
      { key: "later", label: "Későbbi", tone: "muted", items: later },
      { key: "nodate", label: "Nincs határidő", tone: "muted", items: nodate },
    ].filter((b) => b.items.length > 0);
  }, [open]);

  const ownerTabs = [
    { id: "all", name: "Mind" },
    ...(myId ? [{ id: "__me", name: "Enyém" }] : []),
    ...members.filter((m) => m.id !== myId).map((m) => ({ id: m.id, name: m.name })),
  ];

  return (
    <div>
      {/* Owner szűrő */}
      {members.length > 0 && (
        <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
          {ownerTabs.map((o) => (
            <button
              key={o.id}
              type="button"
              onClick={() => setOwner(o.id)}
              className={cn(
                "shrink-0 h-8 px-3 rounded-full text-[13px] font-medium border transition whitespace-nowrap",
                owner === o.id
                  ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-transparent"
                  : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              )}
            >
              {o.name}
            </button>
          ))}
        </div>
      )}

      {open.length === 0 ? (
        <p className="mt-10 text-center text-sm text-[var(--color-muted-foreground)]">
          Minden kész! 🎉 Nincs nyitott teendő.
        </p>
      ) : (
        <div className="mt-5 space-y-6">
          {buckets.map((b) => (
            <section key={b.key}>
              <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
                <span
                  className={cn(
                    "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
                    b.tone === "red" && "bg-red-500/12 text-red-600 dark:text-red-400",
                    b.tone === "primary" && "bg-[var(--color-primary-soft)] text-[var(--color-primary)]",
                    b.tone === "amber" && "bg-amber-500/12 text-amber-600 dark:text-amber-400",
                    b.tone === "muted" && "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
                  )}
                >
                  {b.label}
                  <span className="opacity-70">{b.items.length}</span>
                </span>
              </h2>
              <div className="space-y-2.5">
                {b.items.map((t) => (
                  <TaskCard
                    key={t.id}
                    task={t}
                    project={t.projectId ? projectById.get(t.projectId) ?? null : null}
                    toggleDoneAction={toggleDoneAction}
                    deleteAction={deleteAction}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Kész */}
      {done.length > 0 && (
        <div className="mt-8">
          <button
            type="button"
            onClick={() => setShowDone((v) => !v)}
            className="flex items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          >
            <ChevronRight className={cn("w-4 h-4 transition", showDone && "rotate-90")} />
            Kész ({done.length})
          </button>
          {showDone && (
            <div className="mt-3 space-y-2.5">
              {done.map((t) => (
                <TaskCard
                  key={t.id}
                  task={t}
                  project={t.projectId ? projectById.get(t.projectId) ?? null : null}
                  toggleDoneAction={toggleDoneAction}
                  deleteAction={deleteAction}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function TaskCard({
  task,
  project,
  toggleDoneAction,
  deleteAction,
}: {
  task: Entry;
  project?: Project | null;
  toggleDoneAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
}) {
  const subTotal = task.subtasks.length;
  const subDone = task.subtasks.filter((s) => s.done).length;
  const overdue = !task.done && task.dueDate && daysFromToday(task.dueDate) < 0;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-[var(--color-card)] p-3 shadow-sm transition",
        task.done ? "border-[var(--color-border)] opacity-70" : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-md"
      )}
    >
      {/* Pipa (külön form) */}
      <form action={toggleDoneAction} className="shrink-0 pt-0.5">
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          className={cn(
            "w-7 h-7 rounded-lg border flex items-center justify-center transition",
            task.done
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-[var(--color-border)] text-transparent hover:border-emerald-500"
          )}
          aria-label={task.done ? "Vissza" : "Kész"}
        >
          <Check className="w-4 h-4" />
        </button>
      </form>

      {/* Tartalom (Link a detailre) */}
      <Link href={`/teendok/${task.id}`} className="flex-1 min-w-0">
        <p className={cn("font-semibold text-[15px] leading-tight", task.done && "line-through")}>
          {task.title}
        </p>
        {task.description && !task.done && (
          <p className="mt-0.5 text-xs text-[var(--color-muted-foreground)] line-clamp-1">
            {task.description}
          </p>
        )}
        <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
          {task.dueDate && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                overdue
                  ? "bg-red-500/12 text-red-600 dark:text-red-400"
                  : "bg-[var(--color-muted)] text-[var(--color-muted-foreground)]"
              )}
            >
              <CalendarDays className="w-3 h-3" /> {fmtDue(task.dueDate)}
            </span>
          )}
          {subTotal > 0 && (
            <span className="inline-flex items-center gap-1 text-[var(--color-muted-foreground)]">
              <ListChecks className="w-3 h-3" /> {subDone}/{subTotal}
            </span>
          )}
          {task.imageUrl && (
            <span className="inline-flex items-center gap-0.5 text-[var(--color-muted-foreground)]">
              <ImageIcon className="w-3 h-3" />
            </span>
          )}
          {task.files.length > 0 && (
            <span className="inline-flex items-center gap-0.5 text-[var(--color-muted-foreground)]">
              <Paperclip className="w-3 h-3" /> {task.files.length}
            </span>
          )}
          {project && (
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                catColor(project.color).soft,
                catColor(project.color).text
              )}
            >
              <FolderKanban className="w-3 h-3" /> {project.name}
            </span>
          )}
        </div>
      </Link>

      {/* Owner avatar */}
      {task.ownerName && (
        <span
          className="shrink-0 w-7 h-7 rounded-full brand-gradient text-white text-[10px] font-semibold flex items-center justify-center"
          title={task.ownerName}
        >
          {initials(task.ownerName)}
        </span>
      )}

      <DeleteTaskButton id={task.id} title={task.title} deleteAction={deleteAction} variant="icon" />
    </div>
  );
}
