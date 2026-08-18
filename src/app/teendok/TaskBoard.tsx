"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Link from "next/link";
import { cn } from "@/lib/cn";
import { STATUS_VISUAL } from "@/lib/task-visuals";
import { TASK_STATUSES, SHARED_OWNER } from "@/lib/types";
import type { Task, TaskStatus } from "@/lib/types";
import {
  ListChecks,
  Paperclip,
  Users,
  GripVertical,
  Hand,
  X,
  ArrowDownUp,
  CalendarClock,
} from "lucide-react";
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
  reorderAction,
}: {
  tasks: BoardTask[];
  statusAction: (fd: FormData) => void | Promise<void>;
  dueDateAction: (fd: FormData) => void | Promise<void>;
  reorderAction?: (fd: FormData) => void | Promise<void>;
}) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<TaskStatus | null>(null);
  // Mobil: hosszu nyomasra "felveszed" a kartyat, aztan az oszlopra koppintasz.
  const [picked, setPicked] = useState<BoardTask | null>(null);
  // A long-press elengedése egy click-et is szül — azt az oszlop NE dobásnak
  // vegye, különben a kártya azonnal visszakerül és a felvétel megszűnik.
  const pickedAt = useRef(0);
  // "Határidő" = lejárt elöl, aztán dátum szerint; "Kézi" = a mentett pozíció.
  const [sortMode, setSortMode] = useState<"due" | "manual">("due");
  const [, start] = useTransition();

  useEffect(() => {
    const saved = localStorage.getItem("teendok-board-sort");
    if (saved === "manual" || saved === "due") setSortMode(saved);
  }, []);
  function pickSort(m: "due" | "manual") {
    setSortMode(m);
    localStorage.setItem("teendok-board-sort", m);
  }

  // Escape = elengedes (asztali billentyuzeten is)
  useEffect(() => {
    if (!picked) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setPicked(null);
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [picked]);

  function ordered(status: TaskStatus): BoardTask[] {
    const items = tasks.filter((t) => t.status === status);
    return sortMode === "manual"
      ? [...items].sort((a, b) => a.position - b.position || byDue(a, b))
      : [...items].sort(byDue);
  }

  // Beszúrás adott indexre: a cél-oszlop teljes új sorrendjét küldjük a
  // szervernek, és a nézet kézi sorrendre vált (különben a dátum-rendezés
  // visszaugrana).
  function insertAt(task: BoardTask, status: TaskStatus, index: number) {
    if (!reorderAction) {
      if (task.status !== status) move(task.id, status);
      return;
    }
    const column = ordered(status).filter((t) => t.id !== task.id);
    const at = Math.max(0, Math.min(index, column.length));
    const next = [...column.slice(0, at), task, ...column.slice(at)];
    const fd = new FormData();
    fd.set("status", status);
    fd.set("movedId", task.id);
    fd.set("ids", JSON.stringify(next.map((t) => t.id)));
    pickSort("manual");
    start(async () => {
      await reorderAction(fd);
    });
  }

  function move(id: string, status: TaskStatus) {
    const fd = new FormData();
    fd.set("id", id);
    fd.set("status", status);
    start(async () => {
      await statusAction(fd);
    });
  }

  // Épp "a kézben" lévő tétel: húzás (asztal) vagy long-press (mobil).
  const moving = picked ?? tasks.find((t) => t.id === dragId) ?? null;

  return (
    <div className="mt-5">
      {reorderAction && (
        <div className="mb-2 flex items-center justify-end gap-1.5">
          <span className="text-[11px] text-[var(--color-muted-foreground)]">Sorrend:</span>
          <div className="flex rounded-lg border border-[var(--color-border)] p-0.5">
            {([
              { id: "due", label: "Határidő", icon: CalendarClock },
              { id: "manual", label: "Kézi", icon: ArrowDownUp },
            ] as const).map((m) => {
              const Icon = m.icon;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => pickSort(m.id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-md px-2 py-1 text-[11px] font-medium transition",
                    sortMode === m.id
                      ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
                      : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  )}
                >
                  <Icon className="w-3 h-3" /> {m.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
      <div className="-mx-5 px-5 overflow-x-auto">
      <div className="flex gap-3 min-w-max pb-2">
        {TASK_STATUSES.map((s) => {
          const vis = STATUS_VISUAL[s];
          const items = ordered(s);
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
                const dragged = tasks.find((t) => t.id === dragId) ?? null;
                if (dragged) {
                  insertAt(dragged, s, ordered(s).filter((t) => t.id !== dragged.id).length);
                }
                setDragId(null);
              }}
              onClick={() => {
                if (!picked) return;
                if (performance.now() - pickedAt.current < 500) return;
                insertAt(picked, s, ordered(s).filter((t) => t.id !== picked.id).length);
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
                {items.map((t, i) => (
                  <div key={t.id}>
                  <Gap
                    active={!!moving && moving.id !== t.id}
                    onInsert={() => moving && insertAt(moving, s, i)}
                  />
                  <BoardCard
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
                  </div>
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

// Beszúrási rés két kártya között: csak mozgatás közben látszik. Asztalon
// dobási cél, mobilon koppintható — ugyanaz a mechanizmus mindkettőn.
function Gap({ active, onInsert }: { active: boolean; onInsert: () => void }) {
  const [over, setOver] = useState(false);
  if (!active) return null;
  return (
    <div
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        onInsert();
      }}
      onClick={(e) => {
        e.stopPropagation();
        onInsert();
      }}
      className={cn(
        "mb-2 flex items-center justify-center rounded-lg border border-dashed transition",
        over
          ? "h-9 border-[var(--color-primary)] bg-[var(--color-primary-soft)]"
          : "h-6 border-[var(--color-border)] hover:border-[var(--color-primary)]/60"
      )}
    >
      <span className="text-[10px] font-medium text-[var(--color-muted-foreground)]">ide</span>
    </div>
  );
}
