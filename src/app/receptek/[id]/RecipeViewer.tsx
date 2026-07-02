"use client";

import { useState } from "react";
import type { Recipe, Unit } from "@/lib/types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { COST_LABEL, DIFFICULTY_LABEL } from "@/lib/recipe-labels";
import { ChefHat, Coins, Gauge, Minus, Plus } from "lucide-react";

function roundQty(qty: number, unit: Unit): number {
  if (unit === "db" || unit === "csipet") {
    return Math.max(1, Math.round(qty));
  }
  return Math.round(qty * 10) / 10;
}

function formatQty(qty: number): string {
  if (Number.isInteger(qty)) return String(qty);
  return qty.toFixed(1).replace(".", ",");
}

export function RecipeViewer({ recipe }: { recipe: Recipe }) {
  const [servings, setServings] = useState<number>(
    Math.max(1, recipe.servings || 1)
  );
  const factor = servings / (recipe.servings || 1);

  return (
    <Card className="p-4 space-y-4">
      {(recipe.cost || recipe.difficulty || recipe.tags.length > 0) && (
        <div className="flex flex-wrap gap-1.5">
          {recipe.cost && (
            <Badge tone="primary">
              <Coins className="w-3 h-3" strokeWidth={2.25} />
              {COST_LABEL[recipe.cost]}
            </Badge>
          )}
          {recipe.difficulty && (
            <Badge tone="primary">
              <Gauge className="w-3 h-3" strokeWidth={2.25} />
              {DIFFICULTY_LABEL[recipe.difficulty]}
            </Badge>
          )}
          {recipe.tags.map((t) => (
            <Badge key={t} tone="neutral">
              {t}
            </Badge>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between gap-3">
        <h2 className="text-[11px] uppercase tracking-wider font-semibold text-[var(--color-muted-foreground)]">
          Hozzávalók
        </h2>
        <div className="inline-flex items-center gap-1.5 rounded-full border border-[var(--color-border)] bg-[var(--color-card)] px-1.5 py-1">
          <button
            type="button"
            aria-label="Kevesebb adag"
            onClick={() => setServings((s) => Math.max(1, s - 1))}
            className="w-7 h-7 inline-flex items-center justify-center rounded-full text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition"
          >
            <Minus className="w-4 h-4" />
          </button>
          <span className="min-w-[68px] text-center text-sm font-semibold tabular-nums">
            {servings} adag
          </span>
          <button
            type="button"
            aria-label="Több adag"
            onClick={() => setServings((s) => s + 1)}
            className="w-7 h-7 inline-flex items-center justify-center rounded-full text-[var(--color-foreground)] hover:bg-[var(--color-muted)] transition"
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      </div>

      {recipe.ingredients.length === 0 ? (
        <p className="text-sm text-[var(--color-muted-foreground)]">
          Nincsenek hozzávalók megadva.
        </p>
      ) : (
        <ul className="space-y-1.5">
          {recipe.ingredients.map((ing, i) => {
            const q = roundQty(ing.qty * factor, ing.unit);
            return (
              <li
                key={i}
                className="flex items-baseline gap-2 text-[15px]"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--color-primary)] shrink-0 translate-y-[-2px]" />
                <span className="tabular-nums font-medium">
                  {formatQty(q)} {ing.unit}
                </span>
                <span className="text-[var(--color-foreground)]">
                  {ing.name}
                </span>
              </li>
            );
          })}
        </ul>
      )}

      <div className="pt-1">
        <Button
          href={`/receptek/${recipe.id}/fozes?adag=${servings}`}
          size="lg"
          fullWidth
          leftIcon={<ChefHat className="w-4 h-4" />}
        >
          Főzés {servings !== recipe.servings ? `(${servings} adag)` : ""}
        </Button>
      </div>
    </Card>
  );
}
