"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ColumnToggle, useColumnVisibility, type ColumnDef } from "@/components/ui/ColumnToggle";
import { cn } from "@/lib/cn";
import { X, Search, Undo2, Trash2 } from "lucide-react";
import { CategorySelect } from "../CategorySelect";
import type {
  Expense,
  ExpenseCategory,
  PaymentMethod,
  Person,
  Project,
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
  amount: string;
  merchant: string;
  categoryId: string;
  paymentMethodId: string;
  personId: string;
  projectId: string;
  nature: string;
  spentAt: string;
  note: string;
};

function toRow(e: Expense): Row {
  return {
    id: e.id,
    amount: String(e.amount),
    merchant: e.merchant,
    categoryId: e.categoryId ?? "",
    paymentMethodId: e.paymentMethodId ?? "",
    personId: e.personId ?? "",
    projectId: e.projectId ?? "",
    nature: e.nature ?? "avg",
    spentAt: tsToDay(e.spentAt),
    note: e.note ?? "",
  };
}

function serialize(r: Row): string {
  return JSON.stringify([
    r.amount.trim(),
    r.merchant.trim(),
    r.categoryId,
    r.paymentMethodId,
    r.personId,
    r.projectId,
    r.nature,
    r.spentAt,
    r.note,
  ]);
}

const ctrl =
  "h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]";

const COL_W: Record<string, number> = {
  date: 140,
  amount: 110,
  merchant: 180,
  category: 160,
  nature: 130,
  payment: 150,
  person: 120,
  project: 130,
  note: 200,
};

export function ExpenseTable({
  action,
  expenses,
  categories,
  paymentMethods,
  persons,
  projects,
  merchantMap,
  knownMerchants,
}: {
  action: (fd: FormData) => void | Promise<void>;
  expenses: Expense[];
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  persons: Person[];
  projects: Project[];
  merchantMap: Record<string, string>;
  knownMerchants: string[];
}) {
  const expenseItems = useMemo(
    () => expenses.filter((e) => (e.kind ?? "expense") !== "income"),
    [expenses]
  );

  // Elérhető oszlopok (a személy/projekt csak ha van ilyen adat).
  const allColumns: ColumnDef[] = useMemo(() => {
    const cols: ColumnDef[] = [
      { key: "date", label: "Dátum" },
      { key: "amount", label: "Összeg", alwaysOn: true },
      { key: "merchant", label: "Bolt / kinek", alwaysOn: true },
      { key: "category", label: "Kategória" },
      { key: "nature", label: "Jelleg" },
      { key: "payment", label: "Fizetés" },
    ];
    if (persons.length) cols.push({ key: "person", label: "Ki", defaultHidden: true });
    if (projects.length) cols.push({ key: "project", label: "Projekt", defaultHidden: true });
    cols.push({ key: "note", label: "Megjegyzés", defaultHidden: true });
    return cols;
  }, [persons.length, projects.length]);

  const { isVisible, hidden, toggle } = useColumnVisibility(
    "cols:koltsegek-tabla",
    allColumns
  );

  const [catList, setCatList] = useState<ExpenseCategory[]>(categories);
  const [rows, setRows] = useState<Row[]>(() => expenseItems.map(toRow));
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [month, setMonth] = useState<string>("all");
  const [search, setSearch] = useState("");

  const original = useMemo(() => {
    const m = new Map<string, string>();
    expenseItems.forEach((e) => m.set(e.id, serialize(toRow(e))));
    return m;
  }, [expenseItems]);

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
        if (patch.merchant !== undefined && !next.categoryId) {
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
      amount: r.amount,
      merchant: r.merchant,
      categoryId: r.categoryId,
      paymentMethodId: r.paymentMethodId,
      personId: r.personId,
      projectId: r.projectId,
      nature: r.nature,
      spentAt: r.spentAt,
      note: r.note,
    }))
  );
  const deletedPayload = JSON.stringify([...deleted]);

  const showPerson = persons.length > 0 && isVisible("person");
  const showProject = projects.length > 0 && isVisible("project");
  const minW =
    40 +
    allColumns.reduce((s, c) => s + (isVisible(c.key) ? COL_W[c.key] ?? 120 : 0), 0);

  const visibleTotal = visible
    .filter((r) => !deleted.has(r.id))
    .reduce((s, r) => s + (toNum(r.amount) || 0), 0);

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
        <div className="relative flex-1 min-w-[180px]">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)]" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Bolt keresése…"
            className="w-full h-10 rounded-xl border border-[var(--color-input)] bg-[var(--color-background)] pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)]"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-1">
          <MonthChip active={month === "all"} onClick={() => setMonth("all")}>
            Összes
          </MonthChip>
          {months.map((m) => (
            <MonthChip key={m} active={month === m} onClick={() => setMonth(m)}>
              {monthLabelFmt.format(monthKeyToDate(m))}
            </MonthChip>
          ))}
        </div>
        <ColumnToggle columns={allColumns} hidden={hidden} onToggle={toggle} />
      </div>

      <div className="mt-4 overflow-x-auto -mx-5 px-5">
        <table
          className="w-full border-separate border-spacing-x-1.5 border-spacing-y-1.5"
          style={{ minWidth: `${minW}px` }}
        >
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              {isVisible("date") && <th className="font-semibold px-1 w-36">Dátum</th>}
              <th className="font-semibold px-1 w-28">Összeg</th>
              <th className="font-semibold px-1">Bolt / kinek</th>
              {isVisible("category") && <th className="font-semibold px-1 w-40">Kategória</th>}
              {isVisible("nature") && <th className="font-semibold px-1 w-32">Jelleg</th>}
              {isVisible("payment") && <th className="font-semibold px-1 w-36">Fizetés</th>}
              {showPerson && <th className="font-semibold px-1 w-28">Ki</th>}
              {showProject && <th className="font-semibold px-1 w-32">Projekt</th>}
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
                    isDirty && "ring-1 ring-[var(--color-primary)]/30 rounded-lg"
                  )}
                >
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
                      inputMode="numeric"
                      value={r.amount}
                      disabled={isDeleted}
                      onChange={(e) => update(r.id, { amount: e.target.value })}
                      className={cn(ctrl, "tabular-nums font-medium")}
                    />
                  </td>
                  <td>
                    <input
                      value={r.merchant}
                      disabled={isDeleted}
                      onChange={(e) => update(r.id, { merchant: e.target.value })}
                      list="table-merchants"
                      className={ctrl}
                    />
                  </td>
                  {isVisible("category") && (
                    <td>
                      <CategorySelect
                        categories={catList}
                        value={r.categoryId}
                        onChange={(id) => update(r.id, { categoryId: id })}
                        onCreated={(c) => setCatList((cur) => [...cur, c])}
                        className={cn(ctrl, "appearance-none", isDeleted && "pointer-events-none")}
                      />
                    </td>
                  )}
                  {isVisible("nature") && (
                    <td>
                      <select
                        value={r.nature}
                        disabled={isDeleted}
                        onChange={(e) => update(r.id, { nature: e.target.value })}
                        className={cn(ctrl, "appearance-none")}
                      >
                        <option value="avg">Havi átlagos</option>
                        <option value="project">Eseti projekt</option>
                      </select>
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
              {fmtFt(visibleTotal)}
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
