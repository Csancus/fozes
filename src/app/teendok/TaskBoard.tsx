"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { STATUS_VISUAL } from "@/lib/task-visuals";
import { TASK_STATUSES, SHARED_OWNER } from "@/lib/types";
import type { Task, TaskStatus } from "@/lib/types";
import { ListChecks, Paperclip, Users, GripVertical, Hand, X } from "lucide-react";
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

// Kanban nézet: oszlop = státusz. Asztalon húzható (HTML5 drag&drop), mobilon
// hosszu nyomasra "felveszed" a kartyat es a cel-oszlopra koppintasz — vagy a
// kartya aljan levo statusz-gombokkal leptetsz.
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
  // Mobil: hosszu nyomasra "felveszed" a kartyat, aztan az oszlopra koppintasz.
  const [picked, setPicked] = useState<BoardTask | null>(null);
  // A long-press elengedése egy click-et is szül — azt az oszlop NE dobásnak
  // vegye, különben a kártya azonnal visszakerül és a felvétel megszűnik.
  const pickedAt = useRef(0);
  const [, start] = useTransition();

  // Escape = elengedes (asztali billentyuzeten is)
  useEffect(() => {
    if (!picked) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicked(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [picked]);

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
              onClick={() => {
                if (!picked) return;
                if (performance.now() - pickedAt.current < 500) return;
                if (picked.status !== s) move(picked.id, s);
                setPicked(null);
              }}
              className={cn(
                "w-[78vw] max-w-[300px] shrink-0 rounded-2xl border p-2.5 transition",
                over === s
                  ? "border-[var(--color-primary)] bg-[var(--color-primary-soft)]/40"
                  : picked && picked.status !== s
                    ? "border-[var(--color-primary)]/60 bg-[var(--color-primary-soft)]/20 cursor-pointer"
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
                    picked={picked?.id === t.id}
                    onPick={() => {
                      pickedAt.current = performance.now();
                      setPicked(t);
                    }}
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

      {/* Felvett kartya: koppints egy oszlopra */}
      {picked && (
        <div className="sticky bottom-3 z-30 mt-2 flex items-center gap-2 rounded-2xl border border-[var(--color-primary)] bg-[var(--color-card)] p-3 shadow-lg">
          <Hand className="w-4 h-4 shrink-0 text-[var(--color-primary)]" />
          <p className="flex-1 min-w-0 text-xs">
            <span className="font-semibold">{picked.title}</span>
            <span className="text-[var(--color-muted-foreground)]"> — koppints egy oszlopra</span>
          </p>
          <button
            type="button"
            onClick={() => setPicked(null)}
            aria-label="Mégse"
            className="h-8 w-8 shrink-0 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function BoardCard({
  task,
  dueDateAction,
  picked,
  onPick,
  onDragStart,
  onDragEnd,
  onMove,
}: {
  task: BoardTask;
  dueDateAction: (fd: FormData) => void | Promise<void>;
  picked: boolean;
  onPick: () => void;
  onDragStart: () => void;
  onDragEnd: () => void;
  onMove: (status: TaskStatus) => void;
}) {
  const subTotal = task.subtasks.length;
  const subDone = task.subtasks.filter((s) => s.done).length;
  const shared = task.ownerId === SHARED_OWNER;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const startPos = useRef<{ x: number; y: number } | null>(null);

  // ~450 ms nyomva tartás = felvétel (mobilon ez helyettesíti a húzást).
  function armPick(e: React.PointerEvent) {
    clearPick();
    startPos.current = { x: e.clientX, y: e.clientY };
    timer.current = setTimeout(() => {
      onPick();
      if (typeof navigator !== "undefined" && navigator.vibrate) navigator.vibrate(15);
    }, 450);
  }
  // Csak VALÓDI elmozdulás szakítja meg (a böngésző pointerdown után is küld
  // pointermove-ot ugyanarra a pontra — az nem lehet mégse).
  function maybeCancel(e: React.PointerEvent) {
    const s = startPos.current;
    if (!s || !timer.current) return;
    if (Math.abs(e.clientX - s.x) > 8 || Math.abs(e.clientY - s.y) > 8) clearPick();
  }
  function clearPick() {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
  }

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onPointerDown={armPick}
      onPointerUp={clearPick}
      onPointerCancel={clearPick}
      onPointerMove={maybeCancel}
      onContextMenu={(e) => e.preventDefault()}
      className={cn(
        "rounded-xl border bg-[var(--color-card)] p-2.5 shadow-sm transition select-none",
        picked
          ? "border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/40 scale-[0.98]"
          : "border-[var(--color-border)] hover:border-[var(--color-primary)]/40"
      )}
    >
      <div className="flex items-start gap-1.5">
        <GripVertical className="mt-0.5 w-3.5 h-3.5 shrink-0 text-[var(--color-muted-foreground)] cursor-grab" />
        <Link
          href={`/teendok/${task.id}`}
          onClick={(e) => {
            if (picked) e.preventDefault();
          }}
          className="flex-1 min-w-0"
        >
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
