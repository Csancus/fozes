import { requireUser } from "@/lib/auth";
import {
  listTasks,
  listHouseholdMembers,
  listProjects,
  listTaskLists,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  toggleTaskDoneAction,
  deleteTaskFromListAction,
  setTaskStatusAction,
  setTaskDueDateAction,
  reorderTasksAction,
} from "../actions";
import { BoardPageClient } from "./BoardPageClient";

export default async function TeendokBoardPage() {
  const me = await requireUser();
  const [tasks, members, projects, lists] = await Promise.all([
    listTasks(me.householdId),
    listHouseholdMembers(me.householdId),
    listProjects(me.householdId),
    listTaskLists(me.householdId),
  ]);

  const nameOf = (id: string | null) =>
    id ? members.find((m) => m.id === id)?.name ?? null : null;

  const enriched = tasks.map((t) => ({ ...t, ownerName: nameOf(t.ownerId) }));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader title="Board" subtitle="Minden teendő, státusz szerint" back="/teendok" />
      <BoardPageClient
        tasks={enriched}
        projects={projects}
        lists={lists}
        toggleDoneAction={toggleTaskDoneAction}
        deleteAction={deleteTaskFromListAction}
        statusAction={setTaskStatusAction}
        reorderAction={reorderTasksAction}
        dueDateAction={setTaskDueDateAction}
      />
    </main>
  );
}
