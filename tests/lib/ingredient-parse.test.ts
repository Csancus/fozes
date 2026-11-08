import { describe, expect, it } from "vitest";
import { parseIngredientLine, parseIngredientText, stringifyIngredients } from "@/lib/ingredient-parse";

// Story 3.1 (visszamenőleges) – alapanyag-sorok beolvasása szövegből.
describe("Story 3.1 – alapanyag-parser", () => {
  it("AC: mennyiség + egység + név", () => {
    expect(parseIngredientLine("50 dkg liszt")).toEqual({ qty: 50, unit: "dkg", name: "liszt" });
    expect(parseIngredientLine("1,5 l tej")).toEqual({ qty: 1.5, unit: "l", name: "tej" });
  });

  it("AC: ismeretlen egységnél db és a szó a név része", () => {
    expect(parseIngredientLine("2 nagy hagyma")).toEqual({ qty: 2, unit: "db", name: "nagy hagyma" });
  });

  it("AC: csak név → 1 db; üres sor → kimarad", () => {
    expect(parseIngredientLine("só")).toEqual({ qty: 1, unit: "db", name: "só" });
    expect(parseIngredientText("3 tojás\n\n  \n1 kk só")).toEqual([
      { qty: 3, unit: "db", name: "tojás" },
      { qty: 1, unit: "kk", name: "só" },
    ]);
  });

  it("oda-vissza alakítás stabil", () => {
    const list = parseIngredientText("50 dkg liszt\n2 db tojás");
    expect(parseIngredientText(stringifyIngredients(list))).toEqual(list);
  });
});
