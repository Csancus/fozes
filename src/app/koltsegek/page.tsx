import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
} from "@/lib/data";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { catColor, catIcon } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { Wallet, Plus, SlidersHorizontal, ChevronRight } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/lib/types";

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

const monthKeyFmt = new Intl.DateTimeFormat("hu-HU", {
  year: "numeric",
  month: "long",
});
const dayFmt = new Intl.DateTimeFormat("hu-HU", {
  month: "short",
  day: "numeric",
});

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

export default async function KoltsegekPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  const [expenses, categories] = await Promise.all([
    listExpenses(me.householdId),
    listExpenseCategories(me.householdId),
  ]);

  const catById = new Map<string, ExpenseCategory>(
    categories.map((c) => [c.id, c])
  );

  const now = new Date();
  const thisMonthKey = `${now.getFullYear()}-${String(
    now.getMonth() + 1
  ).padStart(2, "0")}`;

  const thisMonth = expenses.filter((e) => monthKey(e.spentAt) === thisMonthKey);
  const thisMonthTotal = thisMonth.reduce((s, e) => s + e.amount, 0);

  // Aktuális havi kategória-bontás
  const byCat = new Map<string, number>();
  for (const e of thisMonth) {
    const k = e.categoryId ?? "__none";
    byCat.set(k, (byCat.get(k) ?? 0) + e.amount);
  }
  const breakdown = [...byCat.entries()]
    .map(([k, amount]) => ({ cat: k === "__none" ? null : catById.get(k) ?? null, amount }))
    .sort((a, b) => b.amount - a.amount);

  // Csoportosítás hónap szerint (a lista már spentAt szerint csökkenő)
  const groups: { key: string; label: string; items: Expense[]; total: number }[] = [];
  for (const e of expenses) {
    const k = monthKey(e.spentAt);
    let g = groups.find((x) => x.key === k);
    if (!g) {
      g = { key: k, label: monthKeyFmt.format(new Date(e.spentAt)), items: [], total: 0 };
      groups.push(g);
    }
    g.items.push(e);
    g.total += e.amount;
  }

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader
        title="Költségek"
        subtitle="Kiadások tételenként"
        back="/"
        action={
          <Link
            href="/koltsegek/kategoriak"
            aria-label="Kategóriák"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Link>
        }
      />

      {/* Havi összesítő */}
      <section className="mt-6 rounded-2xl brand-gradient text-white p-5 shadow-sm">
        <p className="text-xs/none opacity-80 uppercase tracking-wider">
          {monthKeyFmt.format(now)}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {fmtFt(thisMonthTotal)}
        </p>
        <p className="text-xs opacity-80 mt-1">
          {thisMonth.length} tétel ebben a hónapban
        </p>

        {breakdown.length > 0 && (
          <div className="mt-4 space-y-2">
            {breakdown.slice(0, 5).map(({ cat, amount }, i) => {
              const pct = thisMonthTotal ? (amount / thisMonthTotal) * 100 : 0;
              return (
                <div key={cat?.id ?? `none-${i}`}>
                  <div className="flex items-center justify-between text-xs mb-1">
                    <span className="opacity-90">{cat?.name ?? "Nincs kategória"}</span>
                    <span className="tabular-nums font-medium">{fmtFt(amount)}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-white/25 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-white/90"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <div className="mt-4">
        <Button
          href="/koltsegek/uj"
          size="lg"
          fullWidth
          leftIcon={<Plus className="w-4 h-4" />}
        >
          Új kiadás
        </Button>
      </div>

      {expenses.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Wallet}
            title="Még nincs kiadás"
            description="Rögzítsd az első tételt. Amelyik bolthoz kategóriát választasz, azt legközelebb megjegyzi."
          />
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {groups.map((g) => (
            <Section
              key={g.key}
              title={`${g.label} · ${fmtFt(g.total)}`}
            >
              <ul className="space-y-2">
                {g.items.map((e) => {
                  const cat = e.categoryId ? catById.get(e.categoryId) : null;
                  const col = catColor(cat?.color ?? "zinc");
                  const Icon = catIcon(cat?.icon ?? "tag");
                  return (
                    <li key={e.id}>
                      <Link
                        href={`/koltsegek/${e.id}`}
                        className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm transition hover:border-[var(--color-primary)]/40 active:scale-[0.99]"
                      >
                        <div
                          className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                            col.soft,
                            col.text
                          )}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[15px] truncate">
                            {e.merchant}
                          </p>
                          <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                            {cat?.name ?? "Nincs kategória"} ·{" "}
                            {dayFmt.format(new Date(e.spentAt))}
                            {e.note ? ` · ${e.note}` : ""}
                          </p>
                        </div>
                        <p className="font-semibold tabular-nums shrink-0">
                          {fmtFt(e.amount)}
                        </p>
                        <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Section>
          ))}
        </div>
      )}
    </main>
  );
}
