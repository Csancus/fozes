import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listIncomeCategories,
  ensureDefaultIncomeCategories,
  listPersons,
} from "@/lib/data";
import Link from "next/link";
import { Table2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ExpenseForm } from "../ExpenseForm";
import { saveExpenseAction } from "../actions";

export default async function NewIncomePage() {
  const me = await requireUser();
  await ensureDefaultIncomeCategories(me.householdId);
  const [categories, persons, expenses] = await Promise.all([
    listIncomeCategories(me.householdId),
    listPersons(me.householdId),
    listExpenses(me.householdId),
  ]);

  const knownSources = [
    ...new Set(
      expenses.filter((e) => e.kind === "income").map((e) => e.merchant)
    ),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "hu"));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Új bevétel"
        back="/koltsegek"
        action={
          <Link
            href="/koltsegek/bevetel/gyors"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium border border-[var(--color-border)] text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition"
          >
            <Table2 className="w-4 h-4" />
            Táblázat
          </Link>
        }
      />
      <Card className="mt-6 p-5">
        <ExpenseForm
          kind="income"
          action={saveExpenseAction}
          categories={categories}
          paymentMethods={[]}
          persons={persons}
          projects={[]}
          merchantMap={{}}
          knownMerchants={knownSources}
        />
      </Card>
    </main>
  );
}
