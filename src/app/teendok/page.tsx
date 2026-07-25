import { requireUser } from "@/lib/auth";
import { listTasks, listHouseholdMembers } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { ListChecks, Plus } from "lucide-react";
import { TaskListClient } from "./TaskListClient";
import { toggleTaskDoneAction } from "./actions";

export default async function TeendokPage() {
  const me = await requireUser();
  const [tasks, members] = await Promise.all([
    listTasks(me.householdId),
    listHouseholdMembers(me.householdId),
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
          <Button href="/teendok/uj" size="sm" leftIcon={<Plus className="w-4 h-4" />}>
            Új
          </Button>
        }
      />

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
          myId={me.userId}
          toggleDoneAction={toggleTaskDoneAction}
        />
      )}
    </main>
  );
}
