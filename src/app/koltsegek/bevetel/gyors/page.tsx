import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listIncomeCategories,
  ensureDefaultIncomeCategories,
  listPersons,
} from "@/lib/data";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BatchEntry } from "../../gyors/BatchEntry";
import { saveExpensesBatchAction } from "../../actions";

export default async function IncomeBatchPage() {
  const me = await requireUser();
  await ensureDefaultIncomeCategories(me.householdId);
  const [categories, persons, expenses] = await Promise.all([
    listIncomeCategories(me.householdId),
    listPersons(me.householdId),
    listExpenses(me.householdId),
  ]);

  const knownSources = [
    ...new Set(expenses.filter((e) => e.kind === "income").map((e) => e.merchant)),
  ]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "hu"));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Bevételek táblázatban"
        subtitle="Több bevétel egyszerre"
        back="/koltsegek/bevetel"
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
      <BatchEntry
        kind="income"
        action={saveExpensesBatchAction}
        categories={categories}
        paymentMethods={[]}
        persons={persons}
        projects={[]}
        merchantMap={{}}
        knownMerchants={knownSources}
      />
    </main>
  );
}
