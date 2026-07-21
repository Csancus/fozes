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
  listProjects,
  runDueRecurring,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { BarChart3, Plus } from "lucide-react";
import { OverviewDashboard } from "./OverviewDashboard";

export default async function AttekintesPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultPaymentMethods(me.householdId);
  await ensureDefaultIncomeCategories(me.householdId);
  await runDueRecurring(me.householdId);
  const [expenses, categories, incomeCategories, paymentMethods, persons, projects] =
    await Promise.all([
      listExpenses(me.householdId),
      listExpenseCategories(me.householdId),
      listIncomeCategories(me.householdId),
      listPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listProjects(me.householdId),
    ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader
        title="Áttekintés"
        subtitle="Dashboard · elmúlt 12 hónap"
        back="/koltsegek"
      />

      {expenses.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={BarChart3}
            title="Még nincs adat"
            description="Rögzíts néhány kiadást vagy bevételt, itt pedig megjelenik az elemzés."
          />
          <div className="mt-4 flex justify-center">
            <Button href="/koltsegek/uj" leftIcon={<Plus className="w-4 h-4" />}>
              Új kiadás
            </Button>
          </div>
        </div>
      ) : (
        <OverviewDashboard
          expenses={expenses}
          categories={categories}
          incomeCategories={incomeCategories}
          paymentMethods={paymentMethods}
          persons={persons}
          projects={projects}
        />
      )}
    </main>
  );
}
