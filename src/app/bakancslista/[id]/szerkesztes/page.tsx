import { requireUser } from "@/lib/auth";
import { getSavedItem } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SavedForm } from "../../SavedForm";
import { saveSavedAction } from "../../actions";

export default async function EditSavedPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const item = await getSavedItem(me.householdId, id);
  if (!item) notFound();

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Szerkesztés" back={`/bakancslista/${id}`} />
      <Card className="mt-6 p-5">
        <SavedForm action={saveSavedAction} initial={item} />
      </Card>
    </main>
  );
}
