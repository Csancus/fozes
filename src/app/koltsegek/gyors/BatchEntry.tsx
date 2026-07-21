"use client";

import { useMemo, useState } from "react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { cn } from "@/lib/cn";
import { Plus, X, CopyPlus } from "lucide-react";
import { CategorySelect } from "../CategorySelect";
import type {
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
  amount: string;
  merchant: string;
  categoryId: string;
  paymentMethodId: string;
  personId: string;
  projectId: string;
  spentAt: string;
};

let counter = 0;
function emptyRow(): Row {
  counter += 1;
  return {
    key: `r${counter}`,
    amount: "",
    merchant: "",
    categoryId: "",
    paymentMethodId: "",
    personId: "",
    projectId: "",
    spentAt: todayStr(),
  };
}

const ctrl =
  "h-9 w-full rounded-lg border border-[var(--color-input)] bg-[var(--color-card)] px-2 text-[13px] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)]";

export function BatchEntry({
  action,
  categories,
  paymentMethods,
  persons,
  projects,
  merchantMap,
  knownMerchants,
}: {
  action: (fd: FormData) => void | Promise<void>;
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  persons: Person[];
  projects: Project[];
  merchantMap: Record<string, string>;
  knownMerchants: string[];
}) {
  const [catList, setCatList] = useState<ExpenseCategory[]>(categories);
  const [rows, setRows] = useState<Row[]>(() => [
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
    emptyRow(),
  ]);

  function update(key: string, patch: Partial<Row>) {
    setRows((cur) =>
      cur.map((r) => {
        if (r.key !== key) return r;
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

  function removeRow(key: string) {
    setRows((cur) => (cur.length > 1 ? cur.filter((r) => r.key !== key) : cur));
  }

  function addRow() {
    setRows((cur) => [...cur, emptyRow()]);
  }

  function addRowLikeLast() {
    setRows((cur) => {
      const last = cur[cur.length - 1];
      const r = emptyRow();
      if (last) {
        r.spentAt = last.spentAt;
        r.paymentMethodId = last.paymentMethodId;
        r.personId = last.personId;
        r.projectId = last.projectId;
      }
      return [...cur, r];
    });
  }

  const valid = useMemo(
    () => rows.filter((r) => toNum(r.amount) > 0 && r.merchant.trim()),
    [rows]
  );
  const total = valid.reduce((s, r) => s + toNum(r.amount), 0);

  const payload = JSON.stringify(
    valid.map((r) => ({
      amount: r.amount,
      merchant: r.merchant,
      categoryId: r.categoryId,
      paymentMethodId: r.paymentMethodId,
      personId: r.personId,
      projectId: r.projectId,
      spentAt: r.spentAt,
    }))
  );

  const showPerson = persons.length > 0;
  const showProject = projects.length > 0;

  // A táblázat minimális szélessége az aktív oszlopoktól függ (desktopon elfér, mobilon görgethető)
  const minW =
    760 + (showPerson ? 120 : 0) + (showProject ? 140 : 0);

  return (
    <form action={action} className="mt-5">
      <input type="hidden" name="rows" value={payload} />

      <datalist id="batch-merchants">
        {knownMerchants.map((m) => (
          <option key={m} value={m} />
        ))}
      </datalist>

      <div className="overflow-x-auto -mx-5 px-5">
        <table
          className="w-full border-separate border-spacing-x-1.5 border-spacing-y-1.5"
          style={{ minWidth: `${minW}px` }}
        >
          <thead>
            <tr className="text-left text-[11px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
              <th className="font-semibold w-7" />
              <th className="font-semibold px-1 w-28">Összeg</th>
              <th className="font-semibold px-1">Bolt / kinek</th>
              <th className="font-semibold px-1 w-40">Kategória</th>
              <th className="font-semibold px-1 w-36">Fizetés</th>
              {showPerson && <th className="font-semibold px-1 w-28">Ki</th>}
              {showProject && <th className="font-semibold px-1 w-32">Projekt</th>}
              <th className="font-semibold px-1 w-36">Dátum</th>
              <th className="w-7" />
            </tr>
          </thead>
          <tbody>
            {rows.map((r, i) => (
              <tr key={r.key} className="align-top">
                <td className="text-xs text-[var(--color-muted-foreground)] tabular-nums pt-2">
                  {i + 1}.
                </td>
                <td>
                  <input
                    inputMode="numeric"
                    value={r.amount}
                    onChange={(e) => update(r.key, { amount: e.target.value })}
                    placeholder="0"
                    className={cn(ctrl, "tabular-nums font-medium")}
                  />
                </td>
                <td>
                  <input
                    value={r.merchant}
                    onChange={(e) => update(r.key, { merchant: e.target.value })}
                    list="batch-merchants"
                    placeholder="pl. Lidl"
                    className={ctrl}
                  />
                </td>
                <td>
                  <CategorySelect
                    categories={catList}
                    value={r.categoryId}
                    onChange={(id) => update(r.key, { categoryId: id })}
                    onCreated={(c) => setCatList((cur) => [...cur, c])}
                    className={cn(ctrl, "appearance-none")}
                  />
                </td>
                <td>
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
                </td>
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
                  </td>
                )}
                <td>
                  <input
                    type="date"
                    value={r.spentAt}
                    onChange={(e) => update(r.key, { spentAt: e.target.value })}
                    className={ctrl}
                  />
                </td>
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
            ))}
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
          title="Új sor az előző sor dátumával, kártyájával, személyével és projektjével"
        >
          <CopyPlus className="w-4 h-4" /> Sor az előző adataival
        </button>
      </div>

      <div className="mt-6 sticky bottom-0 -mx-5 px-5 py-3 bg-[var(--color-background)]/95 backdrop-blur-md border-t border-[var(--color-border)]">
        <div className="flex items-center justify-between gap-3">
          <div className="text-sm">
            <span className="font-semibold tabular-nums">{fmtFt(total)}</span>
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
