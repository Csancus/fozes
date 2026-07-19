import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  listPaymentMethods,
  ensureDefaultPaymentMethods,
  listPersons,
  listProjects,
} from "@/lib/data";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Wallet, Plus, Table2, SlidersHorizontal } from "lucide-react";
import { ExpensesDashboard } from "./ExpensesDashboard";

export default async function KoltsegekPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultPaymentMethods(me.householdId);
  const [expenses, categories, paymentMethods, persons, projects] =
    await Promise.all([
      listExpenses(me.householdId),
      listExpenseCategories(me.householdId),
      listPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listProjects(me.householdId),
    ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader
        title="Költségek"
        subtitle="Áttekintés és elemzés"
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

      <div className="mt-5 grid grid-cols-2 gap-3">
        <Button href="/koltsegek/uj" size="lg" leftIcon={<Plus className="w-4 h-4" />}>
          Új kiadás
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

      <Link
        href="/koltsegek/beallitasok"
        className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--color-border)] px-4 h-11 text-sm font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-foreground)] transition"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Kategóriák · kártyák · személyek
        </span>
        <span className="text-[var(--color-primary)]">Beállítások</span>
      </Link>

      {expenses.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Wallet}
            title="Még nincs kiadás"
            description="Rögzítsd az első tételt egyesével vagy a gyors táblázatban. Amelyik bolthoz kategóriát választasz, azt legközelebb megjegyzi."
          />
        </div>
      ) : (
        <ExpensesDashboard
          expenses={expenses}
          categories={categories}
          paymentMethods={paymentMethods}
          persons={persons}
          projects={projects}
        />
      )}
    </main>
  );
}
