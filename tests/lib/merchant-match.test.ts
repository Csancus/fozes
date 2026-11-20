import { describe, expect, it } from "vitest";
import {
  buildMerchantProfiles,
  dedupeAcrossImages,
  defaultPersonId,
  matchMerchant,
} from "@/lib/merchant-match";
import type { Expense } from "@/lib/types";

function exp(p: Partial<Expense>): Expense {
  return {
    id: Math.random().toString(36),
    kind: "expense",
    amount: 1000,
    merchant: "",
    categoryId: null,
    paymentMethodId: null,
    personId: null,
    projectId: null,
    groupId: null,
    nature: "avg",
    review: false,
    planned: false,
    tax: false,
    note: "",
    spentAt: 0,
    createdAt: 0,
    ...p,
  };
}

const history = [
  exp({ merchant: "LIDL", categoryId: "food-old", spentAt: 1 }),
  exp({ merchant: "Lidl", categoryId: "food", paymentMethodId: "card", personId: "anna", spentAt: 5 }),
  exp({ merchant: "Perem Bisztró", categoryId: "resto", projectId: "p1", nature: "project", spentAt: 3 }),
  exp({ merchant: "McDonald's", categoryId: "resto", spentAt: 2 }),
  exp({ kind: "income", merchant: "ACME Kft", categoryId: "salary", spentAt: 4 }),
];
const profiles = buildMerchantProfiles(history);

describe("Story 10.3 – korábbi, hasonló nevű tétel átvétele", () => {
  it("AC1: azonos/nagyon hasonló névre a korábbi nevet és a LEGUTÓBBI paramétereket adja", () => {
    const lidl = matchMerchant("Lidl Igazan megeri 17", "expense", profiles);
    expect(lidl).toMatchObject({ merchant: "Lidl", categoryId: "food", paymentMethodId: "card", personId: "anna", count: 2 });
    expect(matchMerchant("Perem Bisztro", "expense", profiles)).toMatchObject({
      merchant: "Perem Bisztró",
      projectId: "p1",
      nature: "project",
    });
    expect(matchMerchant("McDonalds", "expense", profiles)?.merchant).toBe("McDonald's");
  });

  it("AC1: eltérő név vagy irány esetén nincs találat", () => {
    expect(matchMerchant("GoBuda Mozi", "expense", profiles)).toBeNull();
    expect(matchMerchant("Aldi", "expense", profiles)).toBeNull();
    expect(matchMerchant("ACME Kft", "expense", profiles)).toBeNull();
    expect(matchMerchant("ACME Kft.", "income", profiles)?.categoryId).toBe("salary");
  });

  it("AC2: a Ki(nek) alapértéke a belépett felhasználó, különben Csanád", () => {
    const persons = [
      { id: "a", name: "Anna", color: "rose", createdAt: 0 },
      { id: "c", name: "Csanád", color: "sky", createdAt: 0 },
    ];
    expect(defaultPersonId(persons, "Czárth Csanád Péter")).toBe("c");
    expect(defaultPersonId(persons, "Kovács Anna")).toBe("a");
    expect(defaultPersonId(persons, "Valaki Más")).toBe("c");
    expect(defaultPersonId([persons[0]], "Valaki")).toBe("");
  });

  it("AC3: képek közti duplikáció kiszűrve, egy képen belül marad", () => {
    const r = (merchant: string, amount: string, spentAt = "2026-08-05") => ({
      kind: "expense",
      merchant,
      amount,
      spentAt,
    });
    const { rows, removed } = dedupeAcrossImages([
      [r("Lidl", "1324"), r("Lidl", "1324"), r("GoBuda Mozi", "4900")],
      [r("LIDL", "1324"), r("GoBuda Mozi", "4900"), r("GoBuda Mozi", "4900", "2026-08-06"), r("KFC", "3315")],
    ]);
    expect(removed).toBe(2);
    expect(rows.map((x) => `${x.merchant}:${x.amount}:${x.spentAt}`)).toEqual([
      "Lidl:1324:2026-08-05",
      "Lidl:1324:2026-08-05",
      "GoBuda Mozi:4900:2026-08-05",
      "GoBuda Mozi:4900:2026-08-06",
      "KFC:3315:2026-08-05",
    ]);
  });
});
