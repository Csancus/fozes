import { requireUser } from "@/lib/auth";
import { listPurchases } from "@/lib/data";
import { redis, key, slug as toSlug } from "@/lib/redis";
import { PageHeader } from "@/components/PageHeader";
import type { Unit } from "@/lib/types";

type PriceEntry = {
  price: number;
  qty: number;
  unit: Unit;
  ts: number;
};

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

function fmtUnitPrice(n: number): string {
  const rounded = Math.round(n * 100) / 100;
  return new Intl.NumberFormat("hu-HU", {
    maximumFractionDigits: 2,
  }).format(rounded);
}

function parseEntry(raw: unknown): PriceEntry | null {
  let obj: unknown = raw;
  if (typeof raw === "string") {
    try {
      obj = JSON.parse(raw);
    } catch {
      return null;
    }
  }
  if (!obj || typeof obj !== "object") return null;
  const o = obj as Record<string, unknown>;
  if (
    typeof o.price !== "number" ||
    typeof o.qty !== "number" ||
    typeof o.unit !== "string" ||
    typeof o.ts !== "number"
  ) {
    return null;
  }
  return {
    price: o.price,
    qty: o.qty,
    unit: o.unit as Unit,
    ts: o.ts,
  };
}

export default async function ItemHistoryPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const me = await requireUser();
  const { slug } = await params;

  const raw = await redis.lrange(key.priceHistory(me.householdId, slug), 0, -1);
  const entries: PriceEntry[] = (raw as unknown[])
    .map(parseEntry)
    .filter((e): e is PriceEntry => e !== null)
    .sort((a, b) => a.ts - b.ts);

  // Find item name from most recent purchase line matching this slug
  const purchases = await listPurchases(me.householdId);
  let displayName = slug;
  let bestTs = -Infinity;
  for (const p of purchases) {
    for (const line of p.lines) {
      if (toSlug(line.name) === slug && p.purchasedAt > bestTs) {
        bestTs = p.purchasedAt;
        displayName = line.name;
      }
    }
  }

  const unitPrices = entries
    .filter((e) => e.qty > 0)
    .map((e) => ({ ts: e.ts, up: e.price / e.qty, unit: e.unit }));

  const avgUnitPrice =
    unitPrices.length > 0
      ? unitPrices.reduce((s, e) => s + e.up, 0) / unitPrices.length
      : 0;

  const latest = entries.length > 0 ? entries[entries.length - 1] : null;
  const latestUnit = latest?.unit ?? "";

  // SVG chart geometry
  const chartW = 600;
  const chartH = 200;
  const padX = 24;
  const padY = 16;
  const innerW = chartW - padX * 2;
  const innerH = chartH - padY * 2;

  let pathD = "";
  let points: { x: number; y: number; up: number; ts: number }[] = [];
  if (unitPrices.length > 0) {
    const minTs = unitPrices[0].ts;
    const maxTs = unitPrices[unitPrices.length - 1].ts;
    const tsRange = Math.max(1, maxTs - minTs);
    const minUp = Math.min(...unitPrices.map((e) => e.up));
    const maxUp = Math.max(...unitPrices.map((e) => e.up));
    const upRange = Math.max(0.0001, maxUp - minUp);

    points = unitPrices.map((e) => {
      const x =
        unitPrices.length === 1
          ? padX + innerW / 2
          : padX + ((e.ts - minTs) / tsRange) * innerW;
      const y = padY + innerH - ((e.up - minUp) / upRange) * innerH;
      return { x, y, up: e.up, ts: e.ts };
    });

    pathD = points
      .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x.toFixed(1)} ${p.y.toFixed(1)}`)
      .join(" ");
  }

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title={displayName} back="/statisztika" />

      {entries.length === 0 ? (
        <p className="mt-8 text-center text-sm text-zinc-500">
          Nincs ártörténet ehhez a termékhez.
        </p>
      ) : (
        <>
          <section className="mt-6 grid grid-cols-2 gap-3">
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500 mb-1">Aktuális átlagár</div>
              <div className="font-semibold">
                {fmtUnitPrice(avgUnitPrice)} Ft
                {latestUnit && (
                  <span className="text-zinc-500 font-normal">/{latestUnit}</span>
                )}
              </div>
            </div>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4">
              <div className="text-xs text-zinc-500 mb-1">Legutóbbi ár</div>
              <div className="font-semibold">
                {latest ? fmtFt(latest.price) : "-"}
              </div>
              {latest && (
                <div className="text-xs text-zinc-500 mt-0.5">
                  {latest.qty} {latest.unit} • {fmtDate(latest.ts)}
                </div>
              )}
            </div>
          </section>

          <section className="mt-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
            <div className="text-xs text-zinc-500 mb-2 px-1">
              Egységár változás
            </div>
            <svg
              viewBox={`0 0 ${chartW} ${chartH}`}
              className="w-full h-[200px]"
              preserveAspectRatio="none"
            >
              <rect
                x={0}
                y={0}
                width={chartW}
                height={chartH}
                fill="transparent"
              />
              {points.length > 1 && (
                <path
                  d={pathD}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={2}
                  className="text-zinc-800 dark:text-zinc-200"
                />
              )}
              {points.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={3}
                  className="fill-zinc-800 dark:fill-zinc-200"
                />
              ))}
            </svg>
          </section>

          <section className="mt-6">
            <h2 className="text-sm font-semibold text-zinc-600 dark:text-zinc-400 mb-2">
              Ártörténet
            </h2>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-zinc-50 dark:bg-zinc-800/50 text-xs text-zinc-500">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium">Dátum</th>
                    <th className="text-right px-3 py-2 font-medium">Ár</th>
                    <th className="text-right px-3 py-2 font-medium">Menny.</th>
                    <th className="text-right px-3 py-2 font-medium">Egység</th>
                    <th className="text-right px-3 py-2 font-medium">
                      Egységár
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                  {[...entries].reverse().map((e, i) => {
                    const up = e.qty > 0 ? e.price / e.qty : 0;
                    return (
                      <tr key={i}>
                        <td className="px-3 py-2">{fmtDate(e.ts)}</td>
                        <td className="px-3 py-2 text-right">
                          {fmtFt(e.price)}
                        </td>
                        <td className="px-3 py-2 text-right">{e.qty}</td>
                        <td className="px-3 py-2 text-right text-zinc-500">
                          {e.unit}
                        </td>
                        <td className="px-3 py-2 text-right">
                          {fmtUnitPrice(up)} Ft/{e.unit}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>
        </>
      )}
    </main>
  );
}
