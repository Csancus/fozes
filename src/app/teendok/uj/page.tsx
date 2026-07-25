import { requireUser } from "@/lib/auth";
import { listHouseholdMembers, listProjects } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TaskForm } from "../TaskForm";
import { saveTaskAction } from "../actions";

export default async function NewTaskPage() {
  const me = await requireUser();
  const [members, projects] = await Promise.all([
    listHouseholdMembers(me.householdId),
    listProjects(me.householdId),
  ]);
  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Új teendő" back="/teendok" />
      <Card className="mt-6 p-5">
        <TaskForm
          action={saveTaskAction}
          members={members}
          projects={projects}
          myId={me.userId}
        />
      </Card>
    </main>
  );
}
