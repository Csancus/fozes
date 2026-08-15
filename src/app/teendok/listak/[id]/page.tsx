import { requireUser } from "@/lib/auth";
import {
  getTaskList,
  listTasks,
  listHouseholdMembers,
  getProject,
  getTrip,
} from "@/lib/data";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { cn } from "@/lib/cn";
import { catColor } from "@/lib/expense-visuals";
import type { Task } from "@/lib/types";
import {
  Pencil,
  Check,
  CalendarDays,
  FolderKanban,
  Plane,
  Plus,
  CheckCheck,
  ChevronRight,
  Paperclip,
  ListChecks,
} from "lucide-react";
import {
  toggleTaskDoneAction,
  deleteTaskFromListAction,
  addTaskToListAction,
  completeTaskListAction,
} from "../../actions";
import { QuickAddTask } from "./QuickAddTask";

const DOW = ["vas", "hét", "kedd", "sze", "csüt", "pén", "szo"];
function fmtDue(due: string): string {
  const [y, m, d] = due.split("-").map(Number);
  return `${m}. ${d}. (${DOW[new Date(y, m - 1, d).getDay()]})`;
}
function todayStr(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function initials(name: string): string {
  return name.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase();
}

export default async function TaskListDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const list = await getTaskList(me.householdId, id);
  if (!list) notFound();

  const [allTasks, members, project, trip] = await Promise.all([
    listTasks(me.householdId),
    listHouseholdMembers(me.householdId),
    list.projectId ? getProject(me.householdId, list.projectId) : null,
    list.tripId ? getTrip(me.householdId, list.tripId) : null,
  ]);

  const tasks = allTasks.filter((t) => t.listId === id);
  const byDue = (a: Task, b: Task) =>
    (a.dueDate ?? "9999").localeCompare(b.dueDate ?? "9999") ||
    a.createdAt - b.createdAt;
  const open = tasks.filter((t) => !t.done).sort(byDue);
  const done = tasks.filter((t) => t.done).sort((a, b) => (b.doneAt ?? 0) - (a.doneAt ?? 0));
  const pct = tasks.length ? Math.round((done.length / tasks.length) * 100) : 0;
  const col = catColor(list.color);
  const nameOf = (uid: string | null) =>
    uid ? members.find((m) => m.id === uid)?.name ?? null : null;

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title={list.name}
        subtitle="Teendő-lista"
        back={trip ? `/utazasok/${trip.id}` : "/teendok"}
        action={
          <Link
            href={`/teendok/listak/${id}/szerkesztes`}
            aria-label="Szerkesztés"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <Pencil className="w-4.5 h-4.5" />
          </Link>
        }
      />

      {/* Szülő + haladás */}
      <div className="mt-5 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
        <div className="flex flex-wrap items-center gap-2">
          {project && (
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[13px] font-medium",
                catColor(project.color).soft,
                catColor(project.color).text
              )}
            >
              <FolderKanban className="w-3.5 h-3.5" /> {project.name}
            </span>
          )}
          {trip && (
            <Link
              href={`/utazasok/${trip.id}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-[13px] font-medium text-[var(--color-primary)]"
            >
              <Plane className="w-3.5 h-3.5" /> {trip.name}
            </Link>
          )}
          {!project && !trip && (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--color-muted)] px-3 py-1 text-[13px] text-[var(--color-muted-foreground)]">
              Önálló lista
            </span>
          )}
        </div>

        {list.description && (
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)] whitespace-pre-wrap">
            {list.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-semibold tabular-nums">
            {done.length}/{tasks.length} kész
          </span>
          <span className="text-[var(--color-muted-foreground)] tabular-nums">{pct}%</span>
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
          <div className={cn("h-full rounded-full transition-all", col.dot)} style={{ width: `${pct}%` }} />
        </div>
      </div>

      {/* Gyors hozzáadás */}
      <div className="mt-4">
        <QuickAddTask listId={id} members={members} addAction={addTaskToListAction} />
      </div>

      {/* Nyitott teendők */}
      {open.length > 0 ? (
        <ul className="mt-4 space-y-2.5">
          {open.map((t) => (
            <li key={t.id}>
              <TaskRow task={t} ownerName={nameOf(t.ownerId)} />
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

      {/* Kész tételek */}
      {done.length > 0 && (
        <details className="mt-6 group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]">
            <ChevronRight className="w-4 h-4 transition group-open:rotate-90" />
            Kész ({done.length})
          </summary>
          <ul className="mt-3 space-y-2.5">
            {done.map((t) => (
              <li key={t.id}>
                <TaskRow task={t} ownerName={nameOf(t.ownerId)} />
              </li>
            ))}
          </ul>
        </details>
      )}

      {/* Műveletek */}
      <div className="mt-8 space-y-3">
        <Button
          href={`/teendok/uj?lista=${id}`}
          variant="secondary"
          size="lg"
          fullWidth
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Részletes teendő (kép, fájl, alteendők)
        </Button>
        {open.length > 0 && (
          <form action={completeTaskListAction}>
            <input type="hidden" name="listId" value={id} />
            <button
              type="submit"
              className="w-full h-12 rounded-xl border border-[var(--color-border)] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center justify-center gap-2 hover:bg-emerald-500/10 transition active:scale-[0.98]"
            >
              <CheckCheck className="w-4 h-4" /> Mind kész ({open.length})
            </button>
          </form>
        )}
      </div>
    </main>
  );
}

function TaskRow({ task, ownerName }: { task: Task; ownerName: string | null }) {
  const overdue = !task.done && task.dueDate && task.dueDate < todayStr();
  const subTotal = task.subtasks.length;
  const subDone = task.subtasks.filter((s) => s.done).length;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm transition",
        task.done ? "opacity-70" : "hover:border-[var(--color-primary)]/40 hover:shadow-md"
      )}
    >
      <form action={toggleTaskDoneAction} className="shrink-0 pt-0.5">
        <input type="hidden" name="id" value={task.id} />
        <button
          type="submit"
          aria-label={task.done ? "Vissza" : "Kész"}
          className={cn(
            "w-7 h-7 rounded-lg border flex items-center justify-center transition",
            task.done
              ? "bg-emerald-500 border-emerald-500 text-white"
              : "border-[var(--color-border)] text-transparent hover:border-emerald-500"
          )}
        >
          <Check className="w-4 h-4" />
        </button>
      </form>

      <Link href={`/teendok/${task.id}`} className="flex-1 min-w-0">
        <p className={cn("font-medium text-[15px] leading-tight", task.done && "line-through")}>
          {task.title}
        </p>
        {(task.dueDate || subTotal > 0 || task.files.length > 0) && (
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
            {task.files.length > 0 && (
              <span className="inline-flex items-center gap-0.5 text-[var(--color-muted-foreground)]">
                <Paperclip className="w-3 h-3" /> {task.files.length}
              </span>
            )}
          </div>
        )}
      </Link>

      {ownerName && (
        <span
          className="shrink-0 w-7 h-7 rounded-full brand-gradient text-white text-[10px] font-semibold flex items-center justify-center"
          title={ownerName}
        >
          {initials(ownerName)}
        </span>
      )}

      <ConfirmDeleteButton
        id={task.id}
        title={task.title}
        deleteAction={deleteTaskFromListAction}
        variant="icon"
      />
    </div>
  );
}
