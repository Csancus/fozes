import { currentUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { logout } from "./belepes/actions";
import { seedExampleDataAction } from "./actions";
import { redis, key } from "@/lib/redis";
import { listRecipes, listPantry, listPurchases } from "@/lib/data";
import type { Household } from "@/lib/types";

export default async function Home() {
  const me = await currentUser();
  if (!me) redirect("/belepes");

  const [hh, recipes, pantryItems, purchases] = await Promise.all([
    redis.get<Household>(key.household(me.householdId)),
    listRecipes(me.householdId),
    listPantry(me.householdId),
    listPurchases(me.householdId),
  ]);
  const isEmpty =
    recipes.length === 0 &&
    pantryItems.length === 0 &&
    purchases.length === 0;

  return (
    <main className="min-h-dvh flex flex-col px-5 py-8 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Főzés</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            {me.name} — {hh?.name ?? "háztartás"}
          </p>
        </div>
        <form action={logout}>
          <button className="text-xs text-zinc-500 underline">Kilépés</button>
        </form>
      </header>

      <section className="mt-8 grid grid-cols-2 gap-3">
        <Card title="Receptek" desc="Kedvenc receptek" href="/receptek" />
        <Card title="Spájz" desc="Mi van itthon" href="/spajz" />
        <Card title="Bevásárlás" desc="Mit kell venni" href="/bevasarlas" />
        <Card title="Vásárlás" desc="Blokk + árak" href="/vasarlas" />
        <div className="col-span-2">
          <Card
            title="Statisztika"
            desc="Költések + ártörténet"
            href="/statisztika"
          />
        </div>
      </section>

      {isEmpty && (
        <section className="mt-6">
          <form action={seedExampleDataAction}>
            <button
              type="submit"
              className="w-full rounded-xl border border-orange-300 dark:border-orange-600 bg-orange-50 dark:bg-orange-950/40 p-4 text-left hover:bg-orange-100 dark:hover:bg-orange-950/60 transition"
            >
              <div className="font-semibold text-orange-800 dark:text-orange-200">
                Példa adatok betöltése
              </div>
              <div className="text-xs text-orange-700/80 dark:text-orange-300/80 mt-1">
                2 recept (babgulyás + almás pite), 5 spájz tétel, 1 vásárlási
                blokk (7 sor) és 1 bevásárlólista. Minden törölhető később.
              </div>
            </button>
          </form>
        </section>
      )}

      <section className="mt-6">
        <a
          href="/csalad"
          className="block rounded-xl border border-dashed border-zinc-300 dark:border-zinc-700 p-4 text-sm text-zinc-600 dark:text-zinc-400 hover:border-zinc-500"
        >
          Család / meghívó → hívj meg másokat a háztartásba
        </a>
      </section>
    </main>
  );
}

function Card({ title, desc, href }: { title: string; desc: string; href: string }) {
  return (
    <a
      href={href}
      className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 hover:border-zinc-400 dark:hover:border-zinc-600 transition"
    >
      <div className="font-semibold">{title}</div>
      <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">{desc}</div>
    </a>
  );
}
