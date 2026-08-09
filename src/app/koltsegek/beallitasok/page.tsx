import { requireUser } from "@/lib/auth";
import {
  listExpenseCategories,
  ensureDefaultExpenseCategories,
  listPaymentMethods,
  ensureDefaultPaymentMethods,
  listPersons,
  listGroups,
  listMerchants,
  listIncomeCategories,
  ensureDefaultIncomeCategories,
  ensureMerchantsFromHistory,
} from "@/lib/data";
import Link from "next/link";
import { RotateCcw, FolderKanban, ChevronRight, Sparkles, HelpCircle } from "lucide-react";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { EntityManager } from "@/components/ui/EntityManager";
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
import { restartCostSetupAction } from "../bevezeto/actions";

export default async function BeallitasokPage() {
  const me = await requireUser();
  await ensureDefaultExpenseCategories(me.householdId);
  await ensureDefaultPaymentMethods(me.householdId);
  await ensureDefaultIncomeCategories(me.householdId);
  await ensureMerchantsFromHistory(me.householdId);
  const [categories, incomeCategories, paymentMethods, persons, groups, merchants] =
    await Promise.all([
      listExpenseCategories(me.householdId),
      listIncomeCategories(me.householdId),
      listPaymentMethods(me.householdId),
      listPersons(me.householdId),
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

      <Link
        href="/beallitasok"
        className="mt-6 flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-primary)]/40 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
            <FolderKanban className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-sm font-medium">Célok és projektek</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Megosztott — Költségek és Teendők között is
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)]" />
      </Link>

      <Link
        href="/koltsegek/sugo"
        className="mt-3 flex items-center justify-between rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-primary)]/40 transition"
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center">
            <HelpCircle className="w-4.5 h-4.5" />
          </div>
          <div>
            <p className="text-sm font-medium">Hogyan működik a Költségkezelő</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Tömör leírás minden funkcióról
            </p>
          </div>
        </div>
        <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)]" />
      </Link>

      <form
        action={restartCostSetupAction}
        className="mt-3 flex items-center justify-between gap-3 rounded-2xl border border-dashed border-[var(--color-border)] p-4"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-[var(--color-muted)] text-[var(--color-muted-foreground)] flex items-center justify-center shrink-0">
            <Sparkles className="w-4.5 h-4.5" />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium">Beállító varázsló</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              Számlák, kezdő egyenlegek, ki költ, kategóriák — a meglévő
              adataiddal előtöltve
            </p>
          </div>
        </div>
        <SubmitButton variant="secondary" size="sm" pendingText="Indítás…">
          Indítás
        </SubmitButton>
      </form>

      <div className="mt-3 space-y-3">
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
