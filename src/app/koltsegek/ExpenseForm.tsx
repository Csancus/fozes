"use client";

import { useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { catColor, catIcon, payIcon } from "@/lib/expense-visuals";
import { cn } from "@/lib/cn";
import { Check, Sparkles, Plus, AlertTriangle } from "lucide-react";
import { createCategoryInline } from "./actions";
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

function todayStr(): string {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

export function ExpenseForm({
  action,
  categories,
  paymentMethods,
  persons,
  projects,
  merchantMap,
  knownMerchants,
  initial,
  existing = [],
}: {
  action: (fd: FormData) => void | Promise<void>;
  categories: ExpenseCategory[];
  paymentMethods: PaymentMethod[];
  persons: Person[];
  projects: Project[];
  merchantMap: Record<string, string>;
  knownMerchants: string[];
  initial?: Expense | null;
  existing?: { slug: string; amount: number; day: string }[];
}) {
  const [catList, setCatList] = useState<ExpenseCategory[]>(categories);
  const [merchant, setMerchant] = useState(initial?.merchant ?? "");
  const [categoryId, setCategoryId] = useState<string | null>(
    initial?.categoryId ?? null
  );
  const [paymentMethodId, setPaymentMethodId] = useState<string | null>(
    initial?.paymentMethodId ?? null
  );
  const [personId, setPersonId] = useState<string | null>(
    initial?.personId ?? null
  );
  const [projectId, setProjectId] = useState<string | null>(
    initial?.projectId ?? null
  );
  const [autoApplied, setAutoApplied] = useState(false);
  const manual = useRef(!!initial?.categoryId);

  const [dupWarn, setDupWarn] = useState(false);
  const confirmedRef = useRef(false);
  const formRef = useRef<HTMLFormElement>(null);

  async function addCategoryInline() {
    const name = window.prompt("Új kategória neve:");
    if (!name || !name.trim()) return;
    const cat = await createCategoryInline(name.trim());
    if (cat) {
      setCatList((cur) => [...cur, cat]);
      manual.current = true;
      setAutoApplied(false);
      setCategoryId(cat.id);
    }
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    if (initial || confirmedRef.current) return; // szerkesztésnél / megerősítés után nincs check
    const fd = new FormData(e.currentTarget);
    const amt = Math.round(
      Number(String(fd.get("amount") ?? "").replace(/\s/g, "").replace(",", "."))
    );
    const s = slugify(String(fd.get("merchant") ?? ""));
    const day = String(fd.get("spentAt") ?? "");
    const isDup =
      amt > 0 &&
      !!s &&
      existing.some((x) => x.slug === s && x.amount === amt && x.day === day);
    if (isDup) {
      e.preventDefault();
      setDupWarn(true);
    }
  }

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
    if (mapped && catList.some((c) => c.id === mapped)) {
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
    <form ref={formRef} action={action} onSubmit={onSubmit} className="space-y-5">
      {initial?.id && <input type="hidden" name="id" value={initial.id} />}
      <input type="hidden" name="categoryId" value={categoryId ?? ""} />
      <input type="hidden" name="paymentMethodId" value={paymentMethodId ?? ""} />
      <input type="hidden" name="personId" value={personId ?? ""} />
      <input type="hidden" name="projectId" value={projectId ?? ""} />

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
          {catList.map((c) => {
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
          <button
            type="button"
            onClick={addCategoryInline}
            className="inline-flex items-center gap-1 rounded-full pl-2 pr-3 h-9 text-[13px] font-medium border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition"
          >
            <Plus className="w-4 h-4" />
            Új kategória
          </button>
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium mb-2">Miből fizetted</span>
        <div className="flex flex-wrap gap-2">
          {paymentMethods.map((pm) => {
            const col = catColor(pm.color);
            const Icon = payIcon(pm.kind);
            const active = paymentMethodId === pm.id;
            return (
              <button
                type="button"
                key={pm.id}
                onClick={() =>
                  setPaymentMethodId((cur) => (cur === pm.id ? null : pm.id))
                }
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 h-9 text-[13px] font-medium border transition",
                  active
                    ? cn(col.soft, col.text, "border-transparent ring-2", col.ring)
                    : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <Icon className={cn("w-4 h-4", active ? col.text : "text-[var(--color-muted-foreground)]")} />
                {pm.name}
                {pm.last4 && (
                  <span className="opacity-60 tabular-nums">··{pm.last4}</span>
                )}
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
          <AddLink href="/koltsegek/beallitasok" label="Kártya" />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium mb-2">Ki költötte</span>
        <div className="flex flex-wrap gap-2">
          {persons.map((p) => {
            const col = catColor(p.color);
            const active = personId === p.id;
            return (
              <button
                type="button"
                key={p.id}
                onClick={() => setPersonId((cur) => (cur === p.id ? null : p.id))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 h-9 text-[13px] font-medium border transition",
                  active
                    ? cn(col.soft, col.text, "border-transparent ring-2", col.ring)
                    : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <span className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                {p.name}
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
          <AddLink
            href="/koltsegek/beallitasok"
            label={persons.length ? "Személy" : "Add hozzá (Anikó, Csanád…)"}
          />
        </div>
      </div>

      <div>
        <span className="block text-sm font-medium mb-2">Projekt</span>
        <div className="flex flex-wrap gap-2">
          {projects.map((pr) => {
            const col = catColor(pr.color);
            const active = projectId === pr.id;
            return (
              <button
                type="button"
                key={pr.id}
                onClick={() => setProjectId((cur) => (cur === pr.id ? null : pr.id))}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full pl-2.5 pr-3 h-9 text-[13px] font-medium border transition",
                  active
                    ? cn(col.soft, col.text, "border-transparent ring-2", col.ring)
                    : "border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
                )}
              >
                <span className={cn("w-2.5 h-2.5 rounded-full", col.dot)} />
                {pr.name}
                {active && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
          <AddLink
            href="/koltsegek/beallitasok"
            label={projects.length ? "Projekt" : "Add hozzá (pl. Autóvásárlás)"}
          />
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

      {dupWarn && (
        <div className="rounded-xl border border-amber-400/70 bg-amber-50 dark:bg-amber-500/10 p-3.5 text-sm">
          <p className="flex items-start gap-2 text-amber-800 dark:text-amber-300">
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
            <span>
              Ezen a napon már van <strong>{merchant}</strong> tétel ugyanennyiért.
              Biztosan nem duplikáció?
            </span>
          </p>
          <div className="mt-3 flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={() => {
                confirmedRef.current = true;
                setDupWarn(false);
                formRef.current?.requestSubmit();
              }}
            >
              Mégis rögzítem
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={() => setDupWarn(false)}
            >
              Mégse
            </Button>
          </div>
        </div>
      )}

      <SubmitButton size="lg" fullWidth pendingText={initial ? "Mentés…" : "Rögzítés…"}>
        {initial ? "Mentés" : "Kiadás rögzítése"}
      </SubmitButton>
    </form>
  );
}

function AddLink({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className="inline-flex items-center gap-1 rounded-full pl-2 pr-3 h-9 text-[13px] font-medium border border-dashed border-[var(--color-border)] text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/50 hover:text-[var(--color-primary)] transition"
    >
      <Plus className="w-4 h-4" />
      {label}
    </Link>
  );
}
