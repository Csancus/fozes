import { requireUser } from "@/lib/auth";
import {
  listHouseholdMembers,
  listProjects,
  listTaskLists,
  listTrips,
  listTaskTags,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TaskForm } from "../TaskForm";
import { saveTaskAction } from "../actions";

export default async function NewTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ lista?: string }>;
}) {
  const { lista } = await searchParams;
  const me = await requireUser();
  const [members, projects, lists, trips, tags] = await Promise.all([
    listHouseholdMembers(me.householdId),
    listProjects(me.householdId),
    listTaskLists(me.householdId),
    listTrips(me.householdId),
    listTaskTags(me.householdId),
  ]);
  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Új teendő"
        back={lista ? `/teendok/listak/${lista}` : "/teendok"}
      />
      <Card className="mt-6 p-5">
        <TaskForm
          action={saveTaskAction}
          members={members}
          projects={projects}
          lists={lists}
          trips={trips}
          tagSuggestions={tags.map((t) => t.name)}
          defaultListId={lista}
          myId={me.userId}
        />
      </Card>
    </main>
  );
}
