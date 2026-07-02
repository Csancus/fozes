import { requireUser } from "@/lib/auth";
import { listPurchases } from "@/lib/data";
import { slug } from "@/lib/redis";
import { PageHeader } from "@/components/PageHeader";
import Link from "next/link";

function fmtDate(ts: number): string {
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}.${mm}.${dd}`;
}

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

const HU_MONTHS = [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december",
];

function fmtMonth(yyyymm: string): string {
  const [y, m] = yyyymm.split("-");
  return `${y}. ${HU_MONTHS[parseInt(m, 10) - 1]}`;
}

export default async function StatisztikaPage() {
  const me = await requireUser();
  const purchases = await listPurchases(me.householdId);

  // Havi összesítés
  const monthlyMap = new Map<string, number>();
  for (const p of purchases) {
    const d = new Date(p.purchasedAt);
    const ym = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyMap.set(ym, (monthlyMap.get(ym) ?? 0) + p.total);
  }
  const monthly = Array.from(monthlyMap.entries())
    .sort((a, b) => (a[0] < b[0] ? 1 : -1))
    .slice(0, 6);
  const monthlyMax = monthly.reduce((m, [, v]) => Math.max(m, v), 0);

  // Top 10 termékek
  type TopEntry = { slug: string; name: string; total: number; lastTs: number };
  const topMap = new Map<string, TopEntry>();
  for (const p of purchases) {
    for (const line of p.lines) {
      const s = slug(line.name);
      if (!s) continue;
      const cur = topMap.get(s);
      if (cur) {
        cur.total += line.total;
        if (p.purchasedAt > cur.lastTs) {
          cur.lastTs = p.purchasedAt;
          cur.name = line.name;
        }
      } else {
        topMap.set(s, {
          slug: s,
          name: line.name,
          total: line.total,
          lastTs: p.purchasedAt,
        });
      }
    }
  }
  const top10 = Array.from(topMap.values())
    .sort((a, b) => b.total - a.total)
    .slice(0, 10);

  // Legutóbbi 5 vásárlás
  const recent = purchases.slice(0, 5);

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title="Statisztika" />

      <section className="mt-6">
        <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
          Havi összesített költés
        </h2>
        {monthly.length === 0 ? (
          <p className="text-sm text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            Még nincs adat.
          </p>
        ) : (
          <ul className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
            {monthly.map(([ym, total]) => {
              const pct = monthlyMax > 0 ? (total / monthlyMax) * 100 : 0;
              return (
                <li key={ym} className="px-4 py-3">
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-medium">{fmtMonth(ym)}</span>
                    <span className="text-zinc-700 dark:text-zinc-300">
                      {fmtFt(total)}
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-zinc-100 dark:bg-zinc-800 overflow-hidden">
                    <div
                      className="h-full bg-zinc-800 dark:bg-zinc-200"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
          Top 10 termék által elköltött összeg
        </h2>
        {top10.length === 0 ? (
          <p className="text-sm text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            Még nincs tétel.
          </p>
        ) : (
          <ul className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
            {top10.map((t, i) => (
              <li key={t.slug}>
                <Link
                  href={`/statisztika/${t.slug}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="min-w-0 flex items-center gap-3">
                    <span className="text-xs text-zinc-400 w-5 shrink-0">
                      {i + 1}.
                    </span>
                    <span className="font-medium truncate">{t.name}</span>
                  </div>
                  <div className="text-right shrink-0 pl-3">
                    <div className="font-semibold text-sm">
                      {fmtFt(t.total)}
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="mt-8">
        <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
          Legutóbbi vásárlások
        </h2>
        {recent.length === 0 ? (
          <p className="text-sm text-zinc-500 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
            Még nincs vásárlás.
          </p>
        ) : (
          <ul className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 divide-y divide-zinc-200 dark:divide-zinc-800">
            {recent.map((p) => (
              <li key={p.id}>
                <Link
                  href={`/vasarlas/${p.id}`}
                  className="flex items-center justify-between px-4 py-3 hover:bg-zinc-50 dark:hover:bg-zinc-800/50"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.store}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">
                      {fmtDate(p.purchasedAt)}
                    </div>
                  </div>
                  <div className="text-right shrink-0 pl-3 font-semibold text-sm">
                    {fmtFt(p.total)}
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
