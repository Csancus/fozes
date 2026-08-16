"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { STATUS_VISUAL } from "@/lib/task-visuals";
import { TASK_STATUSES, SHARED_OWNER } from "@/lib/types";
import type { Task, TaskStatus } from "@/lib/types";
import { ListChecks, Paperclip, Users, GripVertical } from "lucide-react";
import { DueDateControl } from "@/components/ui/DueDateControl";

export type BoardTask = Task & { ownerName: string | null };

function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
// Rendezési súly: lejárt legelöl, aztán közelítő határidő, végül a dátum nélküliek.
function dueRank(t: BoardTask): number {
  if (!t.dueDate) return 2;
  return t.dueDate < todayStr() ? 0 : 1;
}
function byDue(a: BoardTask, b: BoardTask): number {
  return dueRank(a) - dueRank(b) || (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999");
}
function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

// Kanban nézet: oszlop = státusz. Asztalon húzható, mobilon a kártya alján
// lévő státusz-gombokkal mozgatható.
export function TaskBoard({
  tasks,
  statusAction,
  dueDateAction,
}: {
  tasks: BoardTask[];
  statusAction: (fd: FormData) => void | Promise<void>;
  dueDateAction: (fd: FormData) => void | Promise<void>;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);
  const [, start] = useTransition();

  function move(id: string, status: TaskStatus) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    start(async () => {
      await statusAction(fd);
    });
  }

  return (
    <div className="mt-5 -mx-5 px-5 overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        {TASK_STATUSES.map((s) => {
          const vis = STATUS_VISUAL[s];
          const items = tasks.filter((t) => t.status === s).sort(byDue);
          return (
            <section
              key={s}
              onDragOver={(e) => {
                e.preventDefault();
                setOver(s);
              }}
              onDragLeave={() => setOver((cur) => (cur === s ? null : cur))}
              onDrop={(e) => {
                e.preventDefault();
                setOver(null);
                if (dragId) move(dragId, s);
                setDragId(null);
              }}
              className={cn(
                "w-[78vw] max-w-[300px] shrink-0 rounded-2xl border p-2.5 transition",
                over === s
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/40"
                  : "border-[var(--color-border)] bg-[var(--color-muted)]/25"
              )}
            >
              <h3 className="mb-2 flex items-center gap-2 px-1 text-[13px] font-semibold">
                <span className={cn("w-2 h-2 rounded-full", vis.dot)} />
                {vis.label}
                <span className="text-[var(--color-muted-foreground)] tabular-nums">
                  {items.length}
                </span>
              </h3>

              <div className="space-y-2">
                {items.map((t) => (
                  <BoardCard
                    key={t.id}
                    task={t}
                    dueDateAction={dueDateAction}
                    onDragStart={() => setDragId(t.id)}
                    onDragEnd={() => setDragId(null)}
                    onMove={(next) => move(t.id, next)}
                  />
                ))}
                {items.length === 0 && (
                  <p className="px-1 py-6 text-center text-xs text-[var(--color-muted-foreground)]">
                    Üres
                  </p>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </div>
  );
}

function BoardCard({
  task,
  dueDateAction,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  task: BoardTask;
  dueDateAction: (fd: FormData) => void | Promise<void>;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (status: TaskStatus) => void;
}) {
  const subTotal = task.subtasks.length;
  const subDone = task.subtasks.filter((s) => s.done).length;
  const shared = task.ownerId === SHARED_OWNER;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      className="rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-2.5 shadow-sm transition hover:border-[var(--color-primary)]/40"
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[var(--color-muted-foreground)] cursor-grab" />
        <Link href={`/teendok/${task.id}`} className="flex-1 min-w-0">
          <p className={cn("text-sm font-medium leading-snug", task.status === "done" && "line-through opacity-70")}>
            {task.title}
          </p>
        </Link>
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
      </div>

      <div className="mt-1.5 flex flex-wrap items-center gap-2 pl-5 text-[11px]">
        <DueDateControl id={task.id} dueDate={task.dueDate} dueDateAction={dueDateAction} size="sm" />
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
      </div>

      {/* Mobil: állapotváltó gombsor */}
      <div className="mt-2 flex gap-1 pl-5">
        {TASK_STATUSES.filter((s) => s !== task.status).map((s) => {
          const v = STATUS_VISUAL[s];
          const Icon = v.icon;
          return (
            <button
              key={s}
              type="button"
              onClick={() => onMove(s)}
              title={`Áthelyezés: ${v.label}`}
              aria-label={`Áthelyezés: ${v.label}`}
              className={cn(
                "h-6 w-6 rounded-lg flex items-center justify-center transition hover:brightness-95",
                v.soft,
                v.text
              )}
            >
              <Icon className="w-3.5 h-3.5" />
            </button>
          );
        })}
      </div>
    </div>
  );
}
