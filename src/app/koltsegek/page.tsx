import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  listIncomeCategories,
  ensureDefaultIncomeCategories,
  listPaymentMethods,
  ensureDefaultPaymentMethods,
  listPersons,
  listExpenseProjects,
  listGroups,
  runDueRecurring,
  getCostSetup,
} from "@/lib/data";
import { redirect } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Wallet, Plus, Table2, SlidersHorizontal, PencilLine, Repeat, ListChecks, ImagePlus, HelpCircle, Sparkles, CheckCircle2 } from "lucide-react";
import { ExpensesDashboard } from "./ExpensesDashboard";
import { AccountBalances } from "./AccountBalances";

export default async function KoltsegekPage({
  searchParams,
}: {
  searchParams: Promise<{ bevezeto?: string; megtartva?: string }>;
}) {
  const me = await requireUser();
  const { bevezeto, megtartva } = await searchParams;
  const keptCount = Number(megtartva ?? 0) || 0;

  // Új háztartás: az első tétel előtt végigvezetjük a beállításon.
  const setup = await getCostSetup(me.householdId);
  if (!setup.done) {
    const existing = await listExpenses(me.householdId);
    if (existing.length === 0) redirect("/koltsegek/bevezeto");
  }
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultPaymentMethods(me.householdId);
  await ensureDefaultIncomeCategories(me.householdId);
  await runDueRecurring(me.householdId);
  const [expenses, categories, incomeCategories, paymentMethods, persons, projects, groups] =
    await Promise.all([
      listExpenses(me.householdId),
      listExpenseCategories(me.householdId),
      listIncomeCategories(me.householdId),
      listPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listExpenseProjects(me.householdId),
      listGroups(me.householdId),
    ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader
        title="Költségkezelés"
        subtitle="Rögzítés és tételek"
        back="/"
        action={
          <Link
            href="/koltsegek/beallitasok"
            aria-label="Beállítások"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <SlidersHorizontal className="w-5 h-5" />
          </Link>
        }
      />

      {bevezeto === "kesz" && (
        <div className="mt-4 flex items-start gap-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-emerald-900 dark:text-emerald-200">
              Kész, minden be van állítva
            </p>
            {keptCount > 0 && (
              <p className="text-xs text-emerald-800/90 dark:text-emerald-300/90 mt-1">
                {keptCount} elemet (számla / személy / kategória) megtartottunk,
                mert már tartoznak hozzájuk rögzített tételek — ezeket a
                Beállításokban tudod törölni.
              </p>
            )}
            <p className="text-xs text-emerald-800/80 dark:text-emerald-300/80 mt-0.5">
              Jöhet az első tétel. Ha valamit később módosítanál, a Beállításokban
              megteszed — a részletes leírás a{" "}
              <Link href="/koltsegek/sugo" className="underline font-medium">
                Hogyan működik
              </Link>{" "}
              oldalon van.
            </p>
          </div>
        </div>
      )}

      <AccountBalances paymentMethods={paymentMethods} expenses={expenses} />

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button href="/koltsegek/uj" size="lg" leftIcon={<Plus className="w-4 h-4" />}>
          Új tétel
        </Button>
        <Button
          href="/koltsegek/gyors"
          size="lg"
          variant="secondary"
          leftIcon={<Table2 className="w-4 h-4" />}
        >
          Gyors táblázat
        </Button>
      </div>

      <Button
        href="/koltsegek/kep"
        size="lg"
        variant="secondary"
        fullWidth
        className="mt-3"
        leftIcon={<ImagePlus className="w-4 h-4" />}
      >
        Kép alapján (képernyőkép → tételek)
      </Button>

      {expenses.filter((e) => e.review).length > 0 && (
        <Link
          href="/koltsegek/teendok"
          className="mt-3 flex items-center justify-between rounded-xl border border-amber-400/60 bg-amber-50 dark:bg-amber-500/10 px-4 h-11 text-sm font-medium text-amber-900 dark:text-amber-200 hover:border-amber-400 transition"
        >
          <span className="flex items-center gap-2">
            <ListChecks className="w-4 h-4 text-amber-500" />
            Felülvizsgálatra váró tételek
          </span>
          <span className="inline-flex items-center justify-center min-w-6 h-6 px-1.5 rounded-full bg-amber-500 text-white text-xs font-semibold tabular-nums">
            {expenses.filter((e) => e.review).length}
          </span>
        </Link>
      )}

      {expenses.length > 0 && (
        <Link
          href="/koltsegek/tabla"
          className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--color-border)] px-4 h-11 text-sm font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-foreground)] transition"
        >
          <span className="flex items-center gap-2">
            <PencilLine className="w-4 h-4" />
            Meglévő tételek szerkesztése egyben
          </span>
          <span className="text-[var(--color-primary)]">Táblázat</span>
        </Link>
      )}

      <Link
        href="/koltsegek/ismetlodo"
        className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--color-border)] px-4 h-11 text-sm font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-foreground)] transition"
      >
        <span className="flex items-center gap-2">
          <Repeat className="w-4 h-4" />
          Ismétlődő tételek (havi automatikus)
        </span>
        <span className="text-[var(--color-primary)]">Kezelés</span>
      </Link>

      <Link
        href="/koltsegek/beallitasok"
        className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--color-border)] px-4 h-11 text-sm font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-foreground)] transition"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Kategóriák · boltok · kártyák · személyek
        </span>
        <span className="text-[var(--color-primary)]">Beállítások</span>
      </Link>

      <Link
        href="/koltsegek/sugo"
        className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--color-border)] px-4 h-11 text-sm font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-foreground)] transition"
      >
        <span className="flex items-center gap-2">
          <HelpCircle className="w-4 h-4" />
          Hogyan működik a Költségkezelő
        </span>
        <span className="text-[var(--color-primary)]">Leírás</span>
      </Link>

      {expenses.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Wallet}
            title="Még nincs kiadás"
            description="Rögzítsd az első tételt egyesével vagy a gyors táblázatban. Amelyik bolthoz kategóriát választasz, azt legközelebb megjegyzi."
            action={
              <Button
                href="/koltsegek/bevezeto"
                variant="secondary"
                leftIcon={<Sparkles className="w-4 h-4" />}
              >
                Beállító varázsló
              </Button>
            }
          />
        </div>
      ) : (
        <ExpensesDashboard
          expenses={expenses}
          categories={categories}
          incomeCategories={incomeCategories}
          paymentMethods={paymentMethods}
          persons={persons}
          projects={projects}
          groups={groups}
          compact
        />
      )}
    </main>
  );
}
