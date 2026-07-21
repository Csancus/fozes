import { requireUser } from "@/lib/auth";
import {
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  listPaymentMethods,
  ensureDefaultPaymentMethods,
  listPersons,
  listProjects,
  listMerchants,
  ensureMerchantsFromHistory,
} from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { EntityManager } from "./EntityManager";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  createPaymentMethodAction,
  updatePaymentMethodAction,
  deletePaymentMethodAction,
  createPersonAction,
  updatePersonAction,
  deletePersonAction,
  createProjectAction,
  updateProjectAction,
  deleteProjectAction,
  createMerchantAction,
  updateMerchantAction,
  deleteMerchantAction,
} from "../actions";

export default async function BeallitasokPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultPaymentMethods(me.householdId);
  await ensureMerchantsFromHistory(me.householdId);
  const [categories, paymentMethods, persons, projects, merchants] =
    await Promise.all([
      listExpenseCategories(me.householdId),
      listPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listProjects(me.householdId),
      listMerchants(me.householdId),
    ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Beállítások"
        subtitle="Kategóriák, boltok, kártyák, személyek, projektek"
        back="/koltsegek"
      />

      <Section title="Kategóriák" className="mt-6">
        <EntityManager
          variant="category"
          items={categories}
          createAction={createCategoryAction}
          updateAction={updateCategoryAction}
          deleteAction={deleteCategoryAction}
        />
      </Section>

      <Section
        title="Boltok / kinek"
        className="mt-10"
      >
        <p className="-mt-2 mb-3 text-xs text-[var(--color-muted-foreground)]">
          A rögzített boltok itt jelennek meg. Az alap-kategóriát rögzítéskor
          automatikusan kitölti, amikor ezt a boltot választod.
        </p>
        <EntityManager
          variant="merchant"
          items={merchants.map((m) => ({
            id: m.id,
            name: m.name,
            color: "zinc",
            categoryId: m.categoryId,
          }))}
          categories={categories}
          createAction={createMerchantAction}
          updateAction={updateMerchantAction}
          deleteAction={deleteMerchantAction}
        />
      </Section>

      <Section title="Fizetési módok / kártyák" className="mt-10">
        <EntityManager
          variant="payment"
          items={paymentMethods}
          createAction={createPaymentMethodAction}
          updateAction={updatePaymentMethodAction}
          deleteAction={deletePaymentMethodAction}
        />
      </Section>

      <Section title="Ki költötte (személyek)" className="mt-10">
        <EntityManager
          variant="person"
          items={persons}
          createAction={createPersonAction}
          updateAction={updatePersonAction}
          deleteAction={deletePersonAction}
        />
      </Section>

      <Section title="Projektek" className="mt-10">
        <EntityManager
          variant="project"
          items={projects}
          createAction={createProjectAction}
          updateAction={updateProjectAction}
          deleteAction={deleteProjectAction}
        />
      </Section>
    </main>
  );
}
