import { requireUser } from "@/lib/auth";
import { listShoppingLists } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

export default async function BevasarlasPage() {
  const me = await requireUser();
  const lists = await listShoppingLists(me.householdId);

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title="Bevásárlás" />
      <div className="mt-4">
        <Link
          href="/bevasarlas/uj"
          className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-3 py-2 text-sm font-medium"
        >
          + Új lista
        </Link>
      </div>

      {lists.length === 0 && (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Még nincs bevásárlólistád. Készíts egyet receptekből!
        </p>
      )}

      <ul className="mt-6 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
        {lists.map((l) => {
          const toBuy = l.items.filter((it) => it.need > 0);
          const boughtCount = toBuy.filter((it) => it.checked).length;
          const done = toBuy.length > 0 && boughtCount === toBuy.length;
          return (
            <li key={l.id}>
              <Link
                href={`/bevasarlas/${l.id}`}
                className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
              >
                <div>
                  <div className="font-medium flex items-center gap-2">
                    <span>{l.name}</span>
                    {done && (
                      <span className="text-xs px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                        kész
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-zinc-500 mt-0.5">
                    {toBuy.length === 0
                      ? `${l.items.length} tétel · nincs mit venni`
                      : `${boughtCount}/${toBuy.length} bevásárolva · ${l.items.length} tétel`}
                  </div>
                </div>
                <span className="text-zinc-400">›</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </main>
  );
}
