import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkCard } from "@/components/ui/Card";
import { ChefHat, ChevronRight, Plus } from "lucide-react";
import {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LABEL,
  type Recipe,
  type RecipeCategory,
} from "@/lib/types";

export default async function ReceptekPage() {
  const me = await requireUser();
  const recipes = await listRecipes(me.householdId);

  const grouped = new Map<RecipeCategory | "egyeb", Recipe[]>();
  for (const c of RECIPE_CATEGORIES) grouped.set(c, []);
  grouped.set("egyeb", []);
  for (const r of recipes) {
    const gk: RecipeCategory | "egyeb" = r.category ?? "egyeb";
    grouped.get(gk)!.push(r);
  }

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Receptek"
        action={
          <Button
            href="/receptek/uj"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Új recept
          </Button>
        }
      />

      {recipes.length === 0 ? (
        <EmptyState
          icon={ChefHat}
          title="Nincs még recepted"
          description="Vidd fel a kedvenceid, aztán generálj bevásárlólistát belőlük."
          action={
            <Button
              href="/receptek/uj"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Új recept
            </Button>
          }
        />
      ) : (
        <div className="mt-5 space-y-6 animate-fade-up">
          {[...grouped.entries()]
            .filter(([, items]) => items.length > 0)
            .map(([cat, items]) => (
              <section key={cat}>
                <h2 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)] mb-2 px-1">
                  {cat === "egyeb"
                    ? `Egyéb · ${items.length}`
                    : `${RECIPE_CATEGORY_LABEL[cat]} · ${items.length}`}
                </h2>
                <ul className="space-y-3">
                  {items.map((r) => (
                    <li key={r.id}>
                      <LinkCard href={`/receptek/${r.id}`} className="group p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                            <ChefHat className="w-5 h-5" strokeWidth={2} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold text-[15px] truncate">
                              {r.name}
                            </p>
                            <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
                              {r.servings} adag · {r.ingredients.length} hozzávaló
                              {r.caloriesPerServing != null && (
                                <> · {r.caloriesPerServing} kcal/adag</>
                              )}
                              {r.proteinPerServing != null && (
                                <> · {r.proteinPerServing} g fehérje</>
                              )}
                            </p>
                            {r.tags.length > 0 && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {r.tags.map((t) => (
                                  <Badge key={t} tone="neutral">
                                    {t}
                                  </Badge>
                                ))}
                              </div>
                            )}
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition shrink-0" />
                        </div>
                      </LinkCard>
                    </li>
                  ))}
                </ul>
              </section>
            ))}
        </div>
      )}
    </main>
  );
}
