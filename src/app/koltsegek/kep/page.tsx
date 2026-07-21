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
} from "@/lib/data";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { CategoryRuleBanner } from "../CategoryRuleBanner";
import { ExpenseOcrImport } from "./ExpenseOcrImport";
import { saveExpensesBatchAction } from "../actions";

export default async function KepImportPage() {
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

  const incomeSources = expenses.filter((e) => e.kind === "income").map((e) => e.merchant);
  const knownMerchants = [...new Set([...merchants.map((m) => m.name), ...incomeSources])]
    .filter(Boolean)
    .sort((a, b) => a.localeCompare(b, "hu"));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-none mx-auto">
      <PageHeader
        title="Kép alapján"
        subtitle="Bank-képernyőképből tételek"
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
      <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
        Az OCR a böngésződben fut (tesseract.js). A felismerés nem tökéletes — a
        táblázatban minden mezőt tudsz pontosítani mentés előtt.
      </p>
      <CategoryRuleBanner />
      <ExpenseOcrImport
        action={saveExpensesBatchAction}
        categories={categories}
        incomeCategories={incomeCategories}
        paymentMethods={paymentMethods}
        persons={persons}
        projects={projects}
        groups={groups}
        merchantMap={merchantMap}
        knownMerchants={knownMerchants}
      />
    </main>
  );
}
