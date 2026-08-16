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
import { TagChips } from "@/components/ui/TagChips";
import { InfoTip } from "@/components/ui/InfoTip";
import { cn } from "@/lib/cn";
import { catColor } from "@/lib/expense-visuals";
import { SHARED_OWNER } from "@/lib/types";
import {
  Pencil,
  FolderKanban,
  Plane,
  Plus,
  CheckCheck,
} from "lucide-react";
import {
  toggleTaskDoneAction,
  deleteTaskFromListAction,
  addTaskToListAction,
  completeTaskListAction,
  setTaskStatusAction,
  setTaskDueDateAction,
} from "../../actions";
import { QuickAddTask } from "./QuickAddTask";
import { ListTasksView } from "./ListTasksView";

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

  const nameOf = (uid: string | null) =>
    uid && uid !== SHARED_OWNER
      ? members.find((m) => m.id === uid)?.name ?? null
      : null;

  const tasks = allTasks
    .filter((t) => t.listId === id)
    .map((t) => ({ ...t, ownerName: nameOf(t.ownerId) }));
  const doneCount = tasks.filter((t) => t.done).length;
  const openCount = tasks.length - doneCount;
  const pct = tasks.length ? Math.round((doneCount / tasks.length) * 100) : 0;
  const col = catColor(list.color);
  const inherited = list.inheritTags ? list.tags : [];

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

      {/* Szülő + címkék + haladás */}
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

        {list.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <TagChips tags={list.tags} size="md" />
            {list.inheritTags && (
              <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-muted-foreground)]">
                öröklődik
                <InfoTip label="Mit jelent az öröklődés?">
                  A lista címkéit <b>minden benne lévő teendő</b> — és a teendők
                  alteendői is — megkapják. Az örökölt címkék szaggatott
                  kerettel jelennek meg a tételeken.
                </InfoTip>
              </span>
            )}
          </div>
        )}

        {list.description && (
          <p className="mt-3 text-sm text-[var(--color-muted-foreground)] whitespace-pre-wrap">
            {list.description}
          </p>
        )}

        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="font-semibold tabular-nums">
            {doneCount}/{tasks.length} kész
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

      <ListTasksView
        tasks={tasks}
        inheritedTags={inherited}
        toggleDoneAction={toggleTaskDoneAction}
        deleteAction={deleteTaskFromListAction}
        statusAction={setTaskStatusAction}
        dueDateAction={setTaskDueDateAction}
      />

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
        {openCount > 0 && (
          <form action={completeTaskListAction}>
            <input type="hidden" name="listId" value={id} />
            <button
              type="submit"
              className="w-full h-12 rounded-xl border border-[var(--color-border)] text-emerald-600 dark:text-emerald-400 font-medium inline-flex items-center justify-center gap-2 hover:bg-emerald-500/10 transition active:scale-[0.98]"
            >
              <CheckCheck className="w-4 h-4" /> Mind kész ({openCount})
            </button>
          </form>
        )}
      </div>
    </main>
  );
}
