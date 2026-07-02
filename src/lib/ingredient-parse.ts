import type { Ingredient, Unit } from "./types";
import { UNITS } from "./units";

const UNIT_RE = new RegExp(`^(${UNITS.join("|")})$`, "i");

export function parseIngredientLine(line: string): Ingredient | null {
  const l = line.trim();
  if (!l) return null;

  const m = l.match(/^([0-9]+(?:[.,][0-9]+)?)\s*([a-zA-ZáéíóöőúüűÁÉÍÓÖŐÚÜŰ]+)\s+(.+)$/);
  if (m) {
    const qty = Number(m[1].replace(",", "."));
    const maybeUnit = m[2].toLowerCase();
    if (UNIT_RE.test(maybeUnit)) {
      return { qty, unit: maybeUnit as Unit, name: m[3].trim() };
    }
    return { qty, unit: "db", name: `${m[2]} ${m[3]}`.trim() };
  }

  const m2 = l.match(/^([0-9]+(?:[.,][0-9]+)?)\s+(.+)$/);
  if (m2) {
    return { qty: Number(m2[1].replace(",", ".")), unit: "db", name: m2[2].trim() };
  }

  return { qty: 1, unit: "db", name: l };
}

export function parseIngredientText(text: string): Ingredient[] {
  return text
    .split(/\r?\n/)
    .map(parseIngredientLine)
    .filter((x): x is Ingredient => !!x);
}

export function stringifyIngredient(i: Ingredient): string {
  return `${i.qty} ${i.unit} ${i.name}`;
}

export function stringifyIngredients(list: Ingredient[]): string {
  return list.map(stringifyIngredient).join("\n");
}
