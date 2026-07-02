import { requireUser } from "@/lib/auth";
import { getPurchase, listLocations, ensureDefaultLocations } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { notFound } from "next/navigation";
import { EditPurchaseForm } from "./EditPurchaseForm";

export default async function EditPurchasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  await ensureDefaultLocations(me.householdId);
  const [purchase, locations] = await Promise.all([
    getPurchase(me.householdId, id),
    listLocations(me.householdId),
  ]);
  if (!purchase) notFound();

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title="Vásárlás szerkesztése" back={`/vasarlas/${id}`} />
      <div className="mt-6">
        <EditPurchaseForm purchase={purchase} locations={locations} />
      </div>
    </main>
  );
}
