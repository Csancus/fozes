"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { catColor, catIcon, payIcon } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { SlidersHorizontal, ChevronRight, Search, Wallet, TrendingUp } from "lucide-react";
import type {
  Expense,
  ExpenseCategory,
  ExpenseNature,
  ExpenseKind,
  PaymentMethod,
  Person,
  Project,
  ExpenseGroup,
} from "@/lib/types";

type SortKey = "date_desc" | "date_asc" | "amount_desc" | "amount_asc" | "abc";

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}
function fmtShort(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${Math.round(n / 1000)}e`;
  return String(Math.round(n));
}

const monthLabelFmt = new Intl.DateTimeFormat("hu-HU", {
  year: "numeric",
  month: "short",
});
const monthLongFmt = new Intl.DateTimeFormat("hu-HU", {
  year: "numeric",
  month: "long",
});
const dayFmt = new Intl.DateTimeFormat("hu-HU", { month: "short", day: "numeric" });

function monthKey(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}
function monthKeyToDate(k: string): Date {
  const [y, m] = k.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1);
}

type ChipItem = { id: string; label: string; color: string };

export function ExpensesDashboard({
  expenses: allItems,
  categories,
  incomeCategories = [],
  paymentMethods,
  persons,
  projects,
  groups = [],
  compact = false,
}: {
  expenses: Expense[];
  categories: ExpenseCategory[];
  incomeCategories?: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  persons: Person[];
  projects: Project[];
  groups?: ExpenseGroup[];
  compact?: boolean;
}) {
  // Kiadás / bevétel szétválasztása.
  const expenses = useMemo(
    () => allItems.filter((e) => (e.kind ?? "expense") !== "income"),
    [allItems]
  );
  const incomes = useMemo(
    () => allItems.filter((e) => (e.kind ?? "expense") === "income"),
    [allItems]
  );
  const incomeCatById = useMemo(
    () => new Map(incomeCategories.map((c) => [c.id, c])),
    [incomeCategories]
  );
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories]
  );
  const payById = useMemo(
    () => new Map(paymentMethods.map((p) => [p.id, p])),
    [paymentMethods]
  );
  const personById = useMemo(
    () => new Map(persons.map((p) => [p.id, p])),
    [persons]
  );
  const projectById = useMemo(
    () => new Map(projects.map((p) => [p.id, p])),
    [projects]
  );
  const groupById = useMemo(
    () => new Map(groups.map((g) => [g.id, g])),
    [groups]
  );

  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  });
  const [nature, setNature] = useState<ExpenseNature | "all">("avg");
  const [kindF, setKindF] = useState<ExpenseKind | "all">("all");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [pays, setPays] = useState<Set<string>>(new Set());
  const [people, setPeople] = useState<Set<string>>(new Set());
  const [projs, setProjs] = useState<Set<string>>(new Set());
  const [grps, setGrps] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [showFilters, setShowFilters] = useState(false);

  function sortItems(list: Expense[]): Expense[] {
    const arr = [...list];
    switch (sort) {
      case "date_asc":
        return arr.sort((a, b) => a.spentAt - b.spentAt);
      case "amount_desc":
        return arr.sort((a, b) => b.amount - a.amount);
      case "amount_asc":
        return arr.sort((a, b) => a.amount - b.amount);
      case "abc":
        return arr.sort((a, b) => a.merchant.localeCompare(b.merchant, "hu"));
      default:
        return arr.sort((a, b) => b.spentAt - a.spentAt);
    }
  }

  const months = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((e) => set.add(monthKey(e.spentAt)));
    return [...set].sort().reverse();
  }, [allItems]);

  // Kategória/kártya/személy/kereső/jelleg szűrés (hónap NÉLKÜL) — a trend-charthoz
  const base = useMemo(() => {
    const q = search.trim().toLowerCase();
    return expenses.filter((e) => {
      if (nature !== "all" && (e.nature ?? "avg") !== nature) return false;
      if (cats.size && !(e.categoryId && cats.has(e.categoryId))) return false;
      if (pays.size && !(e.paymentMethodId && pays.has(e.paymentMethodId)))
        return false;
      if (people.size && !(e.personId && people.has(e.personId))) return false;
      if (projs.size && !(e.projectId && projs.has(e.projectId))) return false;
      if (grps.size && !(e.groupId && grps.has(e.groupId))) return false;
      if (q && !e.merchant.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [expenses, nature, cats, pays, people, projs, grps, search]);

  // Bevételek a kiválasztott hónapra (személy/csoport/kereső szűrővel).
  const incomeScoped = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incomes.filter((e) => {
      if (month !== "all" && monthKey(e.spentAt) !== month) return false;
      if (people.size && !(e.personId && people.has(e.personId))) return false;
      if (grps.size && !(e.groupId && grps.has(e.groupId))) return false;
      if (q && !e.merchant.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [incomes, month, people, grps, search]);
  const incomeTotal = incomeScoped.reduce((s, e) => s + e.amount, 0);

  const monthly = useMemo(() => {
    const m = new Map<string, number>();
    base.forEach((e) => {
      const k = monthKey(e.spentAt);
      m.set(k, (m.get(k) ?? 0) + e.amount);
    });
    return [...m.entries()]
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-12)
      .map(([k, total]) => ({ k, total }));
  }, [base]);

  const scoped = useMemo(
    () => (month === "all" ? base : base.filter((e) => monthKey(e.spentAt) === month)),
    [base, month]
  );
  const total = scoped.reduce((s, e) => s + e.amount, 0);

  // A tétel-lista a Típus-szűrő szerint (kiadás/bevétel/mind) + rendezve.
  const listItems = useMemo(
    () =>
      sortItems([
        ...(kindF === "income" ? [] : scoped),
        ...(kindF === "expense" ? [] : incomeScoped),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kindF, scoped, incomeScoped, sort]
  );

  function group(
    getId: (e: Expense) => string | null,
    resolve: (id: string) => ChipItem | null
  ) {
    const m = new Map<string, number>();
    scoped.forEach((e) => {
      const k = getId(e) ?? "__none";
      m.set(k, (m.get(k) ?? 0) + e.amount);
    });
    return [...m.entries()]
      .map(([k, amount]) => ({
        item: k === "__none" ? null : resolve(k),
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }

  const byCat = useMemo(
    () =>
      group(
        (e) => e.categoryId,
        (id) => {
          const c = catById.get(id);
          return c ? { id, label: c.name, color: c.color } : null;
        }
      ),
    [scoped, catById]
  );
  const byPay = useMemo(
    () =>
      group(
        (e) => e.paymentMethodId,
        (id) => {
          const p = payById.get(id);
          return p ? { id, label: p.name, color: p.color } : null;
        }
      ),
    [scoped, payById]
  );
  const byPerson = useMemo(
    () =>
      group(
        (e) => e.personId,
        (id) => {
          const p = personById.get(id);
          return p ? { id, label: p.name, color: p.color } : null;
        }
      ),
    [scoped, personById]
  );
  const byProject = useMemo(
    () =>
      group(
        (e) => e.projectId,
        (id) => {
          const p = projectById.get(id);
          return p ? { id, label: p.name, color: p.color } : null;
        }
      ),
    [scoped, projectById]
  );

  const maxMonthly = Math.max(1, ...monthly.map((m) => m.total));
  const activeFilters =
    cats.size +
    pays.size +
    people.size +
    projs.size +
    grps.size +
    (kindF !== "all" ? 1 : 0) +
    (search ? 1 : 0);

  function toggle(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }

  return (
    <div>
      {/* Hónap szűrő */}
      <div className="mt-5 flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        <MonthChip active={month === "all"} onClick={() => setMonth("all")}>
          Összes
        </MonthChip>
        {months.map((m) => (
          <MonthChip key={m} active={month === m} onClick={() => setMonth(m)}>
            {monthLabelFmt.format(monthKeyToDate(m))}
          </MonthChip>
        ))}
      </div>

      {/* Egyenleg kártya */}
      <section className="mt-4 rounded-2xl brand-gradient text-white p-5 shadow-sm">
        <p className="text-xs opacity-80 uppercase tracking-wider">
          {month === "all" ? "Egyenleg (összes)" : monthLongFmt.format(monthKeyToDate(month))}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {incomeTotal - total >= 0 ? "+" : ""}
          {fmtFt(incomeTotal - total)}
        </p>
        <div className="mt-3 flex gap-4 text-xs">
          <span className="flex flex-col">
            <span className="opacity-80">Bevétel</span>
            <span className="font-semibold tabular-nums text-emerald-100">
              +{fmtFt(incomeTotal)}
            </span>
          </span>
          <span className="flex flex-col">
            <span className="opacity-80">Kiadás</span>
            <span className="font-semibold tabular-nums">
              −{fmtFt(total)}
            </span>
          </span>
          <span className="flex flex-col">
            <span className="opacity-80">Tételek</span>
            <span className="font-semibold tabular-nums">
              {scoped.length}
              {activeFilters > 0 || nature !== "all" ? " · szűrve" : ""}
            </span>
          </span>
        </div>
      </section>

      {/* Jelleg szűrő */}
      <div className="mt-4 flex gap-2">
        <NatureChip active={nature === "all"} onClick={() => setNature("all")}>
          Mind
        </NatureChip>
        <NatureChip active={nature === "avg"} onClick={() => setNature("avg")}>
          Havi átlagos
        </NatureChip>
        <NatureChip active={nature === "project"} onClick={() => setNature("project")}>
          Eseti projekt
        </NatureChip>
      </div>

      {/* Szűrők nyitó + szabadszavas kereső + rendezés */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--color-border)] text-sm font-medium text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Szűrők
          {activeFilters > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[var(--color-primary)] text-white text-[11px]">
              {activeFilters}
            </span>
          )}
        </button>
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés (bolt / kinek)…"
            className="w-full h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          />
        </div>
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value as SortKey)}
          aria-label="Rendezés"
          className="shrink-0 h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] px-2 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
        >
          <option value="date_desc">Legújabb elöl</option>
          <option value="date_asc">Legrégebbi elöl</option>
          <option value="amount_desc">Összeg ↓</option>
          <option value="amount_asc">Összeg ↑</option>
          <option value="abc">ABC</option>
        </select>
      </div>

      {showFilters && (
        <div className="mt-3 space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div>
            <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">Típus</p>
            <div className="flex gap-2">
              {(["all", "expense", "income"] as const).map((k) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKindF(k)}
                  className={cn(
                    "flex-1 h-9 rounded-full text-[13px] font-medium border transition",
                    kindF === k
                      ? "bg-[var(--color-primary)] text-white border-transparent"
                      : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
                  )}
                >
                  {k === "all" ? "Mind" : k === "expense" ? "Kiadás" : "Bevétel"}
                </button>
              ))}
            </div>
          </div>

          {groups.length > 0 && (
            <FilterGroup label="Csoport">
              {groups.map((g) => (
                <MiniChip
                  key={g.id}
                  color={g.color}
                  active={grps.has(g.id)}
                  onClick={() => toggle(grps, setGrps, g.id)}
                >
                  {g.name}
                </MiniChip>
              ))}
            </FilterGroup>
          )}

          <FilterGroup label="Kategória">
            {categories.map((c) => (
              <MiniChip
                key={c.id}
                color={c.color}
                active={cats.has(c.id)}
                onClick={() => toggle(cats, setCats, c.id)}
              >
                {c.name}
              </MiniChip>
            ))}
          </FilterGroup>

          <FilterGroup label="Fizetési mód">
            {paymentMethods.map((p) => (
              <MiniChip
                key={p.id}
                color={p.color}
                active={pays.has(p.id)}
                onClick={() => toggle(pays, setPays, p.id)}
              >
                {p.name}
              </MiniChip>
            ))}
          </FilterGroup>

          {persons.length > 0 && (
            <FilterGroup label="Ki költötte">
              {persons.map((p) => (
                <MiniChip
                  key={p.id}
                  color={p.color}
                  active={people.has(p.id)}
                  onClick={() => toggle(people, setPeople, p.id)}
                >
                  {p.name}
                </MiniChip>
              ))}
            </FilterGroup>
          )}

          {projects.length > 0 && (
            <FilterGroup label="Projekt">
              {projects.map((p) => (
                <MiniChip
                  key={p.id}
                  color={p.color}
                  active={projs.has(p.id)}
                  onClick={() => toggle(projs, setProjs, p.id)}
                >
                  {p.name}
                </MiniChip>
              ))}
            </FilterGroup>
          )}

          {activeFilters > 0 && (
            <button
              type="button"
              onClick={() => {
                setCats(new Set());
                setPays(new Set());
                setPeople(new Set());
                setProjs(new Set());
                setGrps(new Set());
                setKindF("all");
                setSearch("");
              }}
              className="text-sm text-[var(--color-primary)] font-medium"
            >
              Szűrők törlése
            </button>
          )}
        </div>
      )}

      {/* Havi trend */}
      {!compact && monthly.length > 1 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
            Havi trend
          </h2>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
            <div className="flex items-end justify-between gap-1.5 h-36">
              {monthly.map((m) => {
                const h = Math.max(4, (m.total / maxMonthly) * 100);
                const active = month === m.k;
                return (
                  <button
                    type="button"
                    key={m.k}
                    onClick={() => setMonth(active ? "all" : m.k)}
                    className="flex-1 flex flex-col items-center justify-end h-full gap-1 group"
                    title={fmtFt(m.total)}
                  >
                    <span className="text-[10px] tabular-nums text-[var(--color-muted-foreground)]">
                      {fmtShort(m.total)}
                    </span>
                    <span
                      className={cn(
                        "w-full rounded-t-md transition-all",
                        active
                          ? "bg-[var(--color-primary)]"
                          : "bg-[var(--color-primary)]/35 group-hover:bg-[var(--color-primary)]/55"
                      )}
                      style={{ height: `${h}%` }}
                    />
                    <span className="text-[9px] text-[var(--color-muted-foreground)] whitespace-nowrap">
                      {monthLabelFmt.format(monthKeyToDate(m.k)).replace(/\s?\d{4}\.?/, "")}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Kategória bontás */}
      {!compact && byCat.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
            Kategóriák szerint
          </h2>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
            {byCat.map(({ item, amount }, i) => {
              const col = catColor(item?.color ?? "zinc");
              const pct = total ? (amount / total) * 100 : 0;
              return (
                <div key={item?.id ?? `none-${i}`}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                      {item?.label ?? "Nincs kategória"}
                    </span>
                    <span className="tabular-nums font-medium">
                      {fmtFt(amount)}
                      <span className="text-[var(--color-muted-foreground)] font-normal">
                        {" "}
                        · {Math.round(pct)}%
                      </span>
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--color-muted)] overflow-hidden">
                    <div className={cn("h-full rounded-full", col.dot)} style={{ width: `${pct}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Fizetési mód + személy mini bontás */}
      {!compact && (
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {byPay.length > 0 && (
            <MiniBreakdown title="Fizetési mód" rows={byPay} total={total} noneLabel="Nincs megadva" />
          )}
          {byPerson.some((b) => b.item) && (
            <MiniBreakdown title="Ki költötte" rows={byPerson} total={total} noneLabel="Nincs megadva" />
          )}
          {byProject.some((b) => b.item) && (
            <MiniBreakdown title="Projektek" rows={byProject} total={total} noneLabel="Projekt nélkül" />
          )}
        </div>
      )}

      {/* Lista */}
      <section className="mt-8">
        <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
          Tételek ({listItems.length})
        </h2>
        {listItems.length === 0 ? (
          <div className="flex flex-col items-center text-center py-12 text-[var(--color-muted-foreground)]">
            <Wallet className="w-8 h-8 mb-2" />
            <p className="text-sm">Nincs a szűrőnek megfelelő tétel.</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {listItems.map((e) => {
              const inc = (e.kind ?? "expense") === "income";
              const cat = e.categoryId
                ? (inc ? incomeCatById : catById).get(e.categoryId)
                : null;
              const pay = e.paymentMethodId ? payById.get(e.paymentMethodId) : null;
              const person = e.personId ? personById.get(e.personId) : null;
              const project = e.projectId ? projectById.get(e.projectId) : null;
              const col = catColor(cat?.color ?? (inc ? "emerald" : "zinc"));
              const Icon = catIcon(cat?.icon ?? (inc ? "savings" : "tag"));
              const PayIcon = pay ? payIcon(pay.kind) : null;
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
                      <div className="flex items-center gap-1.5">
                        <p className="font-medium text-[15px] truncate">{e.merchant}</p>
                        {project && (
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0", catColor(project.color).soft, catColor(project.color).text)}>
                            <span className={cn("w-1.5 h-1.5 rounded-full", catColor(project.color).dot)} />
                            {project.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate flex items-center gap-1.5">
                        <span>{cat?.name ?? (inc ? "Bevétel" : "Nincs kategória")}</span>
                        <span>· {dayFmt.format(new Date(e.spentAt))}</span>
                        {PayIcon && (
                          <span className="inline-flex items-center gap-0.5">
                            · <PayIcon className="w-3 h-3" /> {pay?.name}
                          </span>
                        )}
                        {person && (
                          <span className="inline-flex items-center gap-0.5">
                            · <span className={cn("w-2 h-2 rounded-full", catColor(person.color).dot)} />
                            {person.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className={cn("font-semibold tabular-nums shrink-0", inc && "text-emerald-600 dark:text-emerald-400")}>
                      {inc ? "+" : ""}
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

      {/* Bevételek — külön szekció csak kiadás-szűrésnél (különben a lista már tartalmazza) */}
      {kindF === "expense" && incomeScoped.length > 0 && (
        <section className="mt-8">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Bevételek · {fmtFt(incomeTotal)}
          </h2>
          <ul className="space-y-2">
            {incomeScoped.map((e) => {
              const cat = e.categoryId ? incomeCatById.get(e.categoryId) : null;
              const person = e.personId ? personById.get(e.personId) : null;
              const col = catColor(cat?.color ?? "emerald");
              const Icon = catIcon(cat?.icon ?? "savings");
              return (
                <li key={e.id}>
                  <Link
                    href={`/koltsegek/${e.id}`}
                    className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm transition hover:border-emerald-500/40 active:scale-[0.99]"
                  >
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[15px] truncate">{e.merchant}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate flex items-center gap-1.5">
                        <span>{cat?.name ?? "Bevétel"}</span>
                        <span>· {dayFmt.format(new Date(e.spentAt))}</span>
                        {person && (
                          <span className="inline-flex items-center gap-0.5">
                            · <span className={cn("w-2 h-2 rounded-full", catColor(person.color).dot)} />
                            {person.name}
                          </span>
                        )}
                      </p>
                    </div>
                    <p className="font-semibold tabular-nums shrink-0 text-emerald-600 dark:text-emerald-400">
                      +{fmtFt(e.amount)}
                    </p>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}

function NatureChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 h-9 rounded-full text-[13px] font-medium border transition",
        active
          ? "bg-[var(--color-primary)] text-white border-transparent"
          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      {children}
    </button>
  );
}

function MonthChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 h-9 px-3.5 rounded-full text-sm font-medium border transition whitespace-nowrap",
        active
          ? "bg-[var(--color-primary)] text-white border-transparent"
          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">
        {label}
      </p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function MiniChip({
  color,
  active,
  onClick,
  children,
}: {
  color: string;
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  const col = catColor(color);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 h-8 text-[13px] font-medium border transition",
        active
          ? cn(col.soft, col.text, "border-transparent ring-1", col.ring)
          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", col.dot)} />
      {children}
    </button>
  );
}

function MiniBreakdown({
  title,
  rows,
  total,
  noneLabel,
}: {
  title: string;
  rows: { item: ChipItem | null; amount: number }[];
  total: number;
  noneLabel: string;
}) {
  return (
    <section>
      <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
        {title}
      </h2>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-2.5">
        {rows.map(({ item, amount }, i) => {
          const col = catColor(item?.color ?? "zinc");
          const pct = total ? (amount / total) * 100 : 0;
          return (
            <div key={item?.id ?? `none-${i}`}>
              <div className="flex items-center justify-between text-[13px] mb-1">
                <span className="flex items-center gap-1.5">
                  <span className={cn("w-2 h-2 rounded-full", col.dot)} />
                  {item?.label ?? noneLabel}
                </span>
                <span className="tabular-nums font-medium">{fmtFt(amount)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                <div className={cn("h-full rounded-full", col.dot)} style={{ width: `${pct}%` }} />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
