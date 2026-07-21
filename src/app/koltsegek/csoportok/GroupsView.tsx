"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { catColor, catIcon } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { ChevronRight, Layers, TrendingUp } from "lucide-react";
import type {
  Expense,
  ExpenseCategory,
  ExpenseGroup,
  Person,
} from "@/lib/types";

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}
const dayFmt = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "short", day: "numeric" });
const monthShortFmt = new Intl.DateTimeFormat("hu-HU", { month: "short" });
function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthKeyToDate(k: string): Date {
  const [y, m] = k.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1);
}

export function GroupsView({
  groups,
  expenses,
  categories,
  incomeCategories,
  persons,
}: {
  groups: ExpenseGroup[];
  expenses: Expense[];
  categories: ExpenseCategory[];
  incomeCategories: ExpenseCategory[];
  persons: Person[];
}) {
  const [selected, setSelected] = useState<string>(groups[0]?.id ?? "");

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const incomeCatById = useMemo(() => new Map(incomeCategories.map((c) => [c.id, c])), [incomeCategories]);
  const personById = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);

  const [month, setMonth] = useState<string>("all");

  const items = useMemo(
    () =>
      expenses
        .filter((e) => e.groupId === selected)
        .sort((a, b) => b.spentAt - a.spentAt),
    [expenses, selected]
  );

  // Hónapok, ahol van adat a csoportban.
  const months = useMemo(() => {
    const set = new Set<string>();
    items.forEach((e) => set.add(monthKey(e.spentAt)));
    return [...set].sort().reverse();
  }, [items]);

  // A kiválasztott hónapra szűrt tételek (a kártya + lista ehhez igazodik).
  const scopedItems = useMemo(
    () => (month === "all" ? items : items.filter((e) => monthKey(e.spentAt) === month)),
    [items, month]
  );

  const income = scopedItems.filter((e) => (e.kind ?? "expense") === "income").reduce((s, e) => s + e.amount, 0);
  const expense = scopedItems.filter((e) => (e.kind ?? "expense") !== "income").reduce((s, e) => s + e.amount, 0);
  const net = income - expense;
  const maxBar = Math.max(1, income, expense);

  // Havi nettó bontás.
  const monthly = useMemo(() => {
    const m = new Map<string, number>();
    items.forEach((e) => {
      const k = monthKey(e.spentAt);
      const signed = (e.kind ?? "expense") === "income" ? e.amount : -e.amount;
      m.set(k, (m.get(k) ?? 0) + signed);
    });
    return [...m.entries()].sort((a, b) => a[0].localeCompare(b[0]));
  }, [items]);
  const maxMonthly = Math.max(1, ...monthly.map((m) => Math.abs(m[1])));

  const group = groups.find((g) => g.id === selected);

  if (groups.length === 0) {
    return (
      <div className="mt-8 flex flex-col items-center text-center py-12 text-[var(--color-muted-foreground)]">
        <Layers className="w-8 h-8 mb-2" />
        <p className="text-sm">
          Még nincs csoport. Hozz létre egyet a{" "}
          <Link href="/koltsegek/beallitasok" className="text-[var(--color-primary)] font-medium">
            Beállításokban
          </Link>
          , majd rendelj hozzá kiadásokat/bevételeket.
        </p>
      </div>
    );
  }

  return (
    <div className="mt-5">
      {/* Csoportváltó */}
      <div className="flex gap-2 overflow-x-auto py-1.5 -mx-1 px-1">
        {groups.map((g) => {
          const col = catColor(g.color);
          const active = selected === g.id;
          return (
            <button
              key={g.id}
              type="button"
              onClick={() => setSelected(g.id)}
              className={cn(
                "shrink-0 inline-flex items-center gap-1.5 h-9 px-3.5 rounded-full text-sm font-medium border transition whitespace-nowrap",
                active
                  ? cn(col.soft, col.text, "border-transparent ring-1", col.ring)
                  : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              )}
            >
              <span className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
              {g.name}
            </button>
          );
        })}
      </div>

      {/* Hónap szűrő */}
      {months.length > 0 && (
        <div className="mt-2 flex gap-2 overflow-x-auto py-1 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setMonth("all")}
            className={cn(
              "shrink-0 h-9 px-3.5 rounded-full text-sm font-medium border transition whitespace-nowrap",
              month === "all"
                ? "bg-[var(--color-primary)] text-white border-transparent"
                : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            )}
          >
            Összes
          </button>
          {months.map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => setMonth(m)}
              className={cn(
                "shrink-0 h-9 px-3.5 rounded-full text-sm font-medium border transition whitespace-nowrap",
                month === m
                  ? "bg-[var(--color-primary)] text-white border-transparent"
                  : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
              )}
            >
              {monthShortFmt.format(monthKeyToDate(m))}
            </button>
          ))}
        </div>
      )}

      {/* Egyenleg kártya — kioltják-e egymást */}
      <section className="mt-4 rounded-2xl brand-gradient text-white p-5 shadow-sm">
        <p className="text-xs opacity-80 uppercase tracking-wider">
          {group?.name} · egyenleg{month !== "all" ? ` · ${monthShortFmt.format(monthKeyToDate(month))}` : ""}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {net >= 0 ? "+" : ""}
          {fmtFt(net)}
        </p>
        <p className="text-xs opacity-90 mt-1">
          {net === 0
            ? "Pontosan kioltják egymást."
            : net > 0
            ? "A bevételek túlsúlyban — marad " + fmtFt(net) + "."
            : "Hiány — " + fmtFt(-net) + " a kiadás többlet."}
        </p>

        {/* Bevétel vs kiadás sávok */}
        <div className="mt-4 space-y-2">
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-90">Bevétel</span>
              <span className="tabular-nums font-medium">+{fmtFt(income)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-emerald-300" style={{ width: `${(income / maxBar) * 100}%` }} />
            </div>
          </div>
          <div>
            <div className="flex justify-between text-xs mb-1">
              <span className="opacity-90">Kiadás</span>
              <span className="tabular-nums font-medium">−{fmtFt(expense)}</span>
            </div>
            <div className="h-2.5 rounded-full bg-white/20 overflow-hidden">
              <div className="h-full rounded-full bg-white/90" style={{ width: `${(expense / maxBar) * 100}%` }} />
            </div>
          </div>
        </div>
      </section>

      {/* Havi nettó chart */}
      {monthly.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
            Havi nettó (bevétel − kiadás)
          </h2>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 overflow-x-auto">
            <div className="flex items-stretch justify-around gap-4 h-64 min-w-full">
              {monthly.map(([k, v]) => {
                const h = (Math.abs(v) / maxMonthly) * 46; // félmagasság a 0-vonalig (%)
                const pos = v >= 0;
                return (
                  <div
                    key={k}
                    className="flex flex-col items-center justify-center h-full"
                    style={{ flex: "1 1 0", maxWidth: "120px" }}
                    title={fmtFt(v)}
                  >
                    {/* felső fél (pozitív) */}
                    <div className="flex-1 w-full flex items-end justify-center">
                      {pos && (
                        <div className="w-16 rounded-t-lg bg-emerald-500" style={{ height: `${h}%` }} />
                      )}
                    </div>
                    <div className="w-full border-t border-[var(--color-border)]" />
                    {/* alsó fél (negatív) */}
                    <div className="flex-1 w-full flex items-start justify-center">
                      {!pos && (
                        <div className="w-16 rounded-b-lg bg-[var(--color-primary)]" style={{ height: `${h}%` }} />
                      )}
                    </div>
                    <span className="text-sm font-medium text-[var(--color-foreground)] mt-2 whitespace-nowrap">
                      {monthShortFmt.format(monthKeyToDate(k)).replace(".", "")}
                    </span>
                    <span className={cn("text-sm font-semibold tabular-nums", pos ? "text-emerald-600 dark:text-emerald-400" : "text-[var(--color-primary)]")}>
                      {v >= 0 ? "+" : ""}
                      {fmtFt(v)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Tételek */}
      <section className="mt-6">
        <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
          Tételek ({scopedItems.length})
        </h2>
        {scopedItems.length === 0 ? (
          <p className="py-10 text-center text-sm text-[var(--color-muted-foreground)]">
            Ehhez a csoporthoz {month === "all" ? "még nincs tétel" : "ebben a hónapban nincs tétel"}. Rögzítéskor válaszd ki a csoportot.
          </p>
        ) : (
          <ul className="space-y-2">
            {scopedItems.map((e) => {
              const inc = (e.kind ?? "expense") === "income";
              const cat = e.categoryId ? (inc ? incomeCatById : catById).get(e.categoryId) : null;
              const person = e.personId ? personById.get(e.personId) : null;
              const col = catColor(cat?.color ?? (inc ? "emerald" : "zinc"));
              const Icon = inc ? TrendingUp : catIcon(cat?.icon ?? "tag");
              return (
                <li key={e.id}>
                  <Link
                    href={`/koltsegek/${e.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm transition hover:border-[var(--color-primary)]/40 active:scale-[0.99]"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[15px] truncate">{e.merchant}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                        {cat?.name ?? (inc ? "Bevétel" : "Nincs kategória")} · {dayFmt.format(new Date(e.spentAt))}
                        {person ? ` · ${person.name}` : ""}
                      </p>
                    </div>
                    <p className={cn("font-semibold tabular-nums shrink-0", inc ? "text-emerald-600 dark:text-emerald-400" : "")}>
                      {inc ? "+" : "−"}
                      {fmtFt(e.amount)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
