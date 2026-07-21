"use client";

import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { catColor, catIcon, payIcon } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { Pencil, Trash2, Play, Pause, RefreshCw } from "lucide-react";
import { RecurringForm } from "./RecurringForm";
import type {
  RecurringExpense,
  ExpenseCategory,
  PaymentMethod,
  Person,
  Project,
} from "@/lib/types";

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

const nextFmt = new Intl.DateTimeFormat("hu-HU", { month: "long", day: "numeric" });

function nextDate(dayOfMonth: number): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = now.getMonth();
  const dimThis = new Date(y, m + 1, 0).getDate();
  const dayThis = Math.min(dayOfMonth, dimThis);
  let due = new Date(y, m, dayThis, 12);
  if (due.getTime() <= now.getTime()) {
    const dimNext = new Date(y, m + 2, 0).getDate();
    due = new Date(y, m + 1, Math.min(dayOfMonth, dimNext), 12);
  }
  return nextFmt.format(due);
}

export function RecurringList({
  rules,
  categories,
  paymentMethods,
  persons,
  projects,
  merchantMap,
  knownMerchants,
  updateAction,
  deleteAction,
  toggleAction,
}: {
  rules: RecurringExpense[];
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  persons: Person[];
  projects: Project[];
  merchantMap: Record<string, string>;
  knownMerchants: string[];
  updateAction: (fd: FormData) => void | Promise<void>;
  deleteAction: (fd: FormData) => void | Promise<void>;
  toggleAction: (fd: FormData) => void | Promise<void>;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const catById = new Map(categories.map((c) => [c.id, c]));
  const payById = new Map(paymentMethods.map((p) => [p.id, p]));

  if (rules.length === 0) {
    return (
      <p className="mt-4 text-sm text-[var(--color-muted-foreground)]">
        Még nincs ismétlődő tétel. Add hozzá lent, vagy jelöld be a{" "}
        <strong>Új kiadás</strong> űrlapon az „Ismétlődő havonta" opciót.
      </p>
    );
  }

  return (
    <ul className="mt-4 space-y-2">
      {rules.map((r) => {
        if (editingId === r.id) {
          return (
            <li key={r.id}>
              <Card className="p-5">
                <RecurringForm
                  action={updateAction}
                  categories={categories}
                  paymentMethods={paymentMethods}
                  persons={persons}
                  projects={projects}
                  merchantMap={merchantMap}
                  knownMerchants={knownMerchants}
                  initial={r}
                  submitLabel="Módosítás mentése"
                  onCancel={() => setEditingId(null)}
                />
              </Card>
            </li>
          );
        }
        const cat = r.categoryId ? catById.get(r.categoryId) : null;
        const pay = r.paymentMethodId ? payById.get(r.paymentMethodId) : null;
        const col = catColor(cat?.color ?? "zinc");
        const Icon = catIcon(cat?.icon ?? "tag");
        const PayIcon = pay ? payIcon(pay.kind) : null;
        return (
          <li key={r.id}>
            <Card className={cn("p-3", !r.active && "opacity-60")}>
              <div className="flex items-center gap-3">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
                  <Icon className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate flex items-center gap-1.5">
                    {r.merchant}
                    {!r.active && (
                      <span className="text-[10px] font-medium rounded-full px-1.5 py-0.5 bg-[var(--color-muted)] text-[var(--color-muted-foreground)]">
                        szüneteltetve
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-[var(--color-muted-foreground)] truncate flex items-center gap-1.5">
                    <span>minden hó {r.dayOfMonth}.</span>
                    <span>· {cat?.name ?? "Nincs kategória"}</span>
                    {PayIcon && (
                      <span className="inline-flex items-center gap-0.5">
                        · <PayIcon className="w-3 h-3" /> {pay?.name}
                      </span>
                    )}
                  </p>
                  {r.active && (
                    <p className="text-[11px] text-[var(--color-primary)] flex items-center gap-1 mt-0.5">
                      <RefreshCw className="w-3 h-3" /> következő: {nextDate(r.dayOfMonth)}
                    </p>
                  )}
                </div>
                <p className="font-semibold tabular-nums shrink-0">{fmtFt(r.amount)}</p>
                <div className="flex items-center shrink-0">
                  <form action={toggleAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <input type="hidden" name="active" value={r.active ? "" : "on"} />
                    <button
                      type="submit"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
                      aria-label={r.active ? "Szüneteltetés" : "Folytatás"}
                    >
                      {r.active ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                  </form>
                  <button
                    type="button"
                    onClick={() => setEditingId(r.id)}
                    className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
                    aria-label="Szerkesztés"
                  >
                    <Pencil className="w-4 h-4" />
                  </button>
                  <form action={deleteAction}>
                    <input type="hidden" name="id" value={r.id} />
                    <Button type="submit" variant="ghost" size="sm" className="text-red-600 hover:text-red-700" aria-label="Törlés">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </form>
                </div>
              </div>
            </Card>
          </li>
        );
      })}
    </ul>
  );
}
