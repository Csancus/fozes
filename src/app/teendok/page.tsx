import { requireUser } from "@/lib/auth";
import { listTasks, listHouseholdMembers, listProjects } from "@/lib/data";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ListChecks, Plus, Table2, SlidersHorizontal } from "lucide-react";
import { TaskListClient } from "./TaskListClient";
import { toggleTaskDoneAction, deleteTaskFromListAction } from "./actions";

export default async function TeendokPage() {
  const me = await requireUser();
  const [tasks, members, projects] = await Promise.all([
    listTasks(me.householdId),
    listHouseholdMembers(me.householdId),
    listProjects(me.householdId),
  ]);

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
            href="/teendok/beallitasok"
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
          myId={me.userId}
          toggleDoneAction={toggleTaskDoneAction}
          deleteAction={deleteTaskFromListAction}
        />
      )}
    </main>
  );
}
