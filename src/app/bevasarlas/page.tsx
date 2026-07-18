import { requireUser } from "@/lib/auth";
import { listShoppingLists } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { ShoppingCart, Plus } from "lucide-react";
import { ShoppingListClient } from "./ShoppingListClient";

export default async function BevasarlasPage() {
  const me = await requireUser();
  const lists = await listShoppingLists(me.householdId);

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Bevásárlás"
        back="/fozes"
        action={
          <Button
            href="/bevasarlas/uj"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Új lista
          </Button>
        }
      />

      {lists.length === 0 ? (
        <EmptyState
          icon={ShoppingCart}
          title="Nincs bevásárlólista"
          description="Válassz recepteket vagy adj hozzá tételeket manuálisan."
          action={
            <Button
              href="/bevasarlas/uj"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Új lista
            </Button>
          }
        />
      ) : (
        <ShoppingListClient lists={lists} />
      )}
    </main>
  );
}
