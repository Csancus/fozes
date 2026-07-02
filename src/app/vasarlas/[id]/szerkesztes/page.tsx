import { requireUser } from "@/lib/auth";
import { getPurchase, listLocations, ensureDefaultLocations } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
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
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md mx-auto">
      <PageHeader title="Szerkesztés" back={`/vasarlas/${id}`} />
      <div className="mt-5 animate-fade-up">
        <EditPurchaseForm purchase={purchase} locations={locations} />
      </div>
    </main>
  );
}
