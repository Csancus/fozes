"use client";

import { useMemo, useRef, useState } from "react";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { catColor, catIcon } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { Check, Sparkles } from "lucide-react";
import type { Expense, ExpenseCategory } from "@/lib/types";

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

export function ExpenseForm({
  action,
  categories,
  merchantMap,
  knownMerchants,
  initial,
}: {
  action: (fd: FormData) => void | Promise<void>;
  categories: ExpenseCategory[];
  merchantMap: Record<string, string>;
  knownMerchants: string[];
  initial?: Expense | null;
}) {
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    initial?.categoryId ?? null
  );
  const [autoApplied, setAutoApplied] = useState(false);
  const manual = useRef(!!initial?.categoryId);

  const dateDefault = useMemo(() => {
    if (initial?.spentAt) {
      const d = new Date(initial.spentAt);
      const m = String(d.getMonth() + 1).padStart(2, "0");
      const day = String(d.getDate()).padStart(2, "0");
      return `${d.getFullYear()}-${m}-${day}`;
    }
    return todayStr();
  }, [initial?.spentAt]);

  function onMerchantChange(v: string) {
    setMerchant(v);
    if (manual.current) return;
    const mapped = merchantMap[slugify(v)];
    if (mapped && categories.some((c) => c.id === mapped)) {
      setCategoryId(mapped);
      setAutoApplied(true);
    } else if (autoApplied) {
      setAutoApplied(false);
    }
  }

  function pick(id: string) {
    manual.current = true;
    setAutoApplied(false);
    setCategoryId((cur) => (cur === id ? null : id));
  }

  return (
    <form action={action} className="space-y-5">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="categoryId" value={categoryId ?? ""} />

      <Field label="Összeg (Ft)" required>
        <Input
          name="amount"
          inputMode="numeric"
          required
          defaultValue={initial?.amount ? String(initial.amount) : ""}
          placeholder="pl. 4990"
          className="text-2xl font-bold h-14 tabular-nums"
          autoFocus={!initial}
        />
      </Field>

      <Field label="Hol / kinek" required hint="pl. Lidl, Shell, Spotify">
        <Input
          name="merchant"
          required
          value={merchant}
          onChange={(e) => onMerchantChange(e.target.value)}
          list="known-merchants"
          placeholder="Bolt vagy szolgáltató neve"
        />
        <datalist id="known-merchants">
          {knownMerchants.map((m) => (
            <option key={m} value={m} />
          ))}
        </datalist>
      </Field>

      <div>
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium">Kategória</span>
          {autoApplied && (
            <span className="inline-flex items-center gap-1 text-[11px] text-[var(--color-primary)]">
              <Sparkles className="w-3 h-3" /> automatikusan
            </span>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => {
            const col = catColor(c.color);
            const Icon = catIcon(c.icon);
            const active = categoryId === c.id;
            return (
              <button
                type="button"
                key={c.id}
                onClick={() => pick(c.id)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 h-9 text-[13px] font-medium border transition",
                  active
                    ? cn(col.soft, col.text, "border-transparent ring-2", col.ring)
                    : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <Icon className={cn("w-4 h-4", active ? col.text : "text-[var(--color-muted-foreground)]")} />
                {c.name}
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Dátum">
          <Input type="date" name="spentAt" defaultValue={dateDefault} />
        </Field>
      </div>

      <Field label="Megjegyzés">
        <Textarea
          name="note"
          defaultValue={initial?.note ?? ""}
          placeholder="Nem kötelező"
          className="min-h-20"
        />
      </Field>

      <Button type="submit" size="lg" fullWidth>
        {initial ? "Mentés" : "Kiadás rögzítése"}
      </Button>
    </form>
  );
}
