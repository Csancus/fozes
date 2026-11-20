import { describe, expect, it } from "vitest";
import { normalizeMerchant, parseBankText } from "@/lib/bank-ocr";

const NOW = new Date(2026, 7, 20);

// Erste-app (sötét) képernyőkép tesseract-szövege, tipikus zajjal: levágott felső tétel,
// ikonból olvasott jelek, kategória-pirulák, állapotsor, gombok.
const ERSTE = `21:21 9 & R e 75%
< CZARTH CSANAD PETER
Tranzakciok Funkciok Informacio
Augusztus 2026
Kozossegi kozlekedes
@ GoBuda Mozi -4 900 Ft
2026. 08. 05.
Hitelkartya hasznalat
Szorakozas
3LIDL Igazan megeri 17 -25 333 Ft
2026. 08. 05.
Hitelkártya használat
Élelmiszer
3LIDL Igazan megeri 17 -1 324 Ft
2026. 08. 04.
Hitelkártya használat
Élelmiszer
M McDonalds 34800006 -8 060 Ft
2026. 08. 03.
Hitelkártya használat
Éttermek és kávézók
Perem Bisztro -4 347 Ft
2026. 08. 03.
Hitelkártya használat
Éttermek és kávézók
Q Ill`;

describe("Story 10.2 – Erste képernyőkép", () => {
  it("AC1: minden tétel a SAJÁT (alatta lévő) dátumával, összeggel, egységes boltnévvel", () => {
    const txs = parseBankText(ERSTE, NOW);
    expect(txs.map((t) => [t.merchant, t.amount, t.day, t.kind])).toEqual([
      ["GoBuda Mozi", 4900, "2026-08-05", "expense"],
      ["Lidl", 25333, "2026-08-05", "expense"],
      ["Lidl", 1324, "2026-08-04", "expense"],
      ["McDonald's", 8060, "2026-08-03", "expense"],
      ["Perem Bisztro", 4347, "2026-08-03", "expense"],
    ]);
  });

  it("AC2: a bank kategória-címkéje a tételhez kerül", () => {
    const txs = parseBankText(ERSTE, NOW);
    expect(txs.map((t) => t.bankCategory)).toEqual([
      "Szorakozas",
      "Élelmiszer",
      "Élelmiszer",
      "Éttermek és kávézók",
      "Éttermek és kávézók",
    ]);
  });

  it("AC3: fejléc-dátumos bankoknál (dátum a tételek felett) marad a régi működés", () => {
    const txs = parseBankText(`2026. 08. 05.\nSpar -1 200 Ft\nAldi -3 000 Ft\n2026. 08. 04.\nShell -15 000 Ft`, NOW);
    expect(txs.map((t) => [t.merchant, t.day])).toEqual([
      ["Spar", "2026-08-05"],
      ["Aldi", "2026-08-05"],
      ["Shell", "2026-08-04"],
    ]);
  });

  it("AC1: boltnév-egységesítés", () => {
    expect(normalizeMerchant("3LIDL Igazan megeri 17")).toBe("Lidl");
    expect(normalizeMerchant("McDonalds 34800006")).toBe("McDonald's");
    expect(normalizeMerchant("Perem Bisztro 3480006")).toBe("Perem Bisztro");
    expect(normalizeMerchant("GoBuda Mozi")).toBe("GoBuda Mozi");
    expect(normalizeMerchant("Bolt")).toBe("Bolt");
  });
});

describe("Story 10.2 – bank-kategória → saját kategória", () => {
  const cats = [
    { id: "c1", name: "Bevásárlás" },
    { id: "c2", name: "Étterem" },
    { id: "c3", name: "Szórakozás" },
  ];
  it("AC2: szinonimával és ékezet nélkül is párosít, ismeretlennél üres", async () => {
    const { matchCategory } = await import("@/lib/bank-ocr");
    expect(matchCategory("Élelmiszer", cats)).toBe("c1");
    expect(matchCategory("Éttermek és kávézók", cats)).toBe("c2");
    expect(matchCategory("Szorakozas", cats)).toBe("c3");
    expect(matchCategory("Biztosítás", cats)).toBe("");
    expect(matchCategory(undefined, cats)).toBe("");
  });
});
