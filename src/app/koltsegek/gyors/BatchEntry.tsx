"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { ColumnToggle, useColumnVisibility, type ColumnDef } from "@/components/ui/ColumnToggle";
import { cn } from "@/lib/cn";
import { Plus, X, CopyPlus } from "lucide-react";
import { CategorySelect } from "../CategorySelect";
import type {
  ExpenseCategory,
  ExpenseKind,
  PaymentMethod,
  Person,
  Project,
  ExpenseGroup,
} from "@/lib/types";
import {
  createCategoryInline,
  createIncomeCategoryInline,
} from "../actions";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

function toNum(v: string): number {
  return Number(v.replace(/\s/g, "").replace(",", "."));
}

type Row = {
  key: string;
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
  recurring: boolean;
  spentAt: string;
  note: string;
};

let counter = 0;
function emptyRow(kind: ExpenseKind = "expense"): Row {
  counter += 1;
  return {
    key: `r${counter}`,
    kind,
    amount: "",
    merchant: "",
    categoryId: "",
    paymentMethodId: "",
    personId: "",
    projectId: "",
    groupId: "",
    nature: "avg",
    review: false,
    recurring: false,
    spentAt: todayStr(),
    note: "",
  };
}

const ctrl =
  "h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]";

const COL_W: Record<string, number> = {
  kind: 110,
  amount: 110,
  merchant: 180,
  category: 160,
  nature: 130,
  payment: 150,
  person: 120,
  project: 130,
  group: 140,
  review: 120,
  recurring: 120,
  date: 150,
  note: 200,
};

