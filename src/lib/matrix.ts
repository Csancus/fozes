import { canCompare, toBase, fromBase } from "@/lib/units";
import type { Recipe, Unit } from "@/lib/types";

function slugify(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

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

function pickUnit(a: Unit, b: Unit): Unit {
  return UNIT_RANK[a] >= UNIT_RANK[b] ? a : b;
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

export type MatrixCell = { qty: number; unit: Unit };

export type MatrixRow = {
  key: string;
  name: string;
  unit: Unit;
  totalQty: number;
  perRecipe: Map<string, MatrixCell>;
};

export type Matrix = {
  rows: MatrixRow[];
  recipes: { id: string; name: string }[];
};

export function buildMatrix(recipes: Recipe[]): Matrix {
  const byKey = new Map<string, MatrixRow>();

  for (const r of recipes) {
    for (const ing of r.ingredients) {
      const nameKey = slugify(ing.name);
      if (!nameKey) continue;

      let hitKey: string | null = null;
      for (const [k, row] of byKey) {
        if (!k.startsWith(`${nameKey}::`)) continue;
        if (row.unit === ing.unit || canCompare(row.unit, ing.unit)) {
          hitKey = k;
          break;
        }
      }

      if (hitKey) {
        const row = byKey.get(hitKey)!;
        let addQty = ing.qty;

        if (row.unit !== ing.unit && canCompare(row.unit, ing.unit)) {
          const preferred = pickUnit(row.unit, ing.unit);
          if (preferred !== row.unit) {
            const oldUnit = row.unit;
            for (const [rid, c] of row.perRecipe) {
              const base = toBase(c.qty, c.unit).value;
              row.perRecipe.set(rid, {
                qty: fromBase(base, preferred),
                unit: preferred,
              });
            }
            row.totalQty = fromBase(
              toBase(row.totalQty, oldUnit).value,
              preferred
            );
            row.unit = preferred;
          }
          addQty = fromBase(toBase(ing.qty, ing.unit).value, row.unit);
        }

        row.totalQty += addQty;
        const existing = row.perRecipe.get(r.id);
        row.perRecipe.set(r.id, {
          qty: (existing?.qty ?? 0) + addQty,
          unit: row.unit,
        });
      } else {
        const key = `${nameKey}::${ing.unit}`;
        byKey.set(key, {
          key,
          name: ing.name.trim(),
          unit: ing.unit,
          totalQty: ing.qty,
          perRecipe: new Map([[r.id, { qty: ing.qty, unit: ing.unit }]]),
        });
      }
    }
  }

  const rows: MatrixRow[] = [...byKey.values()]
    .map((row) => ({
      key: row.key,
      name: row.name,
      unit: row.unit,
      totalQty: round2(row.totalQty),
      perRecipe: new Map(
        [...row.perRecipe].map(
          ([rid, c]) =>
            [rid, { qty: round2(c.qty), unit: c.unit }] as [string, MatrixCell]
        )
      ),
    }))
    .sort((a, b) => a.name.localeCompare(b.name, "hu"));

  return {
    rows,
    recipes: recipes.map((r) => ({ id: r.id, name: r.name })),
  };
}
