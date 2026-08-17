import { requireUser } from "@/lib/auth";
import {
  getTaskList,
  listProjects,
  listTrips,
  listTasks,
  listTaskTags,
} from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { TaskListForm } from "../../TaskListForm";
import { updateTaskListAction, deleteTaskListAction } from "../../../actions";
import { DeleteTaskList } from "./DeleteTaskList";

export default async function EditTaskListPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const list = await getTaskList(me.householdId, id);
  if (!list) notFound();

  const [projects, trips, allTasks, tags] = await Promise.all([
    listProjects(me.householdId),
    listTrips(me.householdId),
    listTasks(me.householdId),
    listTaskTags(me.householdId),
  ]);
  const taskCount = allTasks.filter((t) => t.listId === id).length;

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Lista szerkesztése" back={`/teendok/listak/${id}`} />
      <Card className="mt-6 p-5">
        <TaskListForm
          action={updateTaskListAction}
          initial={list}
          projects={projects}
          trips={trips}
          tagSuggestions={tags.map((t) => t.name)}
        />
      </Card>

      <div className="mt-8">
        <DeleteTaskList
          id={id}
          name={list.name}
          taskCount={taskCount}
          deleteAction={deleteTaskListAction}
        />
      </div>
    </main>
  );
}
