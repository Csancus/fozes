import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  listIncomeCategories,
  ensureDefaultIncomeCategories,
  ensureDefaultPaymentMethods,
  listPersons,
  listProjects,
  listGroups,
  listMerchants,
  ensureMerchantsFromHistory,
  getMerchantMap,
  projectSuggestionsFrom,
} from "@/lib/data";
import { slug } from "@/lib/redis";
import Link from "next/link";
import { ImagePlus } from "lucide-react";
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

export default async function NewEntryPage({
  searchParams,
}: {
  searchParams: Promise<{ tipus?: string }>;
}) {
  const { tipus } = await searchParams;
  const defaultKind = tipus === "bevetel" ? "income" : "expense";

  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultIncomeCategories(me.householdId);
  await ensureMerchantsFromHistory(me.householdId);
  const [
    categories,
    incomeCategories,
    paymentMethods,
    persons,
    projects,
    groups,
    merchantMap,
    merchants,
    expenses,
  ] = await Promise.all([
    listExpenseCategories(me.householdId),
    listIncomeCategories(me.householdId),
    ensureDefaultPaymentMethods(me.householdId),
    listPersons(me.householdId),
    listProjects(me.householdId),
    listGroups(me.householdId),
    getMerchantMap(me.householdId),
    listMerchants(me.householdId),
    listExpenses(me.householdId),
  ]);

  const knownMerchants = merchants.map((m) => m.name);
  const projectSuggest = projectSuggestionsFrom(expenses);
  const existing = expenses
    .filter((e) => (e.kind ?? "expense") !== "income")
    .map((e) => ({
      slug: slug(e.merchant),
      amount: e.amount,
      day: toDay(e.spentAt),
    }));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Új tétel"
        subtitle="Kiadás vagy bevétel"
        back="/koltsegek"
        action={
          <Link
            href="/koltsegek/kep"
            className="inline-flex items-center gap-1.5 h-9 px-3 rounded-xl text-sm font-medium border border-[var(--color-border)] hover:bg-[var(--color-muted)] transition"
          >
            <ImagePlus className="w-4 h-4" />
            Kép
          </Link>
        }
      />
      <CategoryRuleBanner />
      <Card className="mt-6 p-5">
        <ExpenseForm
          action={saveExpenseAction}
          defaultKind={defaultKind}
          categories={categories}
          incomeCategories={incomeCategories}
          paymentMethods={paymentMethods}
          persons={persons}
          projects={projects}
          groups={groups}
          merchantMap={merchantMap}
          knownMerchants={knownMerchants}
          projectSuggest={projectSuggest}
          existing={existing}
        />
      </Card>
    </main>
  );
}
