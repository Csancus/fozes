import { requireUser } from "@/lib/auth";
import { listHouseholdMembers, listProjects, listTaskLists } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { BatchTaskEntry } from "./BatchTaskEntry";
import { saveTasksBatchAction } from "../actions";

export default async function GyorsTaskPage({
  searchParams,
}: {
  searchParams: Promise<{ lista?: string }>;
}) {
  const { lista } = await searchParams;
  const me = await requireUser();
  const [members, projects, lists] = await Promise.all([
    listHouseholdMembers(me.householdId),
    listProjects(me.householdId),
    listTaskLists(me.householdId),
  ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Gyors teendő felvitel"
        subtitle="Több teendő egyszerre, táblázatos formában"
        back={lista ? `/teendok/listak/${lista}` : "/teendok"}
      />
      <BatchTaskEntry
        action={saveTasksBatchAction}
        members={members}
        projects={projects}
        lists={lists}
        defaultListId={lista}
      />
    </main>
  );
}
