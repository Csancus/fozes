import { requireUser } from "@/lib/auth";
import {
  listExpensesRecent,
  listExpenses,
  listExpenseCategories,
  listIncomeCategories,
  listPaymentMethods,
  listPersons,
  listExpenseProjects,
  listGroups,
  listMerchants,
  getMerchantMap,
  ensureCostDefaults,
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

export default async function TablaPage({
  searchParams,
}: {
  searchParams: Promise<{ minden?: string }>;
}) {
  const { minden } = await searchParams;
  const all = minden === "1";
  const me = await requireUser();
  await ensureCostDefaults(me.householdId, { expense: true, income: true, payment: true, merchants: true });
  const [expenses, categories, incomeCategories, paymentMethods, persons, projects, groups, merchantMap, merchants] =
    await Promise.all([
      // Alapból az utolsó 13 hónap; a teljes előzmény a „minden" linkkel jön.
      all ? listExpenses(me.householdId) : listExpensesRecent(me.householdId, 13),
      listExpenseCategories(me.householdId),
      listIncomeCategories(me.householdId),
      listPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listExpenseProjects(me.householdId),
      listGroups(me.householdId),
      getMerchantMap(me.householdId),
      listMerchants(me.householdId),
    ]);

  const knownMerchants = merchants.map((m) => m.name);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-none mx-auto">
      <PageHeader
        title="Tételek szerkesztése"
        subtitle="Kiadás és bevétel egy táblázatban"
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

      {!all && (
        <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
          Az utolsó 13 hónap tételei látszanak.{" "}
          <Link href="/koltsegek/tabla?minden=1" className="text-[var(--color-primary)] underline">
            Teljes előzmény betöltése
          </Link>
        </p>
      )}

      {expenses.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Wallet}
            title="Még nincs tétel"
            description="Rögzíts előbb néhány kiadást vagy bevételt, itt pedig egyben szerkesztheted őket."
          />
          <div className="mt-4 flex justify-center">
            <Button href="/koltsegek/uj" leftIcon={<Plus className="w-4 h-4" />}>
              Új tétel
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
          incomeCategories={incomeCategories}
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

function contentKey(items: unknown[]): string {
  const s = JSON.stringify(items);
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return `${items.length}-${h >>> 0}`;
}
