import { requireUser } from "@/lib/auth";
import { listPurchases } from "@/lib/data";
import { slug } from "@/lib/redis";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { LinkCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { BarChart3, ChevronRight, Receipt } from "lucide-react";

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

  const recent = purchases.slice(0, 5);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader title="Statisztika" back="/fozes" />

      {purchases.length === 0 ? (
        <EmptyState
          icon={BarChart3}
          title="Nincs statisztika még"
          description="Vidd fel az első vásárlást."
        />
      ) : (
        <div className="mt-5 space-y-8 animate-fade-up">
          <Section title="Havi költés">
            <ul className="space-y-2">
              {monthly.map(([ym, total]) => {
                const pct = monthlyMax > 0 ? (total / monthlyMax) * 100 : 0;
                return (
                  <li key={ym}>
                    <Card>
                      <div className="p-4">
                        <div className="flex items-center justify-between text-sm mb-2">
                          <span className="font-medium">{fmtMonth(ym)}</span>
                          <span className="tabular-nums font-mono font-semibold">{fmtFt(total)}</span>
                        </div>
                        <div className="h-2 rounded-full bg-[var(--color-primary-soft)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-primary)] transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          </Section>

          {top10.length > 0 && (
            <Section title="Top termékek">
              <ul className="space-y-2">
                {top10.map((t, i) => (
                  <li key={t.slug}>
                    <LinkCard href={`/statisztika/${t.slug}`} className="flex items-center gap-3 px-4 py-3">
                      <Badge tone="muted" className="tabular-nums w-8 justify-center">
                        {i + 1}
                      </Badge>
                      <p className="font-medium truncate flex-1">{t.name}</p>
                      <span className="tabular-nums font-mono font-semibold text-[14px] shrink-0">
                        {fmtFt(t.total)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                    </LinkCard>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {recent.length > 0 && (
            <Section title="Legutóbbi vásárlások">
              <ul className="space-y-2">
                {recent.map((p) => (
                  <li key={p.id}>
                    <LinkCard href={`/vasarlas/${p.id}`} className="flex items-center gap-3.5 p-4">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <Receipt className="w-4.5 h-4.5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-[15px] truncate">{p.store}</p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                          {fmtDate(p.purchasedAt)}
                        </p>
                      </div>
                      <span className="tabular-nums font-mono font-semibold text-[14px] shrink-0">
                        {fmtFt(p.total)}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                    </LinkCard>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </main>
  );
}
