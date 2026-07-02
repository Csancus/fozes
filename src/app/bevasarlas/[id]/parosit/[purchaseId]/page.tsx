import { requireUser } from "@/lib/auth";
import {
  getShoppingList,
  getPurchase,
  listLocations,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { notFound } from "next/navigation";
import { slug } from "@/lib/redis";
import { MatchForm } from "./MatchForm";

function scoreMatch(a: string, b: string): number {
  if (!a || !b) return 0;
  if (a === b) return 100;
  if (a.includes(b) || b.includes(a)) return 50;
  return 0;
}

export default async function MatchPurchasePage({
  params,
}: {
  params: Promise<{ id: string; purchaseId: string }>;
}) {
  const me = await requireUser();
  const { id, purchaseId } = await params;
  const [list, purchase, locations] = await Promise.all([
    getShoppingList(me.householdId, id),
    getPurchase(me.householdId, purchaseId),
    listLocations(me.householdId),
  ]);
  if (!list || !purchase) notFound();

  const itemSlugs = list.items.map((it) => slug(it.name));
  const suggestedMatches: (number | null)[] = purchase.lines.map((line) => {
    const lineSlug = slug(line.name);
    let bestIdx: number | null = null;
    let bestScore = 0;
    for (let i = 0; i < itemSlugs.length; i++) {
      const s = scoreMatch(lineSlug, itemSlugs[i]);
      if (s > bestScore) {
        bestScore = s;
        bestIdx = i;
      }
    }
    return bestScore > 0 ? bestIdx : null;
  });

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Számla párosítása"
        subtitle={`${purchase.lines.length} tétel · ${list.name}`}
        back={`/bevasarlas/${list.id}`}
      />
      <div className="mt-5 animate-fade-up">
        <p className="text-sm text-[var(--color-muted-foreground)] mb-5">
          Kösd össze a blokk tételeit a listaelemekkel. Az egyezőket
          kipipáljuk, opcionálisan a spájzba is berakhatod.
        </p>
        <MatchForm
          list={list}
          purchase={purchase}
          locations={locations}
          suggestedMatches={suggestedMatches}
        />
      </div>
    </main>
  );
}
