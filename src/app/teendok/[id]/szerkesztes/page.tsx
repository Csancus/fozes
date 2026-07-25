import { requireUser } from "@/lib/auth";
import { getTask, listHouseholdMembers, listTaskProjects } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TaskForm } from "../../TaskForm";
import { saveTaskAction } from "../../actions";

export default async function EditTaskPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const [task, members, projects] = await Promise.all([
    getTask(me.householdId, id),
    listHouseholdMembers(me.householdId),
    listTaskProjects(me.householdId),
  ]);
  if (!task) notFound();

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Teendő szerkesztése" back={`/teendok/${id}`} />
      <Card className="mt-6 p-5">
        <TaskForm
          action={saveTaskAction}
          initial={task}
          members={members}
          projects={projects}
          myId={me.userId}
        />
      </Card>
    </main>
  );
}
