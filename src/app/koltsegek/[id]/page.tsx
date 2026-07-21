import { requireUser } from "@/lib/auth";
import {
  getExpense,
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  ensureDefaultPaymentMethods,
  listPersons,
  listProjects,
  getMerchantMap,
  ensureMerchantsFromHistory,
} from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { ExpenseForm } from "../ExpenseForm";
import { saveExpenseAction, deleteExpenseAction } from "../actions";

export default async function EditExpensePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureMerchantsFromHistory(me.householdId);

  const [
    expense,
    categories,
    paymentMethods,
    persons,
    projects,
    merchantMap,
    expenses,
  ] = await Promise.all([
    getExpense(me.householdId, id),
    listExpenseCategories(me.householdId),
    ensureDefaultPaymentMethods(me.householdId),
    listPersons(me.householdId),
    listProjects(me.householdId),
    getMerchantMap(me.householdId),
    listExpenses(me.householdId),
  ]);
  if (!expense) notFound();

  const knownMerchants = [...new Set(expenses.map((e) => e.merchant))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "hu"));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Kiadás szerkesztése" back="/koltsegek" />
      <Card className="mt-6 p-5">
        <ExpenseForm
          action={saveExpenseAction}
          categories={categories}
          paymentMethods={paymentMethods}
          persons={persons}
          projects={projects}
          merchantMap={merchantMap}
          knownMerchants={knownMerchants}
          initial={expense}
        />
      </Card>

      <form action={deleteExpenseAction} className="mt-4">
        <input type="hidden" name="id" value={expense.id} />
        <Button
          type="submit"
          variant="ghost"
          fullWidth
          className="text-red-600 hover:text-red-700"
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Kiadás törlése
        </Button>
      </form>
    </main>
  );
}
