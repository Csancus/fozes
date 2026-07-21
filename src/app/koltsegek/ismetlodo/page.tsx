import { requireUser } from "@/lib/auth";
import {
  listRecurrings,
  runDueRecurring,
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  ensureDefaultPaymentMethods,
  listPaymentMethods,
  listPersons,
  listProjects,
  listMerchants,
  ensureMerchantsFromHistory,
  getMerchantMap,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Section } from "@/components/ui/Section";
import { RecurringList } from "./RecurringList";
import { RecurringForm } from "./RecurringForm";
import {
  createRecurringAction,
  updateRecurringAction,
  deleteRecurringAction,
  toggleRecurringAction,
} from "../actions";

export default async function IsmetlodoPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultPaymentMethods(me.householdId);
  await ensureMerchantsFromHistory(me.householdId);
  await runDueRecurring(me.householdId);

  const [rules, categories, paymentMethods, persons, projects, merchantMap, merchants] =
    await Promise.all([
      listRecurrings(me.householdId),
      listExpenseCategories(me.householdId),
      listPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listProjects(me.householdId),
      getMerchantMap(me.householdId),
      listMerchants(me.householdId),
    ]);

  const knownMerchants = merchants.map((m) => m.name);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Ismétlődő tételek"
        subtitle="Havonta automatikusan rögzülnek"
        back="/koltsegek"
      />

      <p className="mt-3 text-xs text-[var(--color-muted-foreground)]">
        A megadott napon minden hónapban automatikusan létrejön a kiadás — akkor is,
        ha közben nem nyitottad meg az appot (megnyitáskor bepótolja).
      </p>

      <RecurringList
        rules={rules}
        categories={categories}
        paymentMethods={paymentMethods}
        persons={persons}
        projects={projects}
        merchantMap={merchantMap}
        knownMerchants={knownMerchants}
        updateAction={updateRecurringAction}
        deleteAction={deleteRecurringAction}
        toggleAction={toggleRecurringAction}
      />

      <Section title="Új ismétlődő tétel" className="mt-10">
        <Card className="p-5">
          <RecurringForm
            action={createRecurringAction}
            categories={categories}
            paymentMethods={paymentMethods}
            persons={persons}
            projects={projects}
            merchantMap={merchantMap}
            knownMerchants={knownMerchants}
          />
        </Card>
      </Section>
    </main>
  );
}
