"use client";

import Link from "next/link";
import { cn } from "@/lib/cn";
import type { Task, Project, TaskList } from "@/lib/types";
import { SHARED_OWNER, TASK_STATUSES } from "@/lib/types";
import { STATUS_VISUAL } from "@/lib/task-visuals";
import { catColor } from "@/lib/expense-visuals";
import { StatusControl } from "@/components/ui/StatusControl";
import { DueDateControl } from "@/components/ui/DueDateControl";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { TagChips } from "@/components/ui/TagChips";
import {
  Check,
  ListChecks,
  Paperclip,
  FolderKanban,
  ListTodo,
  Users,
} from "lucide-react";

type Entry = Task & { ownerName: string | null };

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// Rendezés: lejárt határidejűek legelöl, aztán közelítő határidő, végül a
// dátum nélküliek — létrehozás sorrendjében.
function dueRank(t: Entry, today: string): number {
  if (!t.dueDate) return 2;
  return t.dueDate < today ? 0 : 1;
}

// Teendők státusz szerinti oszlopokba rendezve, sor-nézetben — a Board oldal
// alternatívája a kanbanhoz képest, ugyanazokkal a műveletekkel minden soron.
export function StatusListView({
  tasks,
  projects = [],
  lists = [],
  toggleDoneAction,
  deleteAction,
  statusAction,
  dueDateAction,
}: {
  tasks: Entry[];
  projects?: Project[];
  lists?: TaskList[];
  toggleDoneAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
  statusAction: (fd: FormData) => void | Promise<void>;
  dueDateAction: (fd: FormData) => void | Promise<void>;
}) {
  const projectById = new Map(projects.map((p) => [p.id, p]));
  const listById = new Map(lists.map((l) => [l.id, l]));
  const today = todayStr();

  const sorted = (arr: Entry[]) =>
    [...arr].sort(
      (a, b) =>
        dueRank(a, today) - dueRank(b, today) ||
        (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
        a.createdAt - b.createdAt
    );

  return (
    <div className="mt-5 space-y-6">
      {TASK_STATUSES.map((s) => {
        const vis = STATUS_VISUAL[s];
        const items = sorted(tasks.filter((t) => t.status === s));
        return (
          <section key={s}>
            <h2 className="mb-2 flex items-center gap-2 text-[13px] font-semibold">
              <span
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5",
                  vis.soft,
                  vis.text
                )}
              >
                <span className={cn("w-2 h-2 rounded-full", vis.dot)} />
                {vis.label}
                <span className="opacity-70">{items.length}</span>
              </span>
            </h2>
            {items.length === 0 ? (
              <p className="px-1 text-xs text-[var(--color-muted-foreground)]">Üres</p>
            ) : (
              <div className="space-y-2.5">
                {items.map((t) => (
                  <Card
                    key={t.id}
                    task={t}
                    project={t.projectId ? projectById.get(t.projectId) ?? null : null}
                    list={t.listId ? listById.get(t.listId) ?? null : null}
                    toggleDoneAction={toggleDoneAction}
                    deleteAction={deleteAction}
                    statusAction={statusAction}
                    dueDateAction={dueDateAction}
                  />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

function Card({
  task,
  project,
  list,
  toggleDoneAction,
  deleteAction,
  statusAction,
  dueDateAction,
}: {
  task: Entry;
  project?: Project | null;
  list?: TaskList | null;
  toggleDoneAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
  statusAction: (fd: FormData) => void | Promise<void>;
  dueDateAction: (fd: FormData) => void | Promise<void>;
}) {
  const inherited = list?.inheritTags ? list.tags : [];
  const shared = task.ownerId === SHARED_OWNER;
  const overdue = !task.done && !!task.dueDate && task.dueDate < todayStr();
  const subTotal = task.subtasks.length;
  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border bg-[var(--color-card)] p-3 shadow-sm transition",
        overdue
          ? "border-red-500/40"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40 hover:shadow-md"
      )}
    >
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

      <div className="flex-1 min-w-0">
        <Link href={`/teendok/${task.id}`} className="block">
          <p className={cn("font-semibold text-[15px] leading-tight", task.done && "line-through")}>
            {task.title}
          </p>
          {(subTotal > 0 || task.files.length > 0 || task.tags.length > 0 || inherited.length > 0 || project || list) && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[11px]">
              {subTotal > 0 && (
                <span className="inline-flex items-center gap-1 text-[var(--color-muted-foreground)]">
                  <ListChecks className="w-3 h-3" /> {subDone}/{subTotal}
                </span>
              )}
              {task.files.length > 0 && (
                <span className="inline-flex items-center gap-0.5 text-[var(--color-muted-foreground)]">
                  <Paperclip className="w-3 h-3" /> {task.files.length}
                </span>
              )}
              {list && (
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-medium",
                    catColor(list.color).soft,
                    catColor(list.color).text
                  )}
                >
                  <ListTodo className="w-3 h-3" /> {list.name}
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
              <TagChips tags={task.tags} inherited={inherited} />
            </div>
          )}
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-2">
          <StatusControl id={task.id} status={task.status} statusAction={statusAction} />
          <DueDateControl id={task.id} dueDate={task.dueDate} dueDateAction={dueDateAction} />
        </div>
      </div>

      {shared ? (
        <span
          className="shrink-0 w-7 h-7 rounded-full bg-[var(--color-muted)] text-[var(--color-muted-foreground)] flex items-center justify-center"
          title="Közös"
        >
          <Users className="w-4 h-4" />
        </span>
      ) : (
        task.ownerName && (
          <span
            className="shrink-0 w-7 h-7 rounded-full brand-gradient text-white text-[10px] font-semibold flex items-center justify-center"
            title={task.ownerName}
          >
            {initials(task.ownerName)}
          </span>
        )
      )}

      <ConfirmDeleteButton id={task.id} title={task.title} deleteAction={deleteAction} variant="icon" />
    </div>
  );
}
