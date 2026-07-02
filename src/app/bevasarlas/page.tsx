import { requireUser } from "@/lib/auth";
import { listShoppingLists } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkCard } from "@/components/ui/Card";
import { ShoppingCart, ClipboardList, ChevronRight, Plus } from "lucide-react";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${day}.`;
}

export default async function BevasarlasPage() {
  const me = await requireUser();
  const lists = await listShoppingLists(me.householdId);

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Bevásárlás"
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
        <ul className="mt-5 space-y-3 animate-fade-up">
          {lists.map((l) => {
            const toBuy = l.items.filter((it) => it.need > 0);
            const boughtCount = toBuy.filter((it) => it.checked).length;
            const done = l.completedAt != null;
            const pct =
              toBuy.length > 0
                ? Math.round((boughtCount / toBuy.length) * 100)
                : 0;
            const Icon = done ? ClipboardList : ShoppingCart;
            return (
              <li key={l.id}>
                <LinkCard href={`/bevasarlas/${l.id}`} className="group p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[15px] truncate">
                          {l.name}
                        </p>
                        {done && <Badge tone="success">Kész</Badge>}
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
                        {formatDate(l.createdAt)}
                        {toBuy.length > 0 && (
                          <>
                            {" "}
                            · {boughtCount} / {toBuy.length} megvéve
                          </>
                        )}
                      </p>
                      {toBuy.length > 0 && !done && (
                        <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-muted)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-primary)] transition-[width]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition shrink-0" />
                  </div>
                </LinkCard>
              </li>
            );
          })}
        </ul>
      )}
    </main>
  );
}
