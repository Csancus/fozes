"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { catColor, catIcon, payIcon } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { SlidersHorizontal, Search, TrendingUp, ChevronRight, Trophy } from "lucide-react";
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

const monthShortFmt = new Intl.DateTimeFormat("hu-HU", { month: "short" });
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

// Szín-tokenek hex értékei (pie chartokhoz, ahol Tailwind class nem használható).
const HEX: Record<string, string> = {
  emerald: "#10b981",
  orange: "#f97316",
  sky: "#0ea5e9",
  indigo: "#6366f1",
  rose: "#f43f5e",
  violet: "#8b5cf6",
  pink: "#ec4899",
  cyan: "#06b6d4",
  amber: "#f59e0b",
  zinc: "#a1a1aa",
};
const PALETTE = ["sky", "violet", "orange", "emerald", "rose", "cyan", "amber", "pink", "indigo", "zinc"];
function hexOf(token: string | null | undefined, i: number): string {
  if (token && HEX[token]) return HEX[token];
  return HEX[PALETTE[i % PALETTE.length]];
}

type Seg = { label: string; value: number; color: string };
// Top 6 szegmens + "Egyéb" összevonva.
function toSegments(rows: Seg[]): Seg[] {
  const clean = rows.filter((r) => r.value > 0);
  if (clean.length <= 7) return clean;
  const top = clean.slice(0, 6);
  const rest = clean.slice(6).reduce((s, r) => s + r.value, 0);
  return [...top, { label: "Egyéb", value: rest, color: HEX.zinc }];
}

