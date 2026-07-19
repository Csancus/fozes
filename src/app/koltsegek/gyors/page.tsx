import { requireUser } from "@/lib/auth";
import {
  listExpenses,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  ensureDefaultPaymentMethods,
  listPersons,
  listProjects,
  getMerchantMap,
} from "@/lib/data";
import Link from "next/link";
import { SlidersHorizontal } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { BatchEntry } from "./BatchEntry";
import { saveExpensesBatchAction } from "../actions";

export default async function BatchPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  const [categories, paymentMethods, persons, projects, merchantMap, expenses] =
    await Promise.all([
      listExpenseCategories(me.householdId),
      ensureDefaultPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listProjects(me.householdId),
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
        Kártyák, kategóriák és személyek felvétele a{" "}
        <Link href="/koltsegek/beallitasok" className="text-[var(--color-primary)] font-medium">
          Beállításokban
        </Link>
        .
      </p>
      <BatchEntry
        action={saveExpensesBatchAction}
        categories={categories}
        paymentMethods={paymentMethods}
        persons={persons}
        projects={projects}
        merchantMap={merchantMap}
        knownMerchants={knownMerchants}
      />
    </main>
  );
}
