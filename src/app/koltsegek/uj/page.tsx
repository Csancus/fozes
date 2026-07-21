import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  ensureDefaultPaymentMethods,
  listPersons,
  listProjects,
  listMerchants,
  ensureMerchantsFromHistory,
  getMerchantMap,
} from "@/lib/data";
import { slug } from "@/lib/redis";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { ExpenseForm } from "../ExpenseForm";
import { CategoryRuleBanner } from "../CategoryRuleBanner";
import { saveExpenseAction } from "../actions";

function toDay(ts: number): string {
  const d = new Date(ts);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;
}

export default async function NewExpensePage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureMerchantsFromHistory(me.householdId);
  const [categories, paymentMethods, persons, projects, merchantMap, merchants, expenses] =
    await Promise.all([
      listExpenseCategories(me.householdId),
      ensureDefaultPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listProjects(me.householdId),
      getMerchantMap(me.householdId),
      listMerchants(me.householdId),
      listExpenses(me.householdId),
    ]);

  const knownMerchants = merchants.map((m) => m.name);
  const existing = expenses.map((e) => ({
    slug: slug(e.merchant),
    amount: e.amount,
    day: toDay(e.spentAt),
  }));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Új kiadás" back="/koltsegek" />
      <CategoryRuleBanner />
      <Card className="mt-6 p-5">
        <ExpenseForm
          action={saveExpenseAction}
          categories={categories}
          paymentMethods={paymentMethods}
          persons={persons}
          projects={projects}
          merchantMap={merchantMap}
          knownMerchants={knownMerchants}
          existing={existing}
        />
      </Card>
    </main>
  );
}