export function OverviewDashboard({
  expenses: allItems,
  categories,
  incomeCategories = [],
  paymentMethods,
  persons,
  projects,
  groups = [],
}: {
  expenses: Expense[];
  categories: ExpenseCategory[];
  incomeCategories?: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  persons: Person[];
  projects: Project[];
  groups?: ExpenseGroup[];
}) {
  const expensesAll = useMemo(
    () => allItems.filter((e) => (e.kind ?? "expense") !== "income"),
    [allItems]
  );
  const incomesAll = useMemo(
    () => allItems.filter((e) => (e.kind ?? "expense") === "income"),
    [allItems]
  );

  const catById = useMemo(() => new Map(categories.map((c) => [c.id, c])), [categories]);
  const payById = useMemo(
    () => new Map(paymentMethods.map((p) => [p.id, p])),
    [paymentMethods]
  );
  const personById = useMemo(() => new Map(persons.map((p) => [p.id, p])), [persons]);
  const projectById = useMemo(() => new Map(projects.map((p) => [p.id, p])), [projects]);
  const incomeCatById = useMemo(
    () => new Map(incomeCategories.map((c) => [c.id, c])),
    [incomeCategories]
  );

  const [month, setMonth] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
  }); // alapból az aktuális hónap ("all" = teljes 12 hó)
  const [nature, setNature] = useState<ExpenseNature | "all">("avg");
  const [kindF, setKindF] = useState<ExpenseKind | "all">("all");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [pays, setPays] = useState<Set<string>>(new Set());
  const [people, setPeople] = useState<Set<string>>(new Set());
  const [projs, setProjs] = useState<Set<string>>(new Set());
  const [grps, setGrps] = useState<Set<string>>(new Set());
  const [sort, setSort] = useState<SortKey>("date_desc");
  const [search, setSearch] = useState("");
  const groupById = useMemo(() => new Map(groups.map((g) => [g.id, g])), [groups]);
  void groupById;

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
  const [showFilters, setShowFilters] = useState(false);

  // Elmúlt 12 hónap kulcsai (a mostani hónaptól visszafelé).
  const window12 = useMemo(() => {
    const now = new Date();
    const keys: string[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      keys.push(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`);
    }
    return keys;
  }, []);
  const windowSet = useMemo(() => new Set(window12), [window12]);

  // Csak azok a hónapok, ahol van adat (max 12, legfrissebb elöl).
  const monthsWithData = useMemo(() => {
    const set = new Set<string>();
    allItems.forEach((e) => set.add(monthKey(e.spentAt)));
    return [...set].sort().reverse().slice(0, 12);
  }, [allItems]);

  function matchExpenseFilters(e: Expense): boolean {
    const q = search.trim().toLowerCase();
    if (nature !== "all" && (e.nature ?? "avg") !== nature) return false;
    if (cats.size && !(e.categoryId && cats.has(e.categoryId))) return false;
    if (pays.size && !(e.paymentMethodId && pays.has(e.paymentMethodId))) return false;
    if (people.size && !(e.personId && people.has(e.personId))) return false;
    if (projs.size && !(e.projectId && projs.has(e.projectId))) return false;
    if (grps.size && !(e.groupId && grps.has(e.groupId))) return false;
    if (q && !e.merchant.toLowerCase().includes(q)) return false;
    return true;
  }

  // Szűrt kiadások az elmúlt 12 hónapban.
  const expenseWindow = useMemo(
    () => expensesAll.filter((e) => windowSet.has(monthKey(e.spentAt)) && matchExpenseFilters(e)),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [expensesAll, windowSet, nature, cats, pays, people, projs, grps, search]
  );
  const incomeWindow = useMemo(() => {
    const q = search.trim().toLowerCase();
    return incomesAll.filter((e) => {
      if (!windowSet.has(monthKey(e.spentAt))) return false;
      if (people.size && !(e.personId && people.has(e.personId))) return false;
      if (grps.size && !(e.groupId && grps.has(e.groupId))) return false;
      if (q && !e.merchant.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [incomesAll, windowSet, people, grps, search]);

  // Havi bontás (12 vödör).
  const monthly = useMemo(() => {
    const exp = new Map<string, number>();
    const inc = new Map<string, number>();
    expenseWindow.forEach((e) => exp.set(monthKey(e.spentAt), (exp.get(monthKey(e.spentAt)) ?? 0) + e.amount));
    incomeWindow.forEach((e) => inc.set(monthKey(e.spentAt), (inc.get(monthKey(e.spentAt)) ?? 0) + e.amount));
    return window12.map((k) => ({ k, exp: exp.get(k) ?? 0, inc: inc.get(k) ?? 0 }));
  }, [expenseWindow, incomeWindow, window12]);

  const maxBar = Math.max(1, ...monthly.map((m) => Math.max(m.exp, m.inc)));

  // Aktuális nézet: teljes 12 hó vagy egy kiválasztott hónap.
  const scopedExpense = useMemo(
    () => (month === "all" ? expenseWindow : expenseWindow.filter((e) => monthKey(e.spentAt) === month)),
    [expenseWindow, month]
  );
  const scopedIncome = useMemo(
    () => (month === "all" ? incomeWindow : incomeWindow.filter((e) => monthKey(e.spentAt) === month)),
    [incomeWindow, month]
  );

  // Tétel-lista a Típus-szűrő szerint + rendezve.
  const listItems = useMemo(
    () =>
      sortItems([
        ...(kindF === "income" ? [] : scopedExpense),
        ...(kindF === "expense" ? [] : scopedIncome),
      ]),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [kindF, scopedExpense, scopedIncome, sort]
  );

  const totalExpense = scopedExpense.reduce((s, e) => s + e.amount, 0);
  const totalIncome = scopedIncome.reduce((s, e) => s + e.amount, 0);
  const monthsCount = month === "all" ? 12 : 1;
  const avgPerMonth = totalExpense / monthsCount;

  // Legnagyobb kiadási kategóriák.
  const topCategories = useMemo(() => {
    const m = new Map<string, number>();
    scopedExpense.forEach((e) => {
      const k = e.categoryId ?? "__none";
      m.set(k, (m.get(k) ?? 0) + e.amount);
    });
    return [...m.entries()]
      .map(([k, amount]) => ({ cat: k === "__none" ? null : catById.get(k) ?? null, amount }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 8);
  }, [scopedExpense, catById]);

  // Legnagyobb egyedi kiadások.
  const biggest = useMemo(
    () => [...scopedExpense].sort((a, b) => b.amount - a.amount).slice(0, 8),
    [scopedExpense]
  );

  // Boltok / kinek szerinti bontás.
  const byMerchant = useMemo(() => {
    const m = new Map<string, number>();
    scopedExpense.forEach((e) => {
      const k = e.merchant || "—";
      m.set(k, (m.get(k) ?? 0) + e.amount);
    });
    return [...m.entries()]
      .map(([name, amount]) => ({ name, amount }))
      .sort((a, b) => b.amount - a.amount);
  }, [scopedExpense]);

  // Projekt szerinti bontás.
  const byProject = useMemo(() => {
    const m = new Map<string, number>();
    scopedExpense.forEach((e) => {
      const k = e.projectId ?? "__none";
      m.set(k, (m.get(k) ?? 0) + e.amount);
    });
    return [...m.entries()]
      .map(([k, amount]) => ({
        project: k === "__none" ? null : projectById.get(k) ?? null,
        amount,
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [scopedExpense, projectById]);

  // Pie-szegmensek a 4 dimenzióra (top 6 + Egyéb).
  const pieCategory = useMemo(
    () =>
      toSegments(
        topCategories.map((c, i) => ({
          label: c.cat?.name ?? "Nincs kategória",
          value: c.amount,
          color: hexOf(c.cat?.color, i),
        }))
      ),
    [topCategories]
  );
  const pieExpense = useMemo(
    () =>
      toSegments(
        scopedExpense
          .slice()
          .sort((a, b) => b.amount - a.amount)
          .map((e, i) => ({ label: e.merchant || "—", value: e.amount, color: hexOf(null, i) }))
      ),
    [scopedExpense]
  );
  const pieMerchant = useMemo(
    () =>
      toSegments(byMerchant.map((m, i) => ({ label: m.name, value: m.amount, color: hexOf(null, i) }))),
    [byMerchant]
  );
  const pieProject = useMemo(
    () =>
      toSegments(
        byProject.map((p, i) => ({
          label: p.project?.name ?? "Projekt nélkül",
          value: p.amount,
          color: hexOf(p.project?.color, i),
        }))
      ),
    [byProject]
  );

  // Top 3 az adott időszakra (kategória / egyedi kiadás / bolt / projekt).
  const top3 = {
    category: topCategories.slice(0, 3).map((c) => ({ label: c.cat?.name ?? "Nincs kategória", amount: c.amount, color: c.cat?.color ?? "zinc" })),
    expense: biggest.slice(0, 3).map((e) => ({ label: e.merchant || "—", amount: e.amount, color: "sky" })),
    merchant: byMerchant.slice(0, 3).map((m) => ({ label: m.name, amount: m.amount, color: "violet" })),
    project: byProject.filter((p) => p.project).slice(0, 3).map((p) => ({ label: p.project!.name, amount: p.amount, color: p.project!.color })),
  };

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
          12 hó
        </MonthChip>
        {monthsWithData.map((m) => (
          <MonthChip key={m} active={month === m} onClick={() => setMonth(m)}>
            {monthShortFmt.format(monthKeyToDate(m))}
          </MonthChip>
        ))}
      </div>

      {/* Egyenleg kártya */}
      <section className="mt-4 rounded-2xl brand-gradient text-white p-5 shadow-sm">
        <p className="text-xs opacity-80 uppercase tracking-wider">
          {month === "all" ? "Elmúlt 12 hónap" : monthLongFmt.format(monthKeyToDate(month))}
        </p>
        <p className="mt-1 text-3xl font-bold tabular-nums">
          {totalIncome - totalExpense >= 0 ? "+" : ""}
          {fmtFt(totalIncome - totalExpense)}
        </p>
        <div className="mt-3 flex flex-wrap gap-4 text-xs">
          <span className="flex flex-col">
            <span className="opacity-80">Bevétel</span>
            <span className="font-semibold tabular-nums text-emerald-100">+{fmtFt(totalIncome)}</span>
          </span>
          <span className="flex flex-col">
            <span className="opacity-80">Kiadás</span>
            <span className="font-semibold tabular-nums">−{fmtFt(totalExpense)}</span>
          </span>
          <span className="flex flex-col">
            <span className="opacity-80">Havi átlag (kiadás)</span>
            <span className="font-semibold tabular-nums">{fmtFt(avgPerMonth)}</span>
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

      {/* Szűrők nyitó + kereső + rendezés egy sorban */}
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
                <MiniChip key={g.id} color={g.color} active={grps.has(g.id)} onClick={() => toggle(grps, setGrps, g.id)}>
                  {g.name}
                </MiniChip>
              ))}
            </FilterGroup>
          )}
          <FilterGroup label="Kategória">
            {categories.map((c) => (
              <MiniChip key={c.id} color={c.color} active={cats.has(c.id)} onClick={() => toggle(cats, setCats, c.id)}>
                {c.name}
              </MiniChip>
            ))}
          </FilterGroup>
          <FilterGroup label="Fizetési mód">
            {paymentMethods.map((p) => (
              <MiniChip key={p.id} color={p.color} active={pays.has(p.id)} onClick={() => toggle(pays, setPays, p.id)}>
                {p.name}
              </MiniChip>
            ))}
          </FilterGroup>
          {persons.length > 0 && (
            <FilterGroup label="Ki költötte">
              {persons.map((p) => (
                <MiniChip key={p.id} color={p.color} active={people.has(p.id)} onClick={() => toggle(people, setPeople, p.id)}>
                  {p.name}
                </MiniChip>
              ))}
            </FilterGroup>
          )}
          {projects.length > 0 && (
            <FilterGroup label="Projekt">
              {projects.map((p) => (
                <MiniChip key={p.id} color={p.color} active={projs.has(p.id)} onClick={() => toggle(projs, setProjs, p.id)}>
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

      {/* 12 hónap grafikon */}
      <section className="mt-6">
        <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
          Elmúlt 12 hónap
        </h2>
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <div className="flex items-center gap-4 mb-3 text-[11px] text-[var(--color-muted-foreground)]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-[var(--color-primary)]" /> Kiadás
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-sm bg-emerald-500" /> Bevétel
            </span>
          </div>
          <div className="flex items-end justify-between gap-1 h-40">
            {monthly.map((m) => {
              const active = month === m.k;
              return (
                <button
                  type="button"
                  key={m.k}
                  onClick={() => setMonth(active ? "all" : m.k)}
                  className="flex-1 flex flex-col items-center justify-end h-full gap-1 group"
                  title={`${monthLongFmt.format(monthKeyToDate(m.k))}\nKiadás: ${fmtFt(m.exp)}\nBevétel: ${fmtFt(m.inc)}`}
                >
                  <span className="text-[9px] tabular-nums text-[var(--color-muted-foreground)]">
                    {m.exp > 0 ? fmtShort(m.exp) : ""}
                  </span>
                  <div className="w-full flex items-end justify-center gap-[2px] h-full">
                    <span
                      className={cn(
                        "w-1/2 rounded-t-sm transition-all",
                        active ? "bg-[var(--color-primary)]" : "bg-[var(--color-primary)]/40 group-hover:bg-[var(--color-primary)]/60"
                      )}
                      style={{ height: `${Math.max(2, (m.exp / maxBar) * 100)}%` }}
                    />
                    <span
                      className="w-1/2 rounded-t-sm bg-emerald-500/70 transition-all"
                      style={{ height: `${Math.max(2, (m.inc / maxBar) * 100)}%` }}
                    />
                  </div>
                  <span className={cn("text-[9px] whitespace-nowrap", active ? "text-[var(--color-primary)] font-semibold" : "text-[var(--color-muted-foreground)]")}>
                    {monthShortFmt.format(monthKeyToDate(m.k)).replace(".", "")}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Top 3 az adott időszakra */}
      {totalExpense > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
            Top 3 · {month === "all" ? "12 hó" : monthLongFmt.format(monthKeyToDate(month))}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Top3Card title="Kategória" rows={top3.category} total={totalExpense} />
            <Top3Card title="Legnagyobb kiadás" rows={top3.expense} total={totalExpense} />
            <Top3Card title="Bolt / kinek" rows={top3.merchant} total={totalExpense} />
            <Top3Card title="Projekt" rows={top3.project} total={totalExpense} />
          </div>
        </section>
      )}

      {/* Megoszlás — pie chartok */}
      {totalExpense > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
            Megoszlás · {month === "all" ? "12 hó" : monthLongFmt.format(monthKeyToDate(month))}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <PieCard title="Kategóriánként" segments={pieCategory} />
            <PieCard title="Kiadásonként" segments={pieExpense} />
            <PieCard title="Bolt / kinek szerint" segments={pieMerchant} />
            <PieCard title="Projektenként" segments={pieProject} />
          </div>
        </section>
      )}

      {/* Legnagyobb kategóriák */}
      {topCategories.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
            Legnagyobb kiadási kategóriák
          </h2>
          <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
            {topCategories.map(({ cat, amount }, i) => {
              const col = catColor(cat?.color ?? "zinc");
              const pct = totalExpense ? (amount / totalExpense) * 100 : 0;
              const Icon = catIcon(cat?.icon ?? "tag");
              return (
                <div key={cat?.id ?? `none-${i}`}>
                  <div className="flex items-center justify-between text-sm mb-1">
                    <span className="flex items-center gap-2">
                      <span className={cn("w-6 h-6 rounded-lg flex items-center justify-center", col.soft, col.text)}>
                        <Icon className="w-3.5 h-3.5" />
                      </span>
                      {cat?.name ?? "Nincs kategória"}
                    </span>
                    <span className="tabular-nums font-medium">
                      {fmtFt(amount)}
                      <span className="text-[var(--color-muted-foreground)] font-normal"> · {Math.round(pct)}%</span>
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

      {/* Boltok / kinek szerint */}
      {byMerchant.length > 0 && (
        <BarBreakdown
          title="Boltok / kinek szerint"
          rows={byMerchant.slice(0, 8).map((m, i) => ({
            label: m.name,
            amount: m.amount,
            color: PALETTE[i % PALETTE.length],
          }))}
          total={totalExpense}
        />
      )}

      {/* Projektek szerint */}
      {byProject.some((p) => p.project) && (
        <BarBreakdown
          title="Projektek szerint"
          rows={byProject
            .filter((p) => p.project)
            .slice(0, 8)
            .map((p) => ({ label: p.project!.name, amount: p.amount, color: p.project!.color }))}
          total={totalExpense}
        />
      )}

      {/* Legnagyobb egyedi kiadások */}
      {biggest.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1 flex items-center gap-1.5">
            <Trophy className="w-3.5 h-3.5 text-amber-500" />
            Legnagyobb kiadások
          </h2>
          <ul className="space-y-2">
            {biggest.map((e) => {
              const cat = e.categoryId ? catById.get(e.categoryId) : null;
              const pay = e.paymentMethodId ? payById.get(e.paymentMethodId) : null;
              const person = e.personId ? personById.get(e.personId) : null;
              const project = e.projectId ? projectById.get(e.projectId) : null;
              const col = catColor(cat?.color ?? "zinc");
              const Icon = catIcon(cat?.icon ?? "tag");
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
                        {(e.nature ?? "avg") === "project" && (
                          <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)] shrink-0">
                            projekt
                          </span>
                        )}
                        {project && (
                          <span className={cn("inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[10px] font-medium shrink-0", catColor(project.color).soft, catColor(project.color).text)}>
                            {project.name}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate flex items-center gap-1.5">
                        <span>{cat?.name ?? "Nincs kategória"}</span>
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
                    <p className="font-semibold tabular-nums shrink-0">{fmtFt(e.amount)}</p>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {/* Tételek (Típus-szűrő + rendezés szerint) */}
      {listItems.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
            {kindF === "income" ? "Bevételek" : kindF === "expense" ? "Kiadások" : "Tételek"} (
            {listItems.length})
          </h2>
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
        </section>
      )}

      {/* Bevételek — külön szekció csak kiadás-szűrésnél */}
      {kindF === "expense" && scopedIncome.length > 0 && (
        <section className="mt-6">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1 flex items-center gap-1.5">
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            Bevételek · {fmtFt(scopedIncome.reduce((s, e) => s + e.amount, 0))}
          </h2>
          <ul className="space-y-2">
            {sortItems(scopedIncome).map((e) => {
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
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                        {cat?.name ?? "Bevétel"} · {dayFmt.format(new Date(e.spentAt))}
                        {person ? ` · ${person.name}` : ""}
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

      {scopedExpense.length === 0 && scopedIncome.length === 0 && (
        <div className="mt-8 flex flex-col items-center text-center py-10 text-[var(--color-muted-foreground)]">
          <TrendingUp className="w-8 h-8 mb-2" />
          <p className="text-sm">Nincs adat a kiválasztott időszakra / szűrőre.</p>
        </div>
      )}
    </div>
  );
}

function Top3Card({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; amount: number; color: string }[];
  total: number;
}) {
  const max = Math.max(1, ...rows.map((r) => r.amount));
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3.5">
      <p className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">
        {title}
      </p>
      {rows.length === 0 ? (
        <p className="text-xs text-[var(--color-muted-foreground)] py-2">—</p>
      ) : (
        <ol className="space-y-2">
          {rows.map((r, i) => {
            const col = catColor(r.color);
            return (
              <li key={i}>
                <div className="flex items-center justify-between text-[13px] mb-0.5 gap-2">
                  <span className="flex items-center gap-1.5 min-w-0">
                    <span className="text-[var(--color-muted-foreground)] tabular-nums">{i + 1}.</span>
                    <span className="truncate">{r.label}</span>
                  </span>
                  <span className="tabular-nums font-medium shrink-0">{fmtFt(r.amount)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                  <div className={cn("h-full rounded-full", col.dot)} style={{ width: `${(r.amount / max) * 100}%` }} />
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

function PieCard({ title, segments }: { title: string; segments: Seg[] }) {
  const total = segments.reduce((s, x) => s + x.value, 0);
  const r = 42;
  const C = 2 * Math.PI * r;
  let acc = 0;
  const arcs = segments.map((s) => {
    const dash = total ? (s.value / total) * C : 0;
    const arc = { ...s, dash, offset: acc };
    acc += dash;
    return arc;
  });
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <p className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-3">
        {title}
      </p>
      {total === 0 ? (
        <p className="text-xs text-[var(--color-muted-foreground)] py-4 text-center">Nincs adat.</p>
      ) : (
        <div className="flex items-center gap-4">
          <svg viewBox="0 0 100 100" className="w-24 h-24 shrink-0 -rotate-90">
            <circle cx="50" cy="50" r={r} fill="none" stroke="var(--color-muted)" strokeWidth="16" />
            {arcs.map((a, i) => (
              <circle
                key={i}
                cx="50"
                cy="50"
                r={r}
                fill="none"
                stroke={a.color}
                strokeWidth="16"
                strokeDasharray={`${a.dash} ${C - a.dash}`}
                strokeDashoffset={-a.offset}
              />
            ))}
          </svg>
          <ul className="flex-1 min-w-0 space-y-1 text-xs">
            {arcs.map((a, i) => (
              <li key={i} className="flex items-center justify-between gap-2">
                <span className="flex items-center gap-1.5 min-w-0">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: a.color }} />
                  <span className="truncate">{a.label}</span>
                </span>
                <span className="tabular-nums shrink-0 text-right">
                  <span className="font-medium">{fmtFt(a.value)}</span>
                  <span className="text-[var(--color-muted-foreground)]">
                    {" "}
                    · {Math.round((a.value / total) * 100)}%
                  </span>
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function BarBreakdown({
  title,
  rows,
  total,
}: {
  title: string;
  rows: { label: string; amount: number; color: string }[];
  total: number;
}) {
  return (
    <section className="mt-6">
      <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] mb-3 px-1">
        {title}
      </h2>
      <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 space-y-3">
        {rows.map((row, i) => {
          const col = catColor(row.color);
          const pct = total ? (row.amount / total) * 100 : 0;
          return (
            <div key={i}>
              <div className="flex items-center justify-between text-sm mb-1 gap-2">
                <span className="flex items-center gap-2 min-w-0">
                  <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", col.dot)} />
                  <span className="truncate">{row.label}</span>
                </span>
                <span className="tabular-nums font-medium shrink-0">
                  {fmtFt(row.amount)}
                  <span className="text-[var(--color-muted-foreground)] font-normal"> · {Math.round(pct)}%</span>
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
  );
}

function MonthChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "shrink-0 h-9 px-3.5 rounded-full text-sm font-medium border transition whitespace-nowrap",
        active ? "bg-[var(--color-primary)] text-white border-transparent" : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      {children}
    </button>
  );
}

function NatureChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex-1 h-9 rounded-full text-[13px] font-medium border transition",
        active ? "bg-[var(--color-primary)] text-white border-transparent" : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      {children}
    </button>
  );
}

function FilterGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function MiniChip({ color, active, onClick, children }: { color: string; active: boolean; onClick: () => void; children: React.ReactNode }) {
  const col = catColor(color);
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full pl-2 pr-2.5 h-8 text-[13px] font-medium border transition",
        active ? cn(col.soft, col.text, "border-transparent ring-1", col.ring) : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      <span className={cn("w-2 h-2 rounded-full", col.dot)} />
      {children}
    </button>
  );
}
