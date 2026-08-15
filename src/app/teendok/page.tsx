import { requireUser } from "@/lib/auth";
import {
  listTasks,
  listHouseholdMembers,
  listTaskProjects,
  listTaskLists,
  listTrips,
} from "@/lib/data";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/cn";
import { catColor } from "@/lib/expense-visuals";
import {
  ListChecks,
  Plus,
  Table2,
  SlidersHorizontal,
  FolderKanban,
  Plane,
  ChevronRight,
} from "lucide-react";
import { TaskListClient } from "./TaskListClient";
import { toggleTaskDoneAction, deleteTaskFromListAction } from "./actions";

export default async function TeendokPage() {
  const me = await requireUser();
  const [tasks, members, projects, lists, trips] = await Promise.all([
    listTasks(me.householdId),
    listHouseholdMembers(me.householdId),
    listTaskProjects(me.householdId),
    listTaskLists(me.householdId),
    listTrips(me.householdId),
  ]);

  const projectById = new Map(projects.map((p) => [p.id, p]));
  const tripById = new Map(trips.map((t) => [t.id, t]));
  const listCards = lists.map((l) => {
    const own = tasks.filter((t) => t.listId === l.id);
    const doneCount = own.filter((t) => t.done).length;
    return {
      list: l,
      total: own.length,
      done: doneCount,
      pct: own.length ? Math.round((doneCount / own.length) * 100) : 0,
      project: l.projectId ? projectById.get(l.projectId) ?? null : null,
      trip: l.tripId ? tripById.get(l.tripId) ?? null : null,
    };
  });

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.id === id)?.name ?? null : null;

  const enriched = tasks.map((t) => ({
    ...t,
    ownerName: nameOf(t.ownerId),
  }));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader
        title="Teendők"
        subtitle="Amit el kell intézni"
        back="/"
        action={
          <Link
            href="/beallitasok"
            aria-label="Célok és projektek"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Link>
        }
      />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button href="/teendok/uj" size="lg" leftIcon={<Plus className="w-4 h-4" />}>
          Új
        </Button>
        <Button
          href="/teendok/gyors"
          size="lg"
          variant="secondary"
          leftIcon={<Table2 className="w-4 h-4" />}
        >
          Gyors táblázat
        </Button>
      </div>

      {/* Listák: projekthez / utazáshoz kötött teendő-csomagok */}
      <section className="mt-7">
        <div className="mb-2 flex items-center justify-between px-1">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em]">
            Listák
          </h2>
          <Link
            href="/teendok/listak/uj"
            className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-primary)]"
          >
            <Plus className="w-4 h-4" /> Új lista
          </Link>
        </div>

        {listCards.length === 0 ? (
          <Link
            href="/teendok/listak/uj"
            className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4 text-left transition hover:border-[var(--color-primary)]/50"
          >
            <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <ListChecks className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold">Teendő-lista létrehozása</p>
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Egy csomag teendő projekthez, utazáshoz — vagy önállóan
              </p>
            </div>
            <ChevronRight className="w-5 h-5 text-[var(--color-muted-foreground)] shrink-0" />
          </Link>
        ) : (
          <div className="grid gap-2.5 md:grid-cols-2">
            {listCards.map(({ list, total, done, pct, project, trip }) => {
              const col = catColor(list.color);
              return (
                <Link
                  key={list.id}
                  href={`/teendok/listak/${list.id}`}
                  className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3.5 shadow-sm transition hover:border-[var(--color-primary)]/40 hover:shadow-md active:scale-[0.99]"
                >
                  <div className="flex items-start gap-2.5">
                    <span className={cn("mt-1 w-2.5 h-2.5 rounded-full shrink-0", col.dot)} />
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-[15px] leading-tight truncate">
                        {list.name}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                        {trip && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--color-primary-soft)] px-2 py-0.5 font-medium text-[var(--color-primary)]">
                            <Plane className="w-3 h-3" /> {trip.name}
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
                        <span className="text-[var(--color-muted-foreground)] tabular-nums">
                          {done}/{total} kész
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2.5 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                    <div className={cn("h-full rounded-full", col.dot)} style={{ width: `${pct}%` }} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {tasks.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ListChecks}
            title="Nincs teendő"
            description="Vegyél fel egy teendőt határidővel, alteendőkkel, akár képpel vagy fájllal — és lásd, mi van mára és mi jár le hamarosan."
            action={
              <Button href="/teendok/uj" leftIcon={<Plus className="w-4 h-4" />}>
                Első teendő
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
        />
      )}
    </main>
  );
}
