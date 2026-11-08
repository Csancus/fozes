import { describe, expect, it } from "vitest";
import { estimateRecipeCost } from "@/lib/cost";
import type { PantryItem } from "@/lib/types";

const item = (p: Partial<PantryItem>) => ({ name: "liszt", qty: 1, unit: "kg", price: 400, ...p }) as PantryItem;

// Story 3.5 (visszamenőleges) – recept költségbecslés a spájz árai alapján.
describe("Story 3.5 – költségbecslés", () => {
  it("AC: egységátváltással számol (1 kg 400 Ft → 50 dkg = 200 Ft)", () => {
    const r = estimateRecipeCost([{ qty: 50, unit: "dkg", name: "Liszt" }], [item({})]);
    expect(r.total).toBe(200);
    expect(r.breakdown[0].totalCost).toBe(200);
  });

  it("AC: több egyező tételnél átlagár", () => {
    const r = estimateRecipeCost(
      [{ qty: 1, unit: "kg", name: "liszt" }],
      [item({ price: 400 }), item({ price: 600 })]
    );
    expect(r.total).toBe(500);
  });

  it("AC: ár nélkül / nem összehasonlítható egységnél nincs becslés", () => {
    const r = estimateRecipeCost(
      [{ qty: 1, unit: "l", name: "liszt" }, { qty: 2, unit: "db", name: "tojás" }],
      [item({}), item({ name: "tojás", unit: "db", price: null })]
    );
    expect(r.total).toBeNull();
    expect(r.breakdown.every((b) => b.totalCost == null)).toBe(true);
  });
});
