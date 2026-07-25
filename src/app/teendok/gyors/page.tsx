import { requireUser } from "@/lib/auth";
import { listHouseholdMembers, listTaskProjects } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { BatchTaskEntry } from "./BatchTaskEntry";
import { saveTasksBatchAction } from "../actions";

export default async function GyorsTaskPage() {
  const me = await requireUser();
  const [members, projects] = await Promise.all([
    listHouseholdMembers(me.householdId),
    listTaskProjects(me.householdId),
  ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Gyors teendő felvitel"
        subtitle="Több teendő egyszerre, táblázatos formában"
        back="/teendok"
      />
      <BatchTaskEntry
        action={saveTasksBatchAction}
        members={members}
        projects={projects}
      />
    </main>
  );
}
