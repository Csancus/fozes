import { requireUser } from "@/lib/auth";
import { listHouseholdMembers, listTaskProjects, listTaskLists } from "@/lib/data";
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
  const [members, projects, lists] = await Promise.all([
    listHouseholdMembers(me.householdId),
    listTaskProjects(me.householdId),
    listTaskLists(me.householdId),
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
          defaultListId={lista}
          myId={me.userId}
        />
      </Card>
    </main>
  );
}
