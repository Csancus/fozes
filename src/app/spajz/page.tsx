import { requireUser } from "@/lib/auth";
import { listPantry, listLocations, ensureDefaultLocations } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { fmt } from "@/lib/units";
import Link from "next/link";

function daysUntil(ts: number | null): number | null {
  if (!ts) return null;
  return Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryBadge(ts: number | null) {
  const d = daysUntil(ts);
  if (d === null) return null;
  if (d < 0)
    return <span className="text-xs text-red-600 font-medium">Lejárt {-d} napja</span>;
  if (d === 0) return <span className="text-xs text-red-600 font-medium">Ma jár le</span>;
  if (d <= 3) return <span className="text-xs text-amber-600">Lejár {d} nap múlva</span>;
  return <span className="text-xs text-zinc-500">Lejár {d} nap múlva</span>;
}

export default async function SpajzPage() {
  const me = await requireUser();
  await ensureDefaultLocations(me.householdId);
  const [items, locations] = await Promise.all([
    listPantry(me.householdId),
    listLocations(me.householdId),
  ]);
  const locById = new Map(locations.map((l) => [l.id, l]));

  const grouped = new Map<string, typeof items>();
  for (const l of locations) grouped.set(l.id, []);
  for (const it of items) {
    if (!grouped.has(it.locationId)) grouped.set(it.locationId, []);
    grouped.get(it.locationId)!.push(it);
  }

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title="Spájz" />
      <div className="mt-4 flex gap-2 flex-wrap">
        <Link href="/spajz/uj" className="rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 px-3 py-2 text-sm font-medium">
          + Új tétel
        </Link>
        <Link href="/helyek" className="rounded-lg border border-zinc-300 dark:border-zinc-700 px-3 py-2 text-sm">
          Helyek kezelése
        </Link>
      </div>

      {items.length === 0 && (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Még nincs semmi a spájzban. Adj hozzá tételt!
        </p>
      )}

      <div className="mt-6 space-y-6">
        {locations.map((l) => {
          const list = grouped.get(l.id) ?? [];
          if (list.length === 0) return null;
          return (
            <section key={l.id}>
              <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
                {l.name}
              </h2>
              <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                {list.map((it) => (
                  <li key={it.id}>
                    <Link
                      href={`/spajz/${it.id}`}
                      className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                    >
                      <div>
                        <div className="font-medium">{it.name}</div>
                        <div className="text-xs text-zinc-500 mt-0.5 flex gap-2">
                          <span>{fmt(it.qty, it.unit)}</span>
                          {expiryBadge(it.expiresAt)}
                        </div>
                      </div>
                      <span className="text-zinc-400">›</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })}

        {(() => {
          const orphans = items.filter((it) => !locById.has(it.locationId));
          if (orphans.length === 0) return null;
          return (
            <section>
              <h2 className="text-sm font-semibold text-zinc-500">Törölt helyen</h2>
              <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                {orphans.map((it) => (
                  <li key={it.id}>
                    <Link href={`/spajz/${it.id}`} className="block px-4 py-3">
                      <div className="font-medium">{it.name}</div>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          );
        })()}
      </div>
    </main>
  );
}
