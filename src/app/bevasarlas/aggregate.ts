import { slug } from "@/lib/redis";
import { canCompare, toBase, fromBase } from "@/lib/units";
import type { Recipe, PantryItem, ShoppingListItem, Unit } from "@/lib/types";

// Prefer the "larger" unit when consolidating (kg over g, l over ml).
const UNIT_RANK: Record<Unit, number> = {
  db: 0,
  csipet: 0,
  kk: 1,
  ek: 2,
  csomag: 0,
  g: 1,
  dkg: 2,
  kg: 3,
  ml: 1,
  dl: 2,
  l: 3,
};

type Bucket = {
  name: string;
  unit: Unit;
  qty: number;
};

function pickUnit(a: Unit, b: Unit): Unit {
  return UNIT_RANK[a] >= UNIT_RANK[b] ? a : b;
}

function addToBucket(bucket: Bucket, addQty: number, addUnit: Unit): Bucket {
  if (bucket.unit === addUnit) {
    return { ...bucket, qty: bucket.qty + addQty };
  }
  if (canCompare(bucket.unit, addUnit)) {
    const preferred = pickUnit(bucket.unit, addUnit);
    const totalBase = toBase(bucket.qty, bucket.unit).value + toBase(addQty, addUnit).value;
    return { ...bucket, unit: preferred, qty: fromBase(totalBase, preferred) };
  }
  // fallback: incompatible; caller should have picked a different key
  return bucket;
}

/**
 * Aggregate ingredients across recipes, subtract pantry stock, return ShoppingListItem[].
 *
 * Rules:
 * 1. Collect all ingredients keyed by slug(name)+unit-base — compatible units merge, incompatible keep separate.
 * 2. For each aggregated ingredient, sum matching pantry items (by slug) of comparable unit into the ingredient's unit.
 * 3. `have` = pantry sum in ingredient unit, `need` = max(0, qty - have).
 */
export function aggregateIngredients(
  recipes: Recipe[],
  pantry: PantryItem[]
): ShoppingListItem[] {
  const buckets = new Map<string, Bucket>();

  for (const r of recipes) {
    for (const ing of r.ingredients) {
      const nameKey = slug(ing.name);
      if (!nameKey) continue;

      // Find an existing bucket for this name where units are compatible (or exact match).
      let hitKey: string | null = null;
      for (const [k, b] of buckets) {
        if (!k.startsWith(`${nameKey}::`)) continue;
        if (b.unit === ing.unit || canCompare(b.unit, ing.unit)) {
          hitKey = k;
          break;
        }
      }
      if (hitKey) {
        const b = buckets.get(hitKey)!;
        buckets.set(hitKey, addToBucket(b, ing.qty, ing.unit));
      } else {
        const key = `${nameKey}::${ing.unit}`;
        buckets.set(key, { name: ing.name.trim(), unit: ing.unit, qty: ing.qty });
      }
    }
  }

  // Group pantry by slug(name) for lookup.
  const pantryByName = new Map<string, PantryItem[]>();
  for (const p of pantry) {
    const k = slug(p.name);
    if (!k) continue;
    const arr = pantryByName.get(k) ?? [];
    arr.push(p);
    pantryByName.set(k, arr);
  }

  const items: ShoppingListItem[] = [];
  for (const [key, b] of buckets) {
    const nameKey = key.split("::")[0];
    const matches = pantryByName.get(nameKey) ?? [];
    let have = 0;
    for (const p of matches) {
      if (p.unit === b.unit) {
        have += p.qty;
      } else if (canCompare(p.unit, b.unit)) {
        const baseSum = toBase(p.qty, p.unit).value;
        have += fromBase(baseSum, b.unit);
      }
    }
    const need = Math.max(0, b.qty - have);
    items.push({
      name: b.name,
      qty: Math.round(b.qty * 100) / 100,
      unit: b.unit,
      have: Math.round(have * 100) / 100,
      need: Math.round(need * 100) / 100,
      checked: false,
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name, "hu"));
  return items;
}
