import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  ensureDefaultPaymentMethods,
  listPaymentMethods,
  listPersons,
  listProjects,
  listGroups,
  listMerchants,
  ensureMerchantsFromHistory,
  getMerchantMap,
} from "@/lib/data";
import Link from "next/link";
import { SlidersHorizontal, Plus } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Wallet } from "lucide-react";
import { ExpenseTable } from "./ExpenseTable";
import { CategoryRuleBanner } from "../CategoryRuleBanner";
import { updateExpensesBatchAction } from "../actions";

export default async function TablaPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultPaymentMethods(me.householdId);
  await ensureMerchantsFromHistory(me.householdId);
  const [expenses, categories, paymentMethods, persons, projects, groups, merchantMap, merchants] =
    await Promise.all([
      listExpenses(me.householdId),
      listExpenseCategories(me.householdId),
      listPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listProjects(me.householdId),
      listGroups(me.householdId),
      getMerchantMap(me.householdId),
      listMerchants(me.householdId),
    ]);

  const knownMerchants = merchants.map((m) => m.name);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-none mx-auto">
      <PageHeader
        title="Kiadások szerkesztése"
        subtitle="Minden tétel egy táblázatban"
        back="/koltsegek"
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

      {expenses.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Wallet}
            title="Még nincs kiadás"
            description="Rögzíts előbb néhány tételt, itt pedig egyben szerkesztheted őket."
          />
          <div className="mt-4 flex justify-center">
            <Button href="/koltsegek/uj" leftIcon={<Plus className="w-4 h-4" />}>
              Új kiadás
            </Button>
          </div>
        </div>
      ) : (
        <>
          <CategoryRuleBanner />
          <ExpenseTable
          action={updateExpensesBatchAction}
          expenses={expenses}
          categories={categories}
          paymentMethods={paymentMethods}
          persons={persons}
          projects={projects}
          groups={groups}
          merchantMap={merchantMap}
          knownMerchants={knownMerchants}
        />
        </>
      )}
    </main>
  );
}
