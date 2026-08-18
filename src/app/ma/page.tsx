import { requireUser } from "@/lib/auth";
import {
  listTasks,
  listHouseholdMembers,
  listProjects,
  listTaskLists,
} from "@/lib/data";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { catColor } from "@/lib/expense-visuals";
import { SHARED_OWNER } from "@/lib/types";
import { todayStr, addInterval } from "@/lib/task-repeat";
import {
  CalendarCheck,
  ListTodo,
  Plus,
  ChevronRight,
  Sparkles,
} from "lucide-react";
import { TaskListClient } from "../teendok/TaskListClient";
import {
  toggleTaskDoneAction,
  deleteTaskFromListAction,
  setTaskStatusAction,
  setTaskDueDateAction,
  reorderTasksAction,
} from "../teendok/actions";

const MONTHS = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];
const DOW_LONG = [
  "vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat",
];

// Napi áttekintő: ami lejárt, ami mára és holnapra esedékes — egy képernyőn.
export default async function MaPage() {
  const me = await requireUser();
  const [tasks, members, projects, lists] = await Promise.all([
    listTasks(me.householdId),
    listHouseholdMembers(me.householdId),
    listProjects(me.householdId),
    listTaskLists(me.householdId),
  ]);

  const today = todayStr();
  const tomorrow = addInterval(today, { unit: "day", every: 1 });

  const open = tasks.filter((t) => !t.done);
  const overdue = open.filter((t) => t.dueDate && t.dueDate < today);
  const dueToday = open.filter((t) => t.dueDate === today);
  const dueTomorrow = open.filter((t) => t.dueDate === tomorrow);
  const focus = [...overdue, ...dueToday, ...dueTomorrow];

  const nameOf = (id: string | null) =>
    id && id !== SHARED_OWNER
      ? members.find((m) => m.id === id)?.name ?? null
      : null;
  const enriched = focus.map((t) => ({ ...t, ownerName: nameOf(t.ownerId) }));

  // Csak azok a listák, amikben van még nyitott teendő.
  const activeLists = lists
    .map((l) => {
      const own = tasks.filter((t) => t.listId === l.id);
      const done = own.filter((t) => t.done).length;
      return {
        list: l,
        total: own.length,
        done,
        pct: own.length ? Math.round((done / own.length) * 100) : 0,
      };
    })
    .filter((x) => x.total > 0 && x.done < x.total);

  const now = new Date();
  const dateLabel = `${now.getFullYear()}. ${MONTHS[now.getMonth()]} ${now.getDate()}., ${DOW_LONG[now.getDay()]}`;

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader title="Ma" subtitle={dateLabel} back="/" />

      <div className="mt-5 grid grid-cols-3 gap-3">
        <Stat label="Lejárt" value={overdue.length} tone="red" />
        <Stat label="Mára" value={dueToday.length} tone="primary" />
        <Stat label="Holnap" value={dueTomorrow.length} tone="muted" />
      </div>

      {focus.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Sparkles}
            title="Mára nincs esedékes teendő"
            description="Se lejárt, se mai, se holnapi határidő. Ha akarsz, nézd meg a teljes listát vagy vegyél fel valamit."
            action={
              <Button href="/teendok" leftIcon={<ListTodo className="w-4 h-4" />}>
                Minden teendő
              </Button>
            }
          />
        </div>
      ) : (
        <TaskListClient
          tasks={enriched}
          members={members}
          projects={projects}
          lists={lists}
          myId={me.userId}
          toggleDoneAction={toggleTaskDoneAction}
          deleteAction={deleteTaskFromListAction}
          statusAction={setTaskStatusAction}
          reorderAction={reorderTasksAction}
          dueDateAction={setTaskDueDateAction}
        />
      )}

      {/* Futó listák haladása */}
      {activeLists.length > 0 && (
        <section className="mt-8">
          <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-[0.08em] text-[var(--color-muted-foreground)]">
            Futó listák
          </h2>
          <div className="grid gap-2.5 md:grid-cols-2">
            {activeLists.map(({ list, total, done, pct }) => {
              const col = catColor(list.color);
              return (
                <Link
                  key={list.id}
                  href={`/teendok/listak/${list.id}`}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm transition hover:border-[var(--color-primary)]/40"
                >
                  <div className="flex items-center gap-2.5">
                    <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", col.dot)} />
                    <p className="flex-1 min-w-0 truncate text-sm font-semibold">{list.name}</p>
                    <span className="text-[11px] tabular-nums text-[var(--color-muted-foreground)]">
                      {done}/{total}
                    </span>
                  </div>
                  <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-[var(--color-muted)]">
                    <div className={cn("h-full rounded-full", col.dot)} style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      <div className="mt-8 grid grid-cols-2 gap-3">
        <Button href="/teendok/uj" size="lg" leftIcon={<Plus className="w-4 h-4" />}>
          Új teendő
        </Button>
        <Button
          href="/teendok"
          size="lg"
          variant="secondary"
          rightIcon={<ChevronRight className="w-4 h-4" />}
        >
          Minden teendő
        </Button>
      </div>
    </main>
  );
}

function Stat({
  label,
  value,
  tone,
}: {
  label: string;
  value: number;
  tone: "red" | "primary" | "muted";
}) {
  return (
    <div
      className={cn(
        "rounded-2xl border p-3",
        tone === "red" && value > 0
          ? "border-red-500/40 bg-red-500/8"
          : "border-[var(--color-border)] bg-[var(--color-card)]"
      )}
    >
      <div className="flex items-center gap-1.5 text-[var(--color-muted-foreground)]">
        <CalendarCheck className="w-3.5 h-3.5" />
        <span className="text-[11px] font-medium">{label}</span>
      </div>
      <p
        className={cn(
          "mt-0.5 text-2xl font-bold tabular-nums",
          tone === "red" && value > 0 && "text-red-600 dark:text-red-400",
          tone === "primary" && value > 0 && "text-[var(--color-primary)]"
        )}
      >
        {value}
      </p>
    </div>
  );
}
