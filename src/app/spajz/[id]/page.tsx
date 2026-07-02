import { requireUser } from "@/lib/auth";
import { getPantryItem, listLocations, listCatalog } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { notFound } from "next/navigation";
import { Trash2 } from "lucide-react";
import { PantryForm } from "../PantryForm";
import { savePantryAction, deletePantryAction } from "../actions";

export default async function EditPantryPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const [item, locations, catalog] = await Promise.all([
    getPantryItem(me.householdId, id),
    listLocations(me.householdId),
    listCatalog(me.householdId),
  ]);
  if (!item) notFound();

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title={item.name} back="/spajz" />
      <div className="mt-6 animate-fade-up">
        <PantryForm
          action={savePantryAction}
          locations={locations}
          catalog={catalog}
          initial={item}
        />
        <form action={deletePantryAction} className="mt-4">
          <input type="hidden" name="id" value={item.id} />
          <Button
            type="submit"
            variant="ghost"
            size="sm"
            fullWidth
            className="text-red-600 hover:text-red-700"
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            Törlés
          </Button>
        </form>
      </div>
    </main>
  );
}
