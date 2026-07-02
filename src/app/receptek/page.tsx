import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

export default async function ReceptekPage() {
  const me = await requireUser();
  const recipes = await listRecipes(me.householdId);

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title="Receptek" />
      <div className="mt-4">
        <Link href="/receptek/uj" className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-3 py-2 text-sm font-medium">
          + Új recept
        </Link>
      </div>

      {recipes.length === 0 && (
        <p className="mt-8 text-center text-sm text-zinc-500">Még nincs recepted.</p>
      )}

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {recipes.map((r) => (
          <li key={r.id}>
            <Link
              href={`/receptek/${r.id}`}
              className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
            >
              <div>
                <div className="font-medium">{r.name}</div>
                <div className="text-xs text-zinc-500 mt-0.5">
                  {r.servings} adag · {r.ingredients.length} hozzávaló
                  {r.caloriesPerServing != null && (
                    <> · {r.caloriesPerServing} kcal/adag</>
                  )}
                  {r.proteinPerServing != null && (
                    <> · {r.proteinPerServing} g fehérje</>
                  )}
                </div>
              </div>
              <span className="text-zinc-400">›</span>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
