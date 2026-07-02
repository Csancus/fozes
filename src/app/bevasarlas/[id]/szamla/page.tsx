import { requireUser } from "@/lib/auth";
import { getShoppingList, listLocations } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { notFound } from "next/navigation";
import { AttachReceiptForm } from "./AttachReceiptForm";

export default async function AttachReceiptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const [list, locations] = await Promise.all([
    getShoppingList(me.householdId, id),
    listLocations(me.householdId),
  ]);
  if (!list) notFound();

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md mx-auto">
      <PageHeader
        title="Számla hozzáfűzése"
        subtitle={list.name}
        back={`/bevasarlas/${list.id}`}
      />
      <div className="mt-5 animate-fade-up">
        <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
          Illeszd be a blokk szövegét, tölts fel PDF-et, vagy fényképezd le
          a blokkot. A rendszer értelmezi a tételeket és felajánlja a
          listaelemek párosítását.
        </p>
        <AttachReceiptForm list={list} locations={locations} />
      </div>
    </main>
  );
}
