import { requireUser } from "@/lib/auth";
import { listProjects, listTrips, listTaskTags } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TaskListForm } from "../TaskListForm";
import { createTaskListAction } from "../../actions";

export default async function NewTaskListPage({
  searchParams,
}: {
  searchParams: Promise<{ projekt?: string; utazas?: string }>;
}) {
  const { projekt, utazas } = await searchParams;
  const me = await requireUser();
  const [projects, trips, tags] = await Promise.all([
    listProjects(me.householdId),
    listTrips(me.householdId),
    listTaskTags(me.householdId),
  ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Új teendő-lista"
        subtitle="Összetartozó teendők egy projekthez vagy utazáshoz"
        back={utazas ? `/utazasok/${utazas}` : "/teendok"}
      />
      <Card className="mt-6 p-5">
        <TaskListForm
          action={createTaskListAction}
          projects={projects}
          trips={trips}
          tagSuggestions={tags.map((t) => t.name)}
          defaultProjectId={projekt}
          defaultTripId={utazas}
        />
      </Card>
    </main>
  );
}
