import { requireUser } from "@/lib/auth";
import { listCookedMeals } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Utensils, Star, ImageOff } from "lucide-react";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function EtelekPage() {
  const me = await requireUser();
  const meals = await listCookedMeals(me.householdId);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Elkészült ételek"
        subtitle={
          meals.length > 0
            ? `${meals.length} bejegyzés`
            : undefined
        }
      />

      {meals.length === 0 ? (
        <EmptyState
          icon={Utensils}
          title="Még nincs elkészült ételed"
          description={'Válassz egy receptet és nyomd meg az "Elkészítettem" gombot.'}
        />
      ) : (
        <ul className="mt-5 grid gap-3 grid-cols-1 md:grid-cols-2 lg:grid-cols-3 animate-fade-up">
          {meals.map((m) => (
            <li key={m.id}>
              <LinkCard href={`/etelek/${m.id}`} className="group overflow-hidden">
                <div className="aspect-square w-full bg-[var(--color-muted)] flex items-center justify-center">
                  {m.photo ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={m.photo}
                      alt={m.recipeName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageOff className="w-8 h-8 text-[var(--color-muted-foreground)]" />
                  )}
                </div>
                <div className="p-3.5">
                  <p className="font-semibold text-[15px] truncate group-hover:text-[var(--color-primary)] transition">
                    {m.recipeName}
                  </p>
                  <div className="mt-1.5 flex items-center gap-2 flex-wrap">
                    <span className="inline-flex items-center gap-0.5 text-amber-500">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star
                          key={i}
                          className="w-3.5 h-3.5"
                          strokeWidth={1.75}
                          fill={i < m.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </span>
                    <span className="text-xs text-[var(--color-muted-foreground)]">
                      {formatDate(m.cookedAt)}
                    </span>
                    {m.ingredientCost != null && (
                      <Badge tone="primary">
                        {m.ingredientCost.toLocaleString("hu-HU")} Ft
                      </Badge>
                    )}
                  </div>
                </div>
              </LinkCard>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
