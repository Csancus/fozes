import { requireUser } from "@/lib/auth";
import { listLocations, ensureDefaultLocations } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { PantryForm } from "../PantryForm";
import { savePantryAction } from "../actions";

export default async function UjSpajzPage() {
  const me = await requireUser();
  await ensureDefaultLocations(me.householdId);
  const locations = await listLocations(me.householdId);

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <PageHeader title="Új spájz tétel" back="/spajz" />
      <div className="mt-6">
        <PantryForm action={savePantryAction} locations={locations} />
      </div>
    </main>
  );
}
