import { requireUser } from "@/lib/auth";
import { listPantry, listLocations, ensureDefaultLocations } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Refrigerator, Box, Plus } from "lucide-react";
import { PantryListClient } from "./PantryListClient";

export default async function SpajzPage() {
  const me = await requireUser();
  await ensureDefaultLocations(me.householdId);
  const [items, locations] = await Promise.all([
    listPantry(me.householdId),
    listLocations(me.householdId),
  ]);

  const isEmpty = items.length === 0;

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Spájz"
        back="/fozes"
        action={
          <Button
            href="/spajz/uj"
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Új tétel
          </Button>
        }
      />

      <div className="mt-4">
        <Button
          href="/helyek"
          size="sm"
          variant="secondary"
          leftIcon={<Box className="w-4 h-4" />}
        >
          Helyek kezelése
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Refrigerator}
          title="Üres a spájz"
          description="Add hozzá az első tételt."
          action={
            <Button
              href="/spajz/uj"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Új tétel
            </Button>
          }
        />
      ) : (
        <PantryListClient items={items} locations={locations} />
      )}
    </main>
  );
}
