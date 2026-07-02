import { requireUser } from "@/lib/auth";
import { getCatalogItem } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { notFound } from "next/navigation";
import { CatalogForm } from "../CatalogForm";
import { deleteCatalogAction } from "../actions";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";

export default async function EditKatalogusPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const item = await getCatalogItem(me.householdId, id);
  if (!item) notFound();

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader title={item.name} back="/katalogus" />
      <div className="mt-5">
        <CatalogForm initial={item} />
      </div>
      <form action={deleteCatalogAction} className="mt-6">
        <input type="hidden" name="id" value={item.id} />
        <Button
          type="submit"
          variant="danger"
          size="sm"
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Törlés
        </Button>
      </form>
    </main>
  );
}
