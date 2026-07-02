"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { LinkCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import {
  ChefHat,
  ChevronRight,
  Coins,
  Gauge,
  Search,
} from "lucide-react";
import {
  RECIPE_CATEGORIES,
  RECIPE_CATEGORY_LABEL,
  type Recipe,
  type RecipeCategory,
  type RecipeCost,
  type RecipeDifficulty,
} from "@/lib/types";
import {
  COST_LABEL,
  COST_OPTIONS,
  DIFFICULTY_LABEL,
  DIFFICULTY_OPTIONS,
} from "@/lib/recipe-labels";
import { cn } from "@/lib/cn";

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 h-8 px-3 rounded-full text-xs font-medium border transition whitespace-nowrap",
        active
          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border-[var(--color-primary)]/25"
          : "bg-[var(--color-card)] text-[var(--color-foreground)] border-[var(--color-border)] hover:bg-[var(--color-muted)]"
      )}
    >
      {children}
    </button>
  );
}

export function RecipeListClient({ recipes }: { recipes: Recipe[] }) {
  const [q, setQ] = useState("");
  const [cost, setCost] = useState<RecipeCost | null>(null);
  const [difficulty, setDifficulty] = useState<RecipeDifficulty | null>(null);
  const [tag, setTag] = useState<string | null>(null);

  const allTags = useMemo(() => {
    return Array.from(new Set(recipes.flatMap((r) => r.tags))).sort((a, b) =>
      a.localeCompare(b, "hu")
    );
  }, [recipes]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return recipes.filter((r) => {
      if (cost && r.cost !== cost) return false;
      if (difficulty && r.difficulty !== difficulty) return false;
      if (tag && !r.tags.includes(tag)) return false;
      if (!needle) return true;
      return (
        r.name.toLowerCase().includes(needle) ||
        r.tags.some((t) => t.toLowerCase().includes(needle))
      );
    });
  }, [recipes, q, cost, difficulty, tag]);

  const grouped = useMemo(() => {
    const map = new Map<RecipeCategory | "egyeb", Recipe[]>();
    for (const c of RECIPE_CATEGORIES) map.set(c, []);
    map.set("egyeb", []);
    for (const r of filtered) {
      const gk: RecipeCategory | "egyeb" = r.category ?? "egyeb";
      map.get(gk)!.push(r);
    }
    return map;
  }, [filtered]);

  return (
    <div className="mt-4 animate-fade-up">
      <div className="relative">
        <Search
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] pointer-events-none"
          strokeWidth={2}
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Keresés..."
          className="pl-10"
        />
      </div>

      <div className="mt-3 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto -mx-5 px-5 pb-1">
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)] shrink-0 pr-1">
            <Coins className="w-3 h-3" strokeWidth={2.25} />
            Költség
          </span>
          <Pill active={cost === null} onClick={() => setCost(null)}>
            Mind
          </Pill>
          {COST_OPTIONS.map((o) => (
            <Pill
              key={o.value}
              active={cost === o.value}
              onClick={() => setCost(cost === o.value ? null : o.value)}
            >
              {o.label}
            </Pill>
          ))}
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto -mx-5 px-5 pb-1">
          <span className="inline-flex items-center gap-1 text-[11px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)] shrink-0 pr-1">
            <Gauge className="w-3 h-3" strokeWidth={2.25} />
            Nehézség
          </span>
          <Pill
            active={difficulty === null}
            onClick={() => setDifficulty(null)}
          >
            Mind
          </Pill>
          {DIFFICULTY_OPTIONS.map((o) => (
            <Pill
              key={o.value}
              active={difficulty === o.value}
              onClick={() =>
                setDifficulty(difficulty === o.value ? null : o.value)
              }
            >
              {o.label}
            </Pill>
          ))}
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center gap-1.5 overflow-x-auto -mx-5 px-5 pb-1">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)] shrink-0 pr-1">
              Címkék
            </span>
            <Pill active={tag === null} onClick={() => setTag(null)}>
              Mind
            </Pill>
            {allTags.map((t) => (
              <Pill
                key={t}
                active={tag === t}
                onClick={() => setTag(tag === t ? null : t)}
              >
                {t}
              </Pill>
            ))}
          </div>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Nincs találat a keresésre.
        </p>
      ) : (
        <div className="mt-5 space-y-6">
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
                            {(r.cost || r.difficulty) && (
                              <div className="mt-2 flex flex-wrap gap-1.5">
                                {r.cost && (
                                  <Badge tone="primary">
                                    <Coins
                                      className="w-3 h-3"
                                      strokeWidth={2.25}
                                    />
                                    {COST_LABEL[r.cost]}
                                  </Badge>
                                )}
                                {r.difficulty && (
                                  <Badge tone="primary">
                                    <Gauge
                                      className="w-3 h-3"
                                      strokeWidth={2.25}
                                    />
                                    {DIFFICULTY_LABEL[r.difficulty]}
                                  </Badge>
                                )}
                              </div>
                            )}
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
    </div>
  );
}
