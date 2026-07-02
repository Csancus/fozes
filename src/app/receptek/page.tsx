import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkCard } from "@/components/ui/Card";
import Link from "next/link";
import { Archive, ChefHat, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LABEL,
  type Recipe,
  type RecipeCategory,
} from "@/lib/types";

export default async function ReceptekPage({
  searchParams,
}: {
  searchParams: Promise<{ archive?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const archiveMode = sp.archive === "1";

  const all = await listRecipes(me.householdId, {
    includeArchived: archiveMode,
  });
  const recipes = archiveMode
    ? all.filter((r) => (r.archivedAt ?? null) != null)
    : all;

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
        title={archiveMode ? "Archívum" : "Receptek"}
        action={
          archiveMode ? (
            <Button
              href="/receptek"
              size="sm"
              variant="secondary"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Aktívak
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                href="/receptek?archive=1"
                size="sm"
                variant="secondary"
                leftIcon={<Archive className="w-4 h-4" />}
              >
                Archívum
              </Button>
              <Button
                href="/receptek/uj"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Új recept
              </Button>
            </div>
          )
        }
      />

      {archiveMode && (
        <div className="mt-3">
          <Link
            href="/receptek"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Vissza az aktívokhoz</span>
          </Link>
        </div>
      )}

      {recipes.length === 0 ? (
        <EmptyState
          icon={archiveMode ? Archive : ChefHat}
          title={archiveMode ? "Nincs archivált recept" : "Nincs még recepted"}
          description={
            archiveMode
              ? "Az archivált receptek itt jelennek meg."
              : "Vidd fel a kedvenceid, aztán generálj bevásárlólistát belőlük."
          }
          action={
            archiveMode ? undefined : (
              <Button
                href="/receptek/uj"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Új recept
              </Button>
            )
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
                          {r.imageUrl ? (
                            /* eslint-disable-next-line @next/next/no-img-element */
                            <img
                              src={r.imageUrl}
                              alt=""
                              className="w-14 h-14 rounded-xl object-cover shrink-0"
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                              <ChefHat className="w-5 h-5" strokeWidth={2} />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-[15px] truncate">
                                {r.name}
                              </p>
                              {(r.archivedAt ?? null) != null && (
                                <Badge tone="muted">Archivált</Badge>
                              )}
                            </div>
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
