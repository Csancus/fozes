import { requireUser } from "@/lib/auth";
import {
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  listPaymentMethods,
  ensureDefaultPaymentMethods,
  listPersons,
  listProjects,
  listGroups,
  listMerchants,
  listIncomeCategories,
  ensureDefaultIncomeCategories,
  ensureMerchantsFromHistory,
} from "@/lib/data";
import { RotateCcw } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { CollapsiblePanel } from "./CollapsiblePanel";
import { EntityManager } from "./EntityManager";
import {
  createCategoryAction,
  updateCategoryAction,
  deleteCategoryAction,
  restoreDefaultCategoriesAction,
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
  createIncomeCategoryAction,
  updateIncomeCategoryAction,
  deleteIncomeCategoryAction,
  createGroupAction,
  updateGroupAction,
  deleteGroupAction,
} from "../actions";

export default async function BeallitasokPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultPaymentMethods(me.householdId);
  await ensureDefaultIncomeCategories(me.householdId);
  await ensureMerchantsFromHistory(me.householdId);
  const [categories, incomeCategories, paymentMethods, persons, projects, groups, merchants] =
    await Promise.all([
      listExpenseCategories(me.householdId),
      listIncomeCategories(me.householdId),
      listPaymentMethods(me.householdId),
      listPersons(me.householdId),
      listProjects(me.householdId),
      listGroups(me.householdId),
      listMerchants(me.householdId),
    ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Beállítások"
        subtitle="Koppints egy panelre a kinyitáshoz"
        back="/koltsegek"
      />

      <div className="mt-6 space-y-3">
        <CollapsiblePanel title="Kategóriák" count={categories.length}>
          <form action={restoreDefaultCategoriesAction} className="mb-3">
            <SubmitButton
              variant="secondary"
              size="sm"
              leftIcon={<RotateCcw className="w-4 h-4" />}
              pendingText="Visszaállítás…"
            >
              Hiányzó alapkategóriák visszaállítása
            </SubmitButton>
          </form>
          <EntityManager
            variant="category"
            items={categories}
            createAction={createCategoryAction}
            updateAction={updateCategoryAction}
            deleteAction={deleteCategoryAction}
          />
        </CollapsiblePanel>

        <CollapsiblePanel title="Bevétel-kategóriák" count={incomeCategories.length}>
          <EntityManager
            variant="category"
            items={incomeCategories}
            createAction={createIncomeCategoryAction}
            updateAction={updateIncomeCategoryAction}
            deleteAction={deleteIncomeCategoryAction}
          />
        </CollapsiblePanel>

        <CollapsiblePanel title="Boltok / kinek" count={merchants.length}>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
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
        </CollapsiblePanel>

        <CollapsiblePanel title="Fizetési módok / kártyák" count={paymentMethods.length}>
          <EntityManager
            variant="payment"
            items={paymentMethods}
            createAction={createPaymentMethodAction}
            updateAction={updatePaymentMethodAction}
            deleteAction={deletePaymentMethodAction}
          />
        </CollapsiblePanel>

        <CollapsiblePanel title="Ki költötte (személyek)" count={persons.length}>
          <EntityManager
            variant="person"
            items={persons}
            createAction={createPersonAction}
            updateAction={updatePersonAction}
            deleteAction={deletePersonAction}
          />
        </CollapsiblePanel>

        <CollapsiblePanel title="Projektek" count={projects.length}>
          <EntityManager
            variant="project"
            items={projects}
            createAction={createProjectAction}
            updateAction={updateProjectAction}
            deleteAction={deleteProjectAction}
          />
        </CollapsiblePanel>

        <CollapsiblePanel title="Csoportok" count={groups.length}>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
            Csoportba kiadás és bevétel is kerülhet — a Csoportok oldalon együtt
            látod, hogy kioltják-e egymást.
          </p>
          <EntityManager
            variant="group"
            items={groups}
            createAction={createGroupAction}
            updateAction={updateGroupAction}
            deleteAction={deleteGroupAction}
          />
        </CollapsiblePanel>
      </div>
    </main>
  );
}
