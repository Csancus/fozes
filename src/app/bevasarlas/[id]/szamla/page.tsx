import { requireUser } from "@/lib/auth";
import { getShoppingList, listLocations } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
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
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader
        title="Számla hozzáfűzése"
        back={`/bevasarlas/${list.id}`}
      />
      <p className="mt-3 text-sm text-zinc-600 dark:text-zinc-400">
        Illeszd be a blokk szövegét, tölts fel PDF-et, vagy fényképezd le a
        blokkot. A rendszer értelmezi a tételeket és felajánlja a listaelemek
        párosítását.
      </p>
      <div className="mt-4">
        <AttachReceiptForm list={list} locations={locations} />
      </div>
    </main>
  );
}
