import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";
import { createShoppingListAction } from "../actions";

export default async function UjBevasarlasPage() {
  const me = await requireUser();
  const recipes = await listRecipes(me.householdId);

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title="Új bevásárlólista" back="/bevasarlas" />

      {recipes.length === 0 && (
        <div className="mt-8 text-center">
          <p className="text-sm text-zinc-500">
            Nincsen egyetlen recept sem. Előbb hozz létre receptet.
          </p>
          <Link
            href="/receptek/uj"
            className="mt-4 inline-block rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-3 py-2 text-sm font-medium"
          >
            + Új recept
          </Link>
        </div>
      )}

      {recipes.length > 0 && (
        <form action={createShoppingListAction} className="mt-6 space-y-6">
          <div>
            <label className="text-sm text-zinc-500">Név</label>
            <input
              type="text"
              name="name"
              placeholder="Bevásárlás (dátum)"
              className="mt-1 w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <div className="text-sm text-zinc-500 mb-2">Válassz recepteket</div>
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
              {recipes.map((r) => (
                <li key={r.id}>
                  <label className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-800/50">
                    <input
                      type="checkbox"
                      name="recipeIds"
                      value={r.id}
                      className="h-5 w-5 accent-zinc-900 dark:accent-zinc-50"
                    />
                    <div className="flex-1">
                      <div className="font-medium">{r.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {r.servings} adag · {r.ingredients.length} hozzávaló
                      </div>
                    </div>
                  </label>
                </li>
              ))}
            </ul>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-4 py-2 text-sm font-medium"
            >
              Lista létrehozása
            </button>
            <Link
              href="/bevasarlas"
              className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-4 py-2 text-sm"
            >
              Mégse
            </Link>
          </div>
        </form>
      )}
    </main>
  );
}
