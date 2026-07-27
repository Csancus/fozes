import { requireUser } from "@/lib/auth";
import { ensureDefaultSavedTypes } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { CollapsiblePanel } from "@/components/ui/CollapsiblePanel";
import { EntityManager } from "@/components/ui/EntityManager";
import {
  createSavedTypeAction,
  updateSavedTypeAction,
  deleteSavedTypeAction,
} from "../actions";

export default async function BakancslistaBeallitasokPage() {
  const me = await requireUser();
  const types = await ensureDefaultSavedTypes(me.householdId);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Beállítások"
        subtitle="Bakancslista-típusok kezelése"
        back="/bakancslista"
      />

      <div className="mt-6 space-y-3">
        <CollapsiblePanel title="Típusok" count={types.length}>
          <p className="mb-3 text-xs text-[var(--color-muted-foreground)]">
            Ezek jelennek meg a mentéskor a típus-választóban (pl. Étterem,
            Utazás, Könyv). Saját ikonnal és színnel bővítheted.
          </p>
          <EntityManager
            variant="savedType"
            items={types.map((t) => ({
              id: t.id,
              name: t.name,
              color: t.color,
              icon: t.icon,
            }))}
            createAction={createSavedTypeAction}
            updateAction={updateSavedTypeAction}
            deleteAction={deleteSavedTypeAction}
          />
        </CollapsiblePanel>
      </div>
    </main>
  );
}