export function BatchEntry({
  action,
  categories,
  incomeCategories = [],
  paymentMethods,
  persons,
  projects,
  groups = [],
  merchantMap,
  knownMerchants,
  initialRows,
}: {
  action: (fd: FormData) => void | Promise<void>;
  categories: ExpenseCategory[];
  incomeCategories?: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  persons: Person[];
  projects: Project[];
  groups?: ExpenseGroup[];
  merchantMap: Record<string, string>;
  knownMerchants: string[];
  initialRows?: Array<Partial<Omit<Row, "key">>>;
}) {
  const [catList, setCatList] = useState<ExpenseCategory[]>(categories);
  const [incomeCatList, setIncomeCatList] =
    useState<ExpenseCategory[]>(incomeCategories);
  const [rows, setRows] = useState<Row[]>(() => {
    if (initialRows && initialRows.length) {
      return initialRows.map((seed) => ({
        ...emptyRow((seed.kind as ExpenseKind) ?? "expense"),
        ...seed,
      }));
    }
    return [emptyRow(), emptyRow(), emptyRow(), emptyRow(), emptyRow()];
  });

  const allColumns: ColumnDef[] = useMemo(() => {
    const cols: ColumnDef[] = [
      { key: "kind", label: "Típus", alwaysOn: true },
      { key: "merchant", label: "Megnevezés", alwaysOn: true },
      { key: "amount", label: "Összeg", alwaysOn: true },
      { key: "category", label: "Kategória" },
      { key: "nature", label: "Jelleg" },
      { key: "payment", label: "Fizetés" },
    ];
    if (persons.length) cols.push({ key: "person", label: "Ki" });
    if (projects.length) cols.push({ key: "project", label: "Projekt" });
    if (groups.length) cols.push({ key: "group", label: "Csoport" });
    cols.push({ key: "review", label: "Felülvizsgálat" });
    cols.push({ key: "recurring", label: "Ismétlődő" });
    cols.push({ key: "date", label: "Dátum" });
    cols.push({ key: "note", label: "Megjegyzés" });
    return cols;
  }, [persons.length, projects.length, groups.length]);

  const { isVisible, hidden, toggle } = useColumnVisibility(
    "cols:gyors-unified-v2",
    allColumns
  );

  function update(key: string, patch: Partial<Row>) {
    setRows((cur) =>
      cur.map((r) => {
        if (r.key !== key) return r;
        const next = { ...r, ...patch };
        if (
          next.kind === "expense" &&
          patch.merchant !== undefined &&
          !next.categoryId
        ) {
          const mapped = merchantMap[slugify(patch.merchant)];
          if (mapped && catList.some((c) => c.id === mapped)) {
            next.categoryId = mapped;
          }
        }
        // Típusváltáskor a kategória ürül (más a készlet).
        if (patch.kind !== undefined && patch.kind !== r.kind) {
          next.categoryId = "";
        }
        return next;
      })
    );
  }

  function removeRow(key: string) {
    setRows((cur) => (cur.length > 1 ? cur.filter((r) => r.key !== key) : cur));
  }

  function addRow() {
    setRows((cur) => [...cur, emptyRow(cur[cur.length - 1]?.kind ?? "expense")]);
  }

  function addRowLikeLast() {
    setRows((cur) => {
      const last = cur[cur.length - 1];
      const r = emptyRow(last?.kind ?? "expense");
      if (last) {
        r.spentAt = last.spentAt;
        r.paymentMethodId = last.paymentMethodId;
        r.personId = last.personId;
        r.projectId = last.projectId;
        r.nature = last.nature;
      }
      return [...cur, r];
    });
  }

  const valid = useMemo(
    () => rows.filter((r) => toNum(r.amount) > 0 && r.merchant.trim()),
    [rows]
  );
  const expenseTotal = valid
    .filter((r) => r.kind === "expense")
    .reduce((s, r) => s + toNum(r.amount), 0);
  const incomeTotal = valid
    .filter((r) => r.kind === "income")
    .reduce((s, r) => s + toNum(r.amount), 0);

  const payload = JSON.stringify(
    valid.map((r) => ({
      kind: r.kind,
      amount: r.amount,
      merchant: r.merchant,
      categoryId: r.categoryId,
      paymentMethodId: r.kind === "income" ? "" : r.paymentMethodId,
      personId: r.personId,
      projectId: r.kind === "income" ? "" : r.projectId,
      nature: r.kind === "income" ? "avg" : r.nature,
      review: r.review,
      recurring: r.recurring,
      groupId: r.groupId,
      spentAt: r.spentAt,
      note: r.note,
    }))
  );

  const showPerson = persons.length > 0 && isVisible("person");
  const showProject = projects.length > 0 && isVisible("project");
  const showGroup = groups.length > 0 && isVisible("group");

  const minW =
    64 +
    allColumns.reduce((s, c) => s + (isVisible(c.key) ? COL_W[c.key] ?? 120 : 0), 0);

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="rows" value={payload} />

      <datalist id="batch-merchants">
        {knownMerchants.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="flex justify-end mb-2">
        <ColumnToggle columns={allColumns} hidden={hidden} onToggle={toggle} />
      </div>

      <div className="overflow-x-auto -mx-5 px-5">
        <table
          className="w-full border-separate border-spacing-x-1.5 border-spacing-y-1.5"
          style={{ minWidth: `${minW}px` }}
        >
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              <th className="font-semibold w-7" />
              <th className="font-semibold px-1 w-28">Típus</th>
              <th className="font-semibold px-1">Megnevezés</th>
              <th className="font-semibold px-1 w-28">Összeg</th>
              {isVisible("category") && <th className="font-semibold px-1 w-40">Kategória</th>}
              {isVisible("nature") && <th className="font-semibold px-1 w-32">Jelleg</th>}
              {isVisible("payment") && <th className="font-semibold px-1 w-36">Fizetés</th>}
              {showPerson && <th className="font-semibold px-1 w-28">Ki</th>}
              {showProject && <th className="font-semibold px-1 w-32">Projekt</th>}
              {showGroup && <th className="font-semibold px-1 w-36">Csoport</th>}
              {isVisible("review") && <th className="font-semibold px-1 w-28 text-center">Felülvizsg.</th>}
              {isVisible("recurring") && <th className="font-semibold px-1 w-28 text-center">Ismétlődő</th>}
              {isVisible("date") && <th className="font-semibold px-1 w-36">Dátum</th>}
              {isVisible("note") && <th className="font-semibold px-1 w-48">Megjegyzés</th>}
              <th className="w-7" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => {
              const inc = r.kind === "income";
              const rowCats = inc ? incomeCatList : catList;
              return (
                <tr key={r.key} className="align-top">
                  <td className="text-xs text-[var(--color-muted-foreground)] tabular-nums pt-2">
                    {i + 1}.
                  </td>
                  <td>
                    <select
                      value={r.kind}
                      onChange={(e) => update(r.key, { kind: e.target.value as ExpenseKind })}
                      className={cn(
                        ctrl,
                        "appearance-none font-medium",
                        inc && "text-emerald-600 dark:text-emerald-400"
                      )}
                    >
                      <option value="expense">Kiadás</option>
                      <option value="income">Bevétel</option>
                    </select>
                  </td>
                  <td>
                    <input
                      value={r.merchant}
                      onChange={(e) => update(r.key, { merchant: e.target.value })}
                      list="batch-merchants"
                      placeholder={inc ? "pl. Munkahely" : "pl. Lidl"}
                      className={ctrl}
                    />
                  </td>
                  <td>
                    <input
                      inputMode="decimal"
                      value={r.amount}
                      onChange={(e) =>
                        update(r.key, {
                          amount: e.target.value.replace(/[^\d.,\s]/g, ""),
                        })
                      }
                      placeholder="0"
                      className={cn(ctrl, "tabular-nums font-medium")}
                    />
                  </td>
                  {isVisible("category") && (
                    <td>
                      <CategorySelect
                        categories={rowCats}
                        value={r.categoryId}
                        onChange={(id) => update(r.key, { categoryId: id })}
                        onCreated={(c) =>
                          inc
                            ? setIncomeCatList((cur) => [...cur, c])
                            : setCatList((cur) => [...cur, c])
                        }
                        className={cn(ctrl, "appearance-none")}
                      />
                    </td>
                  )}
                  {isVisible("nature") && (
                    <td>
                      {inc ? (
                        <div className={cn(ctrl, "flex items-center text-[var(--color-muted-foreground)]")}>—</div>
                      ) : (
                        <select
                          value={r.nature}
                          onChange={(e) => update(r.key, { nature: e.target.value })}
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
                      {inc ? (
                        <div className={cn(ctrl, "flex items-center text-[var(--color-muted-foreground)]")}>—</div>
                      ) : (
                        <select
                          value={r.paymentMethodId}
                          onChange={(e) => update(r.key, { paymentMethodId: e.target.value })}
                          className={cn(ctrl, "appearance-none")}
                        >
                          <option value="">—</option>
                          {paymentMethods.map((pm) => (
                            <option key={pm.id} value={pm.id}>
                              {pm.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  )}
                  {showPerson && (
                    <td>
                      <select
                        value={r.personId}
                        onChange={(e) => update(r.key, { personId: e.target.value })}
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
                      {inc ? (
                        <div className={cn(ctrl, "flex items-center text-[var(--color-muted-foreground)]")}>—</div>
                      ) : (
                        <select
                          value={r.projectId}
                          onChange={(e) => update(r.key, { projectId: e.target.value })}
                          className={cn(ctrl, "appearance-none")}
                        >
                          <option value="">—</option>
                          {projects.map((p) => (
                            <option key={p.id} value={p.id}>
                              {p.name}
                            </option>
                          ))}
                        </select>
                      )}
                    </td>
                  )}
                  {showGroup && (
                    <td>
                      <select
                        value={r.groupId}
                        onChange={(e) => update(r.key, { groupId: e.target.value })}
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
                          onChange={(e) => update(r.key, { review: e.target.checked })}
                          className="w-4 h-4 accent-amber-500"
                          aria-label="Felülvizsgálat"
                        />
                      </div>
                    </td>
                  )}
                  {isVisible("recurring") && (
                    <td>
                      <div className={cn(ctrl, "flex items-center justify-center")}>
                        <input
                          type="checkbox"
                          checked={r.recurring}
                          onChange={(e) => update(r.key, { recurring: e.target.checked })}
                          className="w-4 h-4 accent-[var(--color-primary)]"
                          aria-label="Ismétlődő havonta"
                        />
                      </div>
                    </td>
                  )}
                  {isVisible("date") && (
                    <td>
                      <input
                        type="date"
                        value={r.spentAt}
                        onChange={(e) => update(r.key, { spentAt: e.target.value })}
                        className={ctrl}
                      />
                    </td>
                  )}
                  {isVisible("note") && (
                    <td>
                      <input
                        value={r.note}
                        onChange={(e) => update(r.key, { note: e.target.value })}
                        placeholder="Megjegyzés"
                        className={ctrl}
                      />
                    </td>
                  )}
                  <td className="pt-0.5">
                    <button
                      type="button"
                      onClick={() => removeRow(r.key)}
                      className="h-9 w-7 flex items-center justify-center text-[var(--color-muted-foreground)] hover:text-red-600"
                      aria-label="Sor törlése"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-3 flex flex-wrap gap-4">
        <button
          type="button"
          onClick={addRow}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:brightness-110"
        >
          <Plus className="w-4 h-4" /> Új sor
        </button>
        <button
          type="button"
          onClick={addRowLikeLast}
          className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
          title="Új sor az előző sor adataival"
        >
          <CopyPlus className="w-4 h-4" /> Sor az előző adataival
        </button>
      </div>

      <div className="mt-6 sticky bottom-0 -mx-5 px-5 py-3 bg-[var(--color-background)]/95 backdrop-blur-md border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            {incomeTotal > 0 && (
              <span className="font-semibold tabular-nums text-emerald-600 dark:text-emerald-400">
                +{fmtFt(incomeTotal)}{" "}
              </span>
            )}
            <span className="font-semibold tabular-nums">−{fmtFt(expenseTotal)}</span>
            <span className="text-[var(--color-muted-foreground)]"> · {valid.length} tétel</span>
          </div>
          <SubmitButton disabled={valid.length === 0}>
            {valid.length} tétel mentése
          </SubmitButton>
        </div>
      </div>
    </form>
  );
}
