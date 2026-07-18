import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  getMerchantMap,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ExpenseForm } from "../ExpenseForm";
import { saveExpenseAction } from "../actions";

export default async function NewExpensePage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  const [categories, merchantMap, expenses] = await Promise.all([
    listExpenseCategories(me.householdId),
    getMerchantMap(me.householdId),
    listExpenses(me.householdId),
  ]);

  const knownMerchants = [...new Set(expenses.map((e) => e.merchant))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "hu"));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Új kiadás" back="/koltsegek" />
      <Card className="mt-6 p-5">
        <ExpenseForm
          action={saveExpenseAction}
          categories={categories}
          merchantMap={merchantMap}
          knownMerchants={knownMerchants}
        />
      </Card>
    </main>
  );
}
