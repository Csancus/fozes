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
import { RecipeViewer } from "./RecipeViewer";
import {
  deleteRecipeAction,
  duplicateRecipeAction,
  archiveRecipeAction,
  unarchiveRecipeAction,
} from "../actions";
import {
  Trash2,
  CheckCircle2,
  Utensils,
  Star,
  ImageOff,
  ChevronRight,
  Copy,
  Archive,
  ArchiveRestore,
  Pencil,
} from "lucide-react";

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString("hu-HU", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function parseSteps(instructions: string): string[] {
  return instructions
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export default async function RecipeDetailPage({
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
  const isArchived = (recipe.archivedAt ?? null) != null;
  const steps = parseSteps(recipe.instructions);

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title={recipe.name}
        back="/receptek"
        action={
          <Button
            href={`/receptek/${recipe.id}/szerkesztes`}
            variant="ghost"
            size="sm"
            leftIcon={<Pencil className="w-4 h-4" />}
          >
            Szerkesztés
          </Button>
        }
      />

      <div className="mt-5 animate-fade-up space-y-5">
        {isArchived && (
          <div className="flex justify-center">
            <Badge tone="muted">Archiválva</Badge>
          </div>
        )}

        {recipe.imageUrl && (
          <div className="rounded-2xl overflow-hidden border border-[var(--color-border)] aspect-video bg-[var(--color-muted)]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={recipe.imageUrl}
              alt={recipe.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <RecipeViewer recipe={recipe} />

        {steps.length > 0 && (
          <Card className="p-4">
            <h2 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)] mb-3">
              Elkészítés
            </h2>
            <ol className="space-y-2.5">
              {steps.map((s, i) => (
                <li key={i} className="flex items-start gap-3 text-[15px]">
                  <span className="w-6 h-6 rounded-full bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center text-xs font-semibold shrink-0 mt-0.5 tabular-nums">
                    {i + 1}
                  </span>
                  <span>{s}</span>
                </li>
              ))}
            </ol>
          </Card>
        )}

        {(recipe.caloriesPerServing != null ||
          recipe.proteinPerServing != null ||
          costTotal != null) && (
          <Card className="p-4">
            <dl className="grid grid-cols-3 gap-3 text-center">
              {recipe.caloriesPerServing != null && (
                <StatCell label="kcal/adag" value={recipe.caloriesPerServing} />
              )}
              {recipe.proteinPerServing != null && (
                <StatCell
                  label="g fehérje"
                  value={recipe.proteinPerServing}
                />
              )}
              {costTotal != null && (
                <StatCell
                  label="alapanyag"
                  value={`${costTotal.toLocaleString("hu-HU")} Ft`}
                />
              )}
            </dl>
          </Card>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          <Button
            href={`/etelek/uj?recipeId=${recipe.id}`}
            size="md"
            fullWidth
            variant="secondary"
            leftIcon={<CheckCircle2 className="w-4 h-4" />}
          >
            Elkészítettem
          </Button>
          <form action={duplicateRecipeAction}>
            <input type="hidden" name="id" value={recipe.id} />
            <Button
              type="submit"
              variant="secondary"
              size="md"
              fullWidth
              leftIcon={<Copy className="w-4 h-4" />}
            >
              Duplikálás
            </Button>
          </form>
          {isArchived ? (
            <form action={unarchiveRecipeAction} className="md:col-span-2">
              <input type="hidden" name="id" value={recipe.id} />
              <Button
                type="submit"
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<ArchiveRestore className="w-4 h-4" />}
              >
                Visszaállítás az aktívok közé
              </Button>
            </form>
          ) : (
            <form action={archiveRecipeAction} className="md:col-span-2">
              <input type="hidden" name="id" value={recipe.id} />
              <Button
                type="submit"
                variant="secondary"
                size="md"
                fullWidth
                leftIcon={<Archive className="w-4 h-4" />}
              >
                Archiválás
              </Button>
            </form>
          )}
        </div>

        <Section title="Elkészítések">
          {meals.length === 0 ? (
            <EmptyState
              icon={Utensils}
              title="Még nincs elkészítés"
              description={'Nyomd meg az "Elkészítettem" gombot, ha megfőzted.'}
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

      <footer className="mt-8">
        <form action={deleteRecipeAction} className="flex justify-center">
          <input type="hidden" name="id" value={recipe.id} />
          <button
            type="submit"
            className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-500/10 transition active:scale-[0.98]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Recept törlése</span>
          </button>
        </form>
      </footer>
    </main>
  );
}

function StatCell({
  label,
  value,
}: {
  label: string;
  value: number | string;
}) {
  return (
    <div>
      <p className="text-base font-semibold tabular-nums">{value}</p>
      <p className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)] mt-0.5">
        {label}
      </p>
    </div>
  );
}
