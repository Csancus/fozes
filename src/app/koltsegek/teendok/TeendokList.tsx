"use client";

import { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { catColor, catIcon } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { Check, List, LayoutGrid, Pencil } from "lucide-react";
import type {
  Expense,
  ExpenseCategory,
  Person,
} from "@/lib/types";

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}
const dayFmt = new Intl.DateTimeFormat("hu-HU", { year: "numeric", month: "short", day: "numeric" });

export function TeendokList({
  items,
  categories,
  incomeCategories,
  persons,
  toggleAction,
}: {
  items: Expense[];
  categories: ExpenseCategory[];
  incomeCategories: ExpenseCategory[];
  persons: Person[];
  toggleAction: (fd: FormData) => void | Promise<void>;
}) {
  const [view, setView] = useState<"list" | "board">("list");
  const catById = new Map(categories.map((c) => [c.id, c]));
  const incomeCatById = new Map(incomeCategories.map((c) => [c.id, c]));
  const personById = new Map(persons.map((p) => [p.id, p]));

  function CheckBtn({ id }: { id: string }) {
    return (
      <form action={toggleAction}>
        <input type="hidden" name="id" value={id} />
        <input type="hidden" name="review" value="" />
        <button
          type="submit"
          className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl bg-emerald-600 text-white text-sm font-medium hover:brightness-110 transition"
        >
          <Check className="w-4 h-4" /> Ellenőrizve
        </button>
      </form>
    );
  }

  function meta(e: Expense) {
    const inc = (e.kind ?? "expense") === "income";
    const cat = e.categoryId
      ? (inc ? incomeCatById : catById).get(e.categoryId)
      : null;
    const person = e.personId ? personById.get(e.personId) : null;
    return { inc, cat, person };
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm text-[var(--color-muted-foreground)]">
          {items.length} tétel vár ellenőrzésre
        </p>
        <div className="inline-flex rounded-lg border border-[var(--color-border)] p-0.5">
          <button
            type="button"
            onClick={() => setView("list")}
            aria-label="Lista"
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition",
              view === "list" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            )}
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setView("board")}
            aria-label="Board"
            className={cn(
              "w-8 h-8 rounded-md flex items-center justify-center transition",
              view === "board" ? "bg-[var(--color-primary)] text-white" : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            )}
          >
            <LayoutGrid className="w-4 h-4" />
          </button>
        </div>
      </div>

      {view === "list" ? (
        <ul className="space-y-2">
          {items.map((e) => {
            const { inc, cat, person } = meta(e);
            const col = catColor(cat?.color ?? (inc ? "emerald" : "zinc"));
            const Icon = catIcon(cat?.icon ?? (inc ? "savings" : "tag"));
            return (
              <li key={e.id}>
                <Card className="p-3">
                  <div className="flex items-center gap-3">
                    <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-[15px] truncate">{e.merchant}</p>
                      <p className="text-xs text-[var(--color-muted-foreground)] truncate">
                        {cat?.name ?? (inc ? "Bevétel" : "Nincs kategória")} · {dayFmt.format(new Date(e.spentAt))}
                        {person ? ` · ${person.name}` : ""}
                        {e.note ? ` · ${e.note}` : ""}
                      </p>
                    </div>
                    <p className={cn("font-semibold tabular-nums shrink-0", inc && "text-emerald-600 dark:text-emerald-400")}>
                      {inc ? "+" : ""}
                      {fmtFt(e.amount)}
                    </p>
                    <Link
                      href={`/koltsegek/${e.id}`}
                      aria-label="Szerkesztés"
                      className="w-9 h-9 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition shrink-0"
                    >
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <CheckBtn id={e.id} />
                  </div>
                </Card>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {items.map((e) => {
            const { inc, cat, person } = meta(e);
            const col = catColor(cat?.color ?? (inc ? "emerald" : "zinc"));
            const Icon = catIcon(cat?.icon ?? (inc ? "savings" : "tag"));
            return (
              <Card key={e.id} className="p-4 flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className={cn("w-9 h-9 rounded-xl flex items-center justify-center shrink-0", col.soft, col.text)}>
                    <Icon className="w-4.5 h-4.5" />
                  </div>
                  <p className="font-medium truncate flex-1">{e.merchant}</p>
                  <p className={cn("font-semibold tabular-nums", inc && "text-emerald-600 dark:text-emerald-400")}>
                    {inc ? "+" : ""}
                    {fmtFt(e.amount)}
                  </p>
                </div>
                <p className="text-xs text-[var(--color-muted-foreground)]">
                  {cat?.name ?? (inc ? "Bevétel" : "Nincs kategória")} · {dayFmt.format(new Date(e.spentAt))}
                  {person ? ` · ${person.name}` : ""}
                </p>
                {e.note && <p className="text-xs text-[var(--color-foreground)]">{e.note}</p>}
                <div className="flex items-center gap-2 mt-1">
                  <CheckBtn id={e.id} />
                  <Link
                    href={`/koltsegek/${e.id}`}
                    className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl border border-[var(--color-border)] text-sm font-medium hover:bg-[var(--color-muted)] transition"
                  >
                    <Pencil className="w-4 h-4" /> Szerkesztés
                  </Link>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
