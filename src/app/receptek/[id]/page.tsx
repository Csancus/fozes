import { requireUser } from "@/lib/auth";
import {
  getRecipe,
  listPantry,
  listCookedMealsForRecipe,
} from "@/lib/data";
import { estimateRecipeCost } from "@/lib/cost";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Button } from "@/components/ui/Button";
import { Card, LinkCard } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { notFound } from "next/navigation";
import { RecipeForm } from "../RecipeForm";
import { saveRecipeAction, deleteRecipeAction } from "../actions";
import {
  Trash2,
  CheckCircle2,
  Coins,
  Utensils,
  Star,
  ImageOff,
  ChevronRight,
} from "lucide-react";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export default async function EditReceptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const [recipe, pantry, meals] = await Promise.all([
    getRecipe(me.householdId, id),
    listPantry(me.householdId),
    listCookedMealsForRecipe(me.householdId, id),
  ]);
  if (!recipe) notFound();

  const { total: costTotal } = estimateRecipeCost(recipe.ingredients, pantry);

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title={recipe.name} back="/receptek" />

      <div className="mt-5 animate-fade-up space-y-5">
        <Button
          href={`/etelek/uj?recipeId=${recipe.id}`}
          size="lg"
          fullWidth
          leftIcon={<CheckCircle2 className="w-4 h-4" />}
        >
          Elkészítettem
        </Button>

        <Card className="p-3.5">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
              <Coins className="w-4.5 h-4.5" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs text-[var(--color-muted-foreground)]">
                Becsült alapanyag-költség
              </p>
              <p className="mt-0.5 text-lg font-semibold tabular-nums">
                {costTotal != null ? (
                  <>{costTotal.toLocaleString("hu-HU")} Ft</>
                ) : (
                  <span className="text-sm font-medium text-[var(--color-muted-foreground)]">
                    nem áll rendelkezésre
                  </span>
                )}
              </p>
            </div>
          </div>
        </Card>

        <RecipeForm action={saveRecipeAction} initial={recipe} />

        <Section title="Elkészítések">
          {meals.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="Még nincs elkészítés"
              description={'Nyomd meg fent az "Elkészítettem" gombot, ha megfőzted.'}
            />
          ) : (
            <ul className="space-y-2">
              {meals.map((m) => (
                <li key={m.id}>
                  <LinkCard href={`/etelek/${m.id}`} className="group p-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-[var(--color-muted)] overflow-hidden flex items-center justify-center shrink-0">
                        {m.photo ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img
                            src={m.photo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <ImageOff className="w-4 h-4 text-[var(--color-muted-foreground)]" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
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
                        </div>
                        {m.ingredientCost != null && (
                          <div className="mt-1">
                            <Badge tone="primary">
                              {m.ingredientCost.toLocaleString("hu-HU")} Ft
                            </Badge>
                          </div>
                        )}
                      </div>
                      <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition shrink-0" />
                    </div>
                  </LinkCard>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>

      <form action={deleteRecipeAction} className="mt-6 flex justify-center">
        <input type="hidden" name="id" value={recipe.id} />
        <button
          type="submit"
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-500/10 transition active:scale-[0.98]"
        >
          <Trash2 className="w-4 h-4" />
          <span>Recept törlése</span>
        </button>
      </form>
    </main>
  );
}
