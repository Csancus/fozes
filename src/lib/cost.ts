import type { Ingredient, PantryItem } from "./types";
import { canCompare, toBase, fromBase } from "./units";
import { slug } from "./redis";

export type IngredientCost = {
  name: string;
  qty: number;
  unit: string;
  unitPrice: number | null; // avg Ft per ingredient unit
  totalCost: number | null; // qty * unitPrice
};

export function estimateRecipeCost(
  ingredients: Ingredient[],
  pantry: PantryItem[]
): { total: number | null; breakdown: IngredientCost[] } {
  const breakdown: IngredientCost[] = ingredients.map((ing) => {
    const ingSlug = slug(ing.name);
    const matches = pantry.filter(
      (p) =>
        p.price != null &&
        p.qty > 0 &&
        slug(p.name) === ingSlug &&
        canCompare(p.unit, ing.unit)
    );

    if (matches.length === 0) {
      return {
        name: ing.name,
        qty: ing.qty,
        unit: ing.unit,
        unitPrice: null,
        totalCost: null,
      };
    }

    // Compute unit price in ingredient's unit for each match, then average.
    const unitPrices: number[] = [];
    for (const p of matches) {
      // Convert the pantry item's qty into the ingredient's unit.
      const base = toBase(p.qty, p.unit);
      const qtyInIngUnit = fromBase(base.value, ing.unit);
      if (qtyInIngUnit > 0 && p.price != null) {
        unitPrices.push(p.price / qtyInIngUnit);
      }
    }

    if (unitPrices.length === 0) {
      return {
        name: ing.name,
        qty: ing.qty,
        unit: ing.unit,
        unitPrice: null,
        totalCost: null,
      };
    }

    const avgUnitPrice =
      unitPrices.reduce((s, v) => s + v, 0) / unitPrices.length;
    const totalCost = Math.round(avgUnitPrice * ing.qty);

    return {
      name: ing.name,
      qty: ing.qty,
      unit: ing.unit,
      unitPrice: avgUnitPrice,
      totalCost,
    };
  });

  const hasAny = breakdown.some((b) => b.totalCost != null);
  const total = hasAny
    ? Math.round(
        breakdown.reduce((s, b) => s + (b.totalCost ?? 0), 0)
      )
    : null;

  return { total, breakdown };
}
