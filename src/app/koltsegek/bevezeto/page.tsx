import { requireUser } from "@/lib/auth";
import {
  ensureDefaultExpenseCategories,
  ensureDefaultPaymentMethods,
  ensureDefaultIncomeCategories,
  listPaymentMethods,
  listPersons,
  listExpenseCategories,
  listIncomeCategories,
  listHouseholdMembers,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { SetupWizard } from "./SetupWizard";
import { completeCostSetupAction, skipCostSetupAction } from "./actions";

export default async function BevezetoPage() {
  const me = await requireUser();
  const hh = me.householdId;
  // Az alapkészletet felajánljuk kiindulásnak (a varázslóban ki lehet kapcsolni).
  await ensureDefaultExpenseCategories(hh);
  await ensureDefaultPaymentMethods(hh);
  await ensureDefaultIncomeCategories(hh);

  const [paymentMethods, persons, categories, incomeCategories, members] =
    await Promise.all([
      listPaymentMethods(hh),
      listPersons(hh),
      listExpenseCategories(hh),
      listIncomeCategories(hh),
      listHouseholdMembers(hh),
    ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-10 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Költségkezelő beállítása" back="/koltsegek" />
      <div className="mt-5">
        <SetupWizard
          saveAction={completeCostSetupAction}
          skipAction={skipCostSetupAction}
          paymentMethods={paymentMethods}
          persons={persons}
          categories={categories}
          incomeCategories={incomeCategories}
          members={members}
        />
      </div>
    </main>
  );
}
