import { requireUser } from "@/lib/auth";
import { listPurchases } from "@/lib/data";
import { redis, key, slug as toSlug } from "@/lib/redis";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { TrendingUp } from "lucide-react";
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
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title={displayName} back="/statisztika" />

      {entries.length === 0 ? (
        <EmptyState
          icon={TrendingUp}
          title="Nincs ártörténet"
          description="Ehhez a termékhez még nincs rögzített ár."
        />
      ) : (
        <div className="mt-5 space-y-6 animate-fade-up">
          <section className="grid grid-cols-2 gap-3">
            <Card>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
                  Átlagár
                </div>
                <div className="text-lg font-bold tabular-nums font-mono">
                  {fmtUnitPrice(avgUnitPrice)}
                  <span className="text-sm font-normal text-[var(--color-muted-foreground)]">
                    {" "}
                    Ft{latestUnit && `/${latestUnit}`}
                  </span>
                </div>
              </div>
            </Card>
            <Card>
              <div className="p-4">
                <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] mb-1">
                  Legutóbbi ár
                </div>
                <div className="text-lg font-bold tabular-nums font-mono">
                  {latest ? fmtFt(latest.price) : "-"}
                </div>
                {latest && (
                  <div className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
                    {latest.qty} {latest.unit} · {fmtDate(latest.ts)}
                  </div>
                )}
              </div>
            </Card>
          </section>

          <Section title="Ártörténet">
            <Card>
              <div className="p-4">
                <svg
                  viewBox={`0 0 ${chartW} ${chartH}`}
                  className="w-full h-[200px]"
                  preserveAspectRatio="none"
                >
                  <rect x={0} y={0} width={chartW} height={chartH} fill="transparent" />
                  {points.length > 1 && (
                    <path
                      d={pathD}
                      fill="none"
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="stroke-[var(--color-primary)]"
                    />
                  )}
                  {points.map((p, i) => (
                    <circle
                      key={i}
                      cx={p.x}
                      cy={p.y}
                      r={3.5}
                      className="fill-[var(--color-primary)]"
                    />
                  ))}
                </svg>
              </div>
            </Card>
          </Section>

          <Section title="Táblázat">
            <Card>
              <div className="divide-y divide-[var(--color-border)]">
                <div className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2.5 text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] font-semibold">
                  <span>Dátum</span>
                  <span className="text-right">Ár</span>
                  <span className="text-right">Menny.</span>
                  <span className="text-right">Egységár</span>
                </div>
                {[...entries].reverse().map((e, i) => {
                  const up = e.qty > 0 ? e.price / e.qty : 0;
                  return (
                    <div
                      key={i}
                      className="grid grid-cols-[1fr_auto_auto_auto] gap-3 px-4 py-2.5 text-sm items-center"
                    >
                      <span className="text-[var(--color-muted-foreground)]">
                        {fmtDate(e.ts)}
                      </span>
                      <span className="text-right tabular-nums font-mono">{fmtFt(e.price)}</span>
                      <span className="text-right tabular-nums font-mono text-[var(--color-muted-foreground)]">
                        {e.qty} {e.unit}
                      </span>
                      <span className="text-right tabular-nums font-mono font-medium">
                        {fmtUnitPrice(up)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </Card>
          </Section>
        </div>
      )}
    </main>
  );
}
