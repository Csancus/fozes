"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ColumnToggle, useColumnVisibility, type ColumnDef } from "@/components/ui/ColumnToggle";
import { cn } from "@/lib/cn";
import { catColor } from "@/lib/expense-visuals";
import { X, Search, Undo2, Trash2, SlidersHorizontal } from "lucide-react";
import { CategorySelect } from "../CategorySelect";
import { createIncomeCategoryInline } from "../actions";
import type {
  Expense,
  ExpenseCategory,
  ExpenseKind,
  PaymentMethod,
  Person,
  Project,
  ExpenseGroup,
} from "@/lib/types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

function toNum(v: string): number {
  return Number(v.replace(/\s/g, "").replace(",", "."));
}

// Hármas tagolás beviteli mezőhöz (mentéskor a szóközöket a szerver eltávolítja).
function groupDigits(s: string): string {
  const d = s.replace(/\D/g, "");
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
}

function tsToDay(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

const monthLabelFmt = new Intl.DateTimeFormat("hu-HU", {
  year: "numeric",
  month: "short",
});
function monthKeyToDate(k: string): Date {
  const [y, m] = k.split("-").map(Number);
  return new Date(y, (m || 1) - 1, 1);
}

type Row = {
  id: string;
  kind: ExpenseKind;
  amount: string;
  merchant: string;
  categoryId: string;
  paymentMethodId: string;
  personId: string;
  projectId: string;
  groupId: string;
  nature: string;
  review: boolean;
  planned: boolean;
  spentAt: string;
  note: string;
};

function toRow(e: Expense): Row {
  return {
    id: e.id,
    kind: e.kind ?? "expense",
    amount: groupDigits(String(e.amount)),
    merchant: e.merchant,
    categoryId: e.categoryId ?? "",
    paymentMethodId: e.paymentMethodId ?? "",
    personId: e.personId ?? "",
    projectId: e.projectId ?? "",
    groupId: e.groupId ?? "",
    nature: e.nature ?? "avg",
    review: e.review ?? false,
    planned: e.planned ?? false,
    spentAt: tsToDay(e.spentAt),
    note: e.note ?? "",
  };
}

function serialize(r: Row): string {
  return JSON.stringify([
    r.kind,
    r.amount.trim(),
    r.merchant.trim(),
    r.categoryId,
    r.paymentMethodId,
    r.personId,
    r.projectId,
    r.groupId,
    r.nature,
    r.review,
    r.planned,
    r.spentAt,
    r.note,
  ]);
}

const ctrl =
  "h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]";

const COL_W: Record<string, number> = {
  kind: 110,
  date: 140,
  amount: 110,
  merchant: 180,
  category: 160,
  nature: 130,
  payment: 150,
  person: 120,
  project: 130,
  group: 140,
  review: 120,
  planned: 100,
  note: 200,
};

export function ExpenseTable({
  action,
  expenses,
  categories,
  incomeCategories = [],
  paymentMethods,
  persons,
  projects,
  groups = [],
  merchantMap,
  knownMerchants,
}: {
  action: (fd: FormData) => void | Promise<void>;
  expenses: Expense[];
  categories: ExpenseCategory[];
  incomeCategories?: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  persons: Person[];
  projects: Project[];
  groups?: ExpenseGroup[];
  merchantMap: Record<string, string>;
  knownMerchants: string[];
}) {
  const allItems = expenses;

  // Elérhető oszlopok (a személy/projekt csak ha van ilyen adat).
  const allColumns: ColumnDef[] = useMemo(() => {
    const cols: ColumnDef[] = [
      { key: "kind", label: "Típus", alwaysOn: true },
      { key: "date", label: "Dátum" },
      { key: "merchant", label: "Megnevezés", alwaysOn: true },
      { key: "amount", label: "Összeg", alwaysOn: true },
      { key: "category", label: "Kategória" },
      { key: "nature", label: "Jelleg" },
      { key: "payment", label: "Fizetés" },
    ];
    if (persons.length) cols.push({ key: "person", label: "Ki(nek)" });
    if (projects.length) cols.push({ key: "project", label: "Projekt" });
    if (groups.length) cols.push({ key: "group", label: "Csoport" });
    cols.push({ key: "review", label: "Felülvizsgálat" });
    cols.push({ key: "planned", label: "Jövőbeni terv" });
    cols.push({ key: "note", label: "Megjegyzés" });
    return cols;
  }, [persons.length, projects.length, groups.length]);

  const { isVisible, hidden, toggle } = useColumnVisibility(
    "cols:koltsegek-tabla-v2",
    allColumns
  );

  const [catList, setCatList] = useState<ExpenseCategory[]>(categories);
  const [incomeCatList, setIncomeCatList] = useState<ExpenseCategory[]>(incomeCategories);
  const [rows, setRows] = useState<Row[]>(() => allItems.map(toRow));
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState<string>("all");
  const [search, setSearch] = useState("");
  const [showFilters, setShowFilters] = useState(false);
  const [kindF, setKindF] = useState<ExpenseKind | "all">("all");
  const [natureF, setNatureF] = useState<"all" | "avg" | "project">("all");
  const [reviewF, setReviewF] = useState(false);
  const [plannedF, setPlannedF] = useState<"all" | "planned" | "real">("all");
  const [cats, setCats] = useState<Set<string>>(new Set());
  const [pays, setPays] = useState<Set<string>>(new Set());
  const [people, setPeople] = useState<Set<string>>(new Set());
  const [projs, setProjs] = useState<Set<string>>(new Set());
  const [grps, setGrps] = useState<Set<string>>(new Set());

  function toggleSet(set: Set<string>, setter: (s: Set<string>) => void, id: string) {
    const next = new Set(set);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setter(next);
  }
  const filterCount =
    (kindF !== "all" ? 1 : 0) +
    (natureF !== "all" ? 1 : 0) +
    (reviewF ? 1 : 0) +
    (plannedF !== "all" ? 1 : 0) +
    cats.size +
    pays.size +
    people.size +
    projs.size +
    grps.size;

  const original = useMemo(() => {
    const m = new Map<string, string>();
    allItems.forEach((e) => m.set(e.id, serialize(toRow(e))));
    return m;
  }, [allItems]);

  const months = useMemo(() => {
    const set = new Set<string>();
    rows.forEach((r) => set.add(r.spentAt.slice(0, 7)));
    return [...set].filter(Boolean).sort().reverse();
  }, [rows]);

  function update(id: string, patch: Partial<Row>) {
    setRows((cur) =>
      cur.map((r) => {
        if (r.id !== id) return r;
        const next = { ...r, ...patch };
        // Típusváltáskor a kategória ürül (más a készlet), és a jelleg alap.
        if (patch.kind !== undefined && patch.kind !== r.kind) {
          next.categoryId = "";
          if (patch.kind === "income") next.nature = "avg";
        }
        if (next.kind === "expense" && patch.merchant !== undefined && !next.categoryId) {
          const mapped = merchantMap[slugify(patch.merchant)];
          if (mapped && catList.some((c) => c.id === mapped)) {
            next.categoryId = mapped;
          }
        }
        return next;
      })
    );
  }

  function markDeleted(id: string) {
    setDeleted((cur) => new Set(cur).add(id));
  }
  function undoDelete(id: string) {
    setDeleted((cur) => {
      const n = new Set(cur);
      n.delete(id);
      return n;
    });
  }

  const q = search.trim().toLowerCase();
  const visible = rows.filter((r) => {
    if (month !== "all" && r.spentAt.slice(0, 7) !== month) return false;
    if (kindF !== "all" && (r.kind ?? "expense") !== kindF) return false;
    if (natureF !== "all" && !((r.kind ?? "expense") === "expense" && r.nature === natureF)) return false;
    if (reviewF && !r.review) return false;
    if (plannedF === "planned" && !r.planned) return false;
    if (plannedF === "real" && r.planned) return false;
    if (cats.size && !(r.categoryId && cats.has(r.categoryId))) return false;
    if (pays.size && !(r.paymentMethodId && pays.has(r.paymentMethodId))) return false;
    if (people.size && !(r.personId && people.has(r.personId))) return false;
    if (projs.size && !(r.projectId && projs.has(r.projectId))) return false;
    if (grps.size && !(r.groupId && grps.has(r.groupId))) return false;
    if (q && !r.merchant.toLowerCase().includes(q)) return false;
    return true;
  });

  const dirty = rows.filter(
    (r) => !deleted.has(r.id) && serialize(r) !== original.get(r.id)
  );
  const validDirty = dirty.filter(
    (r) => toNum(r.amount) > 0 && r.merchant.trim()
  );
  const changeCount = validDirty.length + deleted.size;

  const payload = JSON.stringify(
    validDirty.map((r) => ({
      id: r.id,
      kind: r.kind,
      amount: r.amount,
      merchant: r.merchant,
      categoryId: r.categoryId,
      paymentMethodId: r.paymentMethodId,
      personId: r.personId,
      projectId: r.projectId,
      groupId: r.groupId,
      nature: r.nature,
      review: r.review,
      planned: r.planned,
      spentAt: r.spentAt,
      note: r.note,
    }))
  );
  const deletedPayload = JSON.stringify([...deleted]);

  const showPerson = persons.length > 0 && isVisible("person");
  const showProject = projects.length > 0 && isVisible("project");
  const showGroup = groups.length > 0 && isVisible("group");
  const minW =
    40 +
    allColumns.reduce((s, c) => s + (isVisible(c.key) ? COL_W[c.key] ?? 120 : 0), 0);

  const visibleTotal = visible
    .filter((r) => !deleted.has(r.id))
    .reduce(
      (s, r) => s + (r.kind === "income" ? 1 : -1) * (toNum(r.amount) || 0),
      0
    );

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="rows" value={payload} />
      <input type="hidden" name="deletedIds" value={deletedPayload} />

      <datalist id="table-merchants">
        {knownMerchants.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      {/* Szűrők */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setShowFilters((v) => !v)}
          className="shrink-0 inline-flex items-center gap-2 h-10 px-3 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Szűrők
          {filterCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-5 h-5 px-1.5 rounded-full bg-[var(--color-primary)] text-white text-[11px]">
              {filterCount}
            </span>
          )}
        </button>
        <div className="relative flex-1 min-w-[160px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Keresés (megnevezés)…"
            className="w-full h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          />
        </div>
        <ColumnToggle columns={allColumns} hidden={hidden} onToggle={toggle} />
      </div>

      <div className="mt-2 flex gap-2 overflow-x-auto pb-1">
        <MonthChip active={month === "all"} onClick={() => setMonth("all")}>
          Összes
        </MonthChip>
        {months.map((m) => (
          <MonthChip key={m} active={month === m} onClick={() => setMonth(m)}>
            {monthLabelFmt.format(monthKeyToDate(m))}
          </MonthChip>
        ))}
      </div>

      {showFilters && (
        <div className="mt-3 space-y-4 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
          <TChipGroup label="Típus">
            {(["all", "expense", "income"] as const).map((k) => (
              <TChip key={k} active={kindF === k} onClick={() => setKindF(k)}>
                {k === "all" ? "Mind" : k === "expense" ? "Kiadás" : "Bevétel"}
              </TChip>
            ))}
          </TChipGroup>
          <TChipGroup label="Jelleg">
            {(["all", "avg", "project"] as const).map((n) => (
              <TChip key={n} active={natureF === n} onClick={() => setNatureF(n)}>
                {n === "all" ? "Mind" : n === "avg" ? "Havi átlagos" : "Eseti projekt"}
              </TChip>
            ))}
          </TChipGroup>
          <TChipGroup label="Felülvizsgálat">
            <TChip active={!reviewF} onClick={() => setReviewF(false)}>
              Mind
            </TChip>
            <TChip active={reviewF} onClick={() => setReviewF(true)}>
              Csak felülvizsgálandó
            </TChip>
          </TChipGroup>
          <TChipGroup label="Jövőbeni terv">
            {(["all", "real", "planned"] as const).map((p) => (
              <TChip key={p} active={plannedF === p} onClick={() => setPlannedF(p)}>
                {p === "all" ? "Mind" : p === "real" ? "Csak valós" : "Csak terv"}
              </TChip>
            ))}
          </TChipGroup>
          {(categories.length > 0 || incomeCategories.length > 0) && (
            <TChipGroup label="Kategória">
              {[...categories, ...incomeCategories].map((c) => (
                <DotChip key={c.id} color={c.color} active={cats.has(c.id)} onClick={() => toggleSet(cats, setCats, c.id)}>
                  {c.name}
                </DotChip>
              ))}
            </TChipGroup>
          )}
          {paymentMethods.length > 0 && (
            <TChipGroup label="Fizetés">
              {paymentMethods.map((p) => (
                <DotChip key={p.id} color={p.color} active={pays.has(p.id)} onClick={() => toggleSet(pays, setPays, p.id)}>
                  {p.name}
                </DotChip>
              ))}
            </TChipGroup>
          )}
          {persons.length > 0 && (
            <TChipGroup label="Ki(nek)">
              {persons.map((p) => (
                <DotChip key={p.id} color={p.color} active={people.has(p.id)} onClick={() => toggleSet(people, setPeople, p.id)}>
                  {p.name}
                </DotChip>
              ))}
            </TChipGroup>
          )}
          {projects.length > 0 && (
            <TChipGroup label="Projekt">
              {projects.map((p) => (
                <DotChip key={p.id} color={p.color} active={projs.has(p.id)} onClick={() => toggleSet(projs, setProjs, p.id)}>
                  {p.name}
                </DotChip>
              ))}
            </TChipGroup>
          )}
          {groups.length > 0 && (
            <TChipGroup label="Csoport">
              {groups.map((g) => (
                <DotChip key={g.id} color={g.color} active={grps.has(g.id)} onClick={() => toggleSet(grps, setGrps, g.id)}>
                  {g.name}
                </DotChip>
              ))}
            </TChipGroup>
          )}
          {filterCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setKindF("all");
                setNatureF("all");
                setReviewF(false);
                setCats(new Set());
                setPays(new Set());
                setPeople(new Set());
                setProjs(new Set());
                setGrps(new Set());
              }}
              className="text-sm text-[var(--color-primary)] font-medium"
            >
              Szűrők törlése
            </button>
          )}
        </div>
      )}

      <div className="mt-4 overflow-x-auto -mx-5 px-5">
        <table
          className="w-full border-separate border-spacing-x-1.5 border-spacing-y-1.5"
          style={{ minWidth: `${minW}px` }}
        >
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              <th className="font-semibold px-1 w-28">Típus</th>
              {isVisible("date") && <th className="font-semibold px-1 w-36">Dátum</th>}
              <th className="font-semibold px-1">Megnevezés</th>
              <th className="font-semibold px-1 w-28">Összeg</th>
              {isVisible("category") && <th className="font-semibold px-1 w-40">Kategória</th>}
              {isVisible("nature") && <th className="font-semibold px-1 w-32">Jelleg</th>}
              {isVisible("payment") && <th className="font-semibold px-1 w-36">Fizetés</th>}
              {showPerson && <th className="font-semibold px-1 w-28">Ki(nek)</th>}
              {showProject && <th className="font-semibold px-1 w-32">Projekt</th>}
              {showGroup && <th className="font-semibold px-1 w-36">Csoport</th>}
              {isVisible("review") && <th className="font-semibold px-1 w-28 text-center">Felülvizsg.</th>}
              {isVisible("planned") && <th className="font-semibold px-1 w-24 text-center">Terv</th>}
              {isVisible("note") && <th className="font-semibold px-1 w-48">Megjegyzés</th>}
              <th className="w-7" />
            </tr>
          </thead>
          <tbody>
            {visible.map((r) => {
              const isDeleted = deleted.has(r.id);
              const isDirty =
                !isDeleted && serialize(r) !== original.get(r.id);
              return (
                <tr
                  key={r.id}
                  className={cn(
                    "align-top",
                    isDeleted && "opacity-40",
                    r.planned && !isDeleted && "bg-indigo-500/[0.06]",
                    isDirty && "ring-1 ring-[var(--color-primary)]/30 rounded-lg"
                  )}
                >
                  <td>
                    <select
                      value={r.kind}
                      disabled={isDeleted}
                      onChange={(e) => update(r.id, { kind: e.target.value as ExpenseKind })}
                      className={cn(
                        ctrl,
                        "appearance-none font-medium",
                        r.kind === "income" && "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      <option value="expense">Kiadás</option>
                      <option value="income">Bevétel</option>
                    </select>
                  </td>
                  {isVisible("date") && (
                    <td>
                      <input
                        type="date"
                        value={r.spentAt}
                        disabled={isDeleted}
                        onChange={(e) => update(r.id, { spentAt: e.target.value })}
                        className={ctrl}
                      />
                    </td>
                  )}
                  <td>
                    <input
                      value={r.merchant}
                      disabled={isDeleted}
                      onChange={(e) => update(r.id, { merchant: e.target.value })}
                      list="table-merchants"
                      className={ctrl}
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      value={r.amount}
                      disabled={isDeleted}
                      onChange={(e) =>
                        update(r.id, { amount: groupDigits(e.target.value) })
                      }
                      className={cn(ctrl, "tabular-nums font-medium")}
                    />
                  </td>
                  {isVisible("category") && (
                    <td>
                      <CategorySelect
                        categories={r.kind === "income" ? incomeCatList : catList}
                        value={r.categoryId}
                        onChange={(id) => update(r.id, { categoryId: id })}
                        onCreated={(c) =>
                          r.kind === "income"
                            ? setIncomeCatList((cur) => [...cur, c])
                            : setCatList((cur) => [...cur, c])
                        }
                        createFn={r.kind === "income" ? createIncomeCategoryInline : undefined}
                        className={cn(ctrl, "appearance-none", isDeleted && "pointer-events-none")}
                      />
                    </td>
                  )}
                  {isVisible("nature") && (
                    <td>
                      {r.kind === "income" ? (
                        <div className={cn(ctrl, "flex items-center text-[var(--color-muted-foreground)]")}>—</div>
                      ) : (
                        <select
                          value={r.nature}
                          disabled={isDeleted}
                          onChange={(e) => update(r.id, { nature: e.target.value })}
                          className={cn(ctrl, "appearance-none")}
                        >
                          <option value="avg">Havi átlagos</option>
                          <option value="project">Eseti projekt</option>
                        </select>
                      )}
                    </td>
                  )}
                  {isVisible("payment") && (
                    <td>
                      <select
                        value={r.paymentMethodId}
                        disabled={isDeleted}
                        onChange={(e) =>
                          update(r.id, { paymentMethodId: e.target.value })
                        }
                        className={cn(ctrl, "appearance-none")}
                      >
                        <option value="">—</option>
                        {paymentMethods.map((pm) => (
                          <option key={pm.id} value={pm.id}>
                            {pm.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {showPerson && (
                    <td>
                      <select
                        value={r.personId}
                        disabled={isDeleted}
                        onChange={(e) =>
                          update(r.id, { personId: e.target.value })
                        }
                        className={cn(ctrl, "appearance-none")}
                      >
                        <option value="">—</option>
                        {persons.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {showProject && (
                    <td>
                      <select
                        value={r.projectId}
                        disabled={isDeleted}
                        onChange={(e) =>
                          update(r.id, { projectId: e.target.value })
                        }
                        className={cn(ctrl, "appearance-none")}
                      >
                        <option value="">—</option>
                        {projects.map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {showGroup && (
                    <td>
                      <select
                        value={r.groupId}
                        disabled={isDeleted}
                        onChange={(e) => update(r.id, { groupId: e.target.value })}
                        className={cn(ctrl, "appearance-none")}
                      >
                        <option value="">—</option>
                        {groups.map((g) => (
                          <option key={g.id} value={g.id}>
                            {g.name}
                          </option>
                        ))}
                      </select>
                    </td>
                  )}
                  {isVisible("review") && (
                    <td>
                      <div className={cn(ctrl, "flex items-center justify-center")}>
                        <input
                          type="checkbox"
                          checked={r.review}
                          disabled={isDeleted}
                          onChange={(e) => update(r.id, { review: e.target.checked })}
                          className="w-4 h-4 accent-amber-500"
                          aria-label="Felülvizsgálat"
                        />
                      </div>
                    </td>
                  )}
                  {isVisible("planned") && (
                    <td>
                      <div className={cn(ctrl, "flex items-center justify-center")}>
                        <input
                          type="checkbox"
                          checked={r.planned}
                          disabled={isDeleted}
                          onChange={(e) => update(r.id, { planned: e.target.checked })}
                          className="w-4 h-4 accent-indigo-500"
                          aria-label="Jövőbeni terv"
                        />
                      </div>
                    </td>
                  )}
                  {isVisible("note") && (
                    <td>
                      <input
                        value={r.note}
                        disabled={isDeleted}
                        onChange={(e) => update(r.id, { note: e.target.value })}
                        placeholder="Megjegyzés"
                        className={ctrl}
                      />
                    </td>
                  )}
                  <td className="pt-0.5">
                    {isDeleted ? (
                      <button
                        type="button"
                        onClick={() => undoDelete(r.id)}
                        className="h-9 w-7 flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)]"
                        aria-label="Törlés visszavonása"
                      >
                        <Undo2 className="w-4 h-4" />
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => markDeleted(r.id)}
                        className="h-9 w-7 flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-red-600"
                        aria-label="Törlés"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {visible.length === 0 && (
        <p className="py-10 text-center text-sm text-[var(--color-muted-foreground)]">
          Nincs a szűrőnek megfelelő tétel.
        </p>
      )}

      <div className="mt-6 sticky bottom-0 -mx-5 px-5 py-3 bg-[var(--color-background)]/95 backdrop-blur-md border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-semibold tabular-nums">
              egyenleg {visibleTotal >= 0 ? "+" : ""}{fmtFt(visibleTotal)}
            </span>
            <span className="text-[var(--color-muted-foreground)]">
              {" "}
              · {visible.filter((r) => !deleted.has(r.id)).length} tétel
              {deleted.size > 0 && (
                <span className="text-red-600">
                  {" "}
                  · {deleted.size} törlésre
                </span>
              )}
            </span>
          </div>
          <SubmitButton
            disabled={changeCount === 0}
            leftIcon={
              deleted.size > 0 ? <Trash2 className="w-4 h-4" /> : undefined
            }
          >
            {changeCount === 0
              ? "Nincs változás"
              : `${changeCount} változás mentése`}
          </SubmitButton>
        </div>
      </div>
    </form>
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

function TChipGroup({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs font-medium text-[var(--color-muted-foreground)] mb-1.5">{label}</p>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function TChip({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "h-8 px-3 rounded-full text-[13px] font-medium border transition",
        active
          ? "bg-[var(--color-primary)] text-white border-transparent"
          : "border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      {children}
    </button>
  );
}

function DotChip({
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
