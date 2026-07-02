import { requireUser } from "@/lib/auth";
import { listLocations, ensureDefaultLocations } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { PantryForm } from "../PantryForm";
import { savePantryAction } from "../actions";

export default async function UjSpajzPage() {
  const me = await requireUser();
  await ensureDefaultLocations(me.householdId);
  const locations = await listLocations(me.householdId);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md mx-auto">
      <PageHeader title="Új tétel" back="/spajz" />
      <div className="mt-6 animate-fade-up">
        <PantryForm action={savePantryAction} locations={locations} />
      </div>
    </main>
  );
}
