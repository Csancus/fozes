import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  listIncomeCategories,
  ensureDefaultIncomeCategories,
  listPersons,
  listGroups,
  runDueRecurring,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Layers, Plus } from "lucide-react";
import { GroupsView } from "./GroupsView";

export default async function CsoportokPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultIncomeCategories(me.householdId);
  await runDueRecurring(me.householdId);
  const [groups, expenses, categories, incomeCategories, persons] = await Promise.all([
    listGroups(me.householdId),
    listExpenses(me.householdId),
    listExpenseCategories(me.householdId),
    listIncomeCategories(me.householdId),
    listPersons(me.householdId),
  ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader
        title="Csoportok"
        subtitle="Kiadás + bevétel együtt — kioltják-e egymást"
        back="/koltsegek"
      />

      {groups.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Layers}
            title="Még nincs csoport"
            description="Hozz létre csoportot (pl. „Nyaralás elszámolás”), tegyél bele kiadást és bevételt is, itt pedig egyben látod az egyenleget és a chartot."
          />
          <div className="mt-4 flex justify-center">
            <Button href="/koltsegek/beallitasok" leftIcon={<Plus className="w-4 h-4" />}>
              Csoport létrehozása
            </Button>
          </div>
        </div>
      ) : (
        <GroupsView
          groups={groups}
          expenses={expenses}
          categories={categories}
          incomeCategories={incomeCategories}
          persons={persons}
        />
      )}
    </main>
  );
}
