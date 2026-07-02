import { requireUser } from "@/lib/auth";
import { getPantryItem, listLocations } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { notFound } from "next/navigation";
import { PantryForm } from "../PantryForm";
import { savePantryAction, deletePantryAction } from "../actions";

export default async function EditPantryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const [item, locations] = await Promise.all([
    getPantryItem(me.householdId, id),
    listLocations(me.householdId),
  ]);
  if (!item) notFound();

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <PageHeader title="Spájz tétel" back="/spajz" />
      <div className="mt-6">
        <PantryForm action={savePantryAction} locations={locations} initial={item} />
      </div>
      <form action={deletePantryAction} className="mt-6">
        <input type="hidden" name="id" value={item.id} />
        <button className="text-sm text-red-600 hover:underline">Törlés</button>
      </form>
    </main>
  );
}
