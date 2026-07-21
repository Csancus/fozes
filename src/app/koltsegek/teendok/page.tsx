import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  listIncomeCategories,
  ensureDefaultIncomeCategories,
  listPersons,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ClipboardCheck } from "lucide-react";
import { TeendokList } from "./TeendokList";
import { setExpenseReviewAction } from "../actions";

export default async function TeendokPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultIncomeCategories(me.householdId);
  const [expenses, categories, incomeCategories, persons] = await Promise.all([
    listExpenses(me.householdId),
    listExpenseCategories(me.householdId),
    listIncomeCategories(me.householdId),
    listPersons(me.householdId),
  ]);

  const todo = expenses.filter((e) => e.review);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader
        title="Teendők"
        subtitle="Felülvizsgálatra jelölt tételek"
        back="/koltsegek"
      />

      {todo.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={ClipboardCheck}
            title="Nincs teendő"
            description="Ha egy tételt „Felülvizsgálat”-ra jelölsz a rögzítéskor vagy a táblázatban, itt jelenik meg, amíg le nem ellenőrzöd."
          />
        </div>
      ) : (
        <TeendokList
          items={todo}
          categories={categories}
          incomeCategories={incomeCategories}
          persons={persons}
          toggleAction={setExpenseReviewAction}
        />
      )}
    </main>
  );
}
