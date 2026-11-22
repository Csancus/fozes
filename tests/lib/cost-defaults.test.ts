import { describe, expect, it } from "vitest";
import {
  ensureCostDefaults,
  listExpenseCategories,
  listIncomeCategories,
  listPaymentMethods,
  createExpenseCategory,
} from "@/lib/data";

// Story 10.11 – gyorsabb oldalváltás: az alapértékek egy körben ellenőrizve.
describe("Story 10.11 – ensureCostDefaults", () => {
  it("AC2: üres háztartásnál létrehozza a kért alapértékeket", async () => {
    const hh = "hh-def-1";
    await ensureCostDefaults(hh, { expense: true, income: true, payment: true });
    expect((await listExpenseCategories(hh)).length).toBeGreaterThan(0);
    expect((await listIncomeCategories(hh)).length).toBeGreaterThan(0);
    expect((await listPaymentMethods(hh)).length).toBeGreaterThan(0);
  });

  it("AC2: amit nem kértek, azt nem hozza létre", async () => {
    const hh = "hh-def-2";
    await ensureCostDefaults(hh, { expense: true, income: false, payment: false });
    expect((await listExpenseCategories(hh)).length).toBeGreaterThan(0);
    expect(await listIncomeCategories(hh)).toEqual([]);
    expect(await listPaymentMethods(hh)).toEqual([]);
  });

  it("AC2: meglévő kategóriákhoz nem tesz alapértelmezettet", async () => {
    const hh = "hh-def-3";
    await createExpenseCategory(hh, { name: "Saját", color: "sky", icon: "tag" });
    await ensureCostDefaults(hh);
    expect((await listExpenseCategories(hh)).map((c) => c.name)).toEqual(["Saját"]);
  });
});
