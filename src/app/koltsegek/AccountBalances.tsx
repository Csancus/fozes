import Link from "next/link";
import { cn } from "@/lib/cn";
import { catColor, payIcon } from "@/lib/expense-visuals";
import type { Expense, PaymentMethod } from "@/lib/types";

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

// A tételek `spentAt`-je a nap dele, a kezdő egyenleg dátuma viszont bármikor
// keletkezhetett a napon belül — ezért nap elejére kerekítjük, különben a
// megadás napján rögzített tételek kimaradnának.
function startOfDay(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

// Számla-állás: kezdő egyenleg + ide érkezett bevétel − innen fizetett kiadás.
// Csak azokat mutatjuk, amikhez van megadott kezdő egyenleg (openingAt).
export function AccountBalances({
  paymentMethods,
  expenses,
}: {
  paymentMethods: PaymentMethod[];
  expenses: Expense[];
}) {
  const tracked = paymentMethods.filter((p) => p.openingAt !== null);
  if (tracked.length === 0) return null;
  const untracked = paymentMethods.filter((p) => p.openingAt === null);

  const rows = tracked.map((pm) => {
    const from = startOfDay(pm.openingAt ?? 0);
    let delta = 0;
    for (const e of expenses) {
      if (e.paymentMethodId !== pm.id) continue;
      if (e.spentAt < from) continue;
      if (e.planned) continue;
      delta += e.kind === "income" ? e.amount : -e.amount;
    }
    return { pm, balance: pm.openingBalance + delta, delta };
  });
  const total = rows.reduce((s, r) => s + r.balance, 0);

  return (
    <section className="mt-5">
      <div className="flex items-baseline justify-between">
        <h2 className="text-[13px] font-semibold uppercase tracking-wider text-[var(--color-muted-foreground)]">
          Számlaegyenleg
        </h2>
        {rows.length > 1 && (
          <span className="text-sm font-semibold tabular-nums">
            {fmtFt(total)}
          </span>
        )}
      </div>
      <div className="mt-2 grid gap-2 sm:grid-cols-2">
        {rows.map(({ pm, balance, delta }) => {
          const col = catColor(pm.color);
          const Icon = payIcon(pm.kind);
          return (
            <div
              key={pm.id}
              className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3"
            >
              <span
                className={cn(
                  "w-9 h-9 rounded-xl flex items-center justify-center shrink-0",
                  col.soft,
                  col.text
                )}
              >
                <Icon className="w-4.5 h-4.5" />
              </span>
              <span className="flex-1 min-w-0">
                <span className="block text-sm font-medium truncate">
                  {pm.name}
                  {pm.last4 && (
                    <span className="opacity-60 tabular-nums"> ··{pm.last4}</span>
                  )}
                </span>
                <span className="block text-[11px] text-[var(--color-muted-foreground)]">
                  {delta === 0
                    ? "a megadott kezdő összeg"
                    : `${delta > 0 ? "+" : "−"}${fmtFt(Math.abs(delta))} a kezdés óta`}
                </span>
              </span>
              <span
                className={cn(
                  "text-sm font-semibold tabular-nums shrink-0",
                  balance < 0 && "text-red-600"
                )}
              >
                {fmtFt(balance)}
              </span>
            </div>
          );
        })}
      </div>

      {untracked.length > 0 && (
        <p className="mt-2 text-xs text-[var(--color-muted-foreground)]">
          Nincs kezdő egyenleg:{" "}
          {untracked.map((p) => p.name).join(", ")} —{" "}
          <Link
            href="/koltsegek/bevezeto"
            className="text-[var(--color-primary)] font-medium underline underline-offset-2"
          >
            megadom
          </Link>
        </p>
      )}
    </section>
  );
}
