import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  ensureDefaultPaymentMethods,
  listPersons,
  getMerchantMap,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { BatchEntry } from "./BatchEntry";
import { saveExpensesBatchAction } from "../actions";

export default async function BatchPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  const [categories, paymentMethods, persons, merchantMap, expenses] =
    await Promise.all([
      listExpenseCategories(me.householdId),
      ensureDefaultPaymentMethods(me.householdId),
      listPersons(me.householdId),
      getMerchantMap(me.householdId),
      listExpenses(me.householdId),
    ]);

  const knownMerchants = [...new Set(expenses.map((e) => e.merchant))]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "hu"));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Gyors rögzítés"
        subtitle="Több tétel egyszerre, táblázatban"
        back="/koltsegek"
      />
      <BatchEntry
        action={saveExpensesBatchAction}
        categories={categories}
        paymentMethods={paymentMethods}
        persons={persons}
        merchantMap={merchantMap}
        knownMerchants={knownMerchants}
      />
    </main>
  );
}
