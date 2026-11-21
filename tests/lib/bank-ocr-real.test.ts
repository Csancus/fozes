import { describe, it, expect } from "vitest";
import { parseBankText } from "@/lib/bank-ocr";
import { fold } from "@/lib/ocr/postprocess";

// Story 10.5 – a user valódi képernyőképeinek tesseract-kimenete (scripts/ocr mérés,
// tests/fixtures/ocr/real-*), betűre úgy, ahogy a felismerő adta.
const NOW = new Date("2026-11-20T12:00:00");

const REVOLUT_1 = "2148 Om Hm Ro eR 71%m\n102 117,36 Ft\nnov. 13., 21:10\nugusztus szeptember október november\nWe, HUF > CZK -100 000 Ft\n21:10 +6 648,16 KC\nKlasterni pivovar ~~ -21983,52 Ft\ns Strahov -1463 Kö\n19:08 - -16,48 Ft\no Bakeshop -1730,20 Ft\n15:25 - -69,80 Ft -115 KC\n4 Havelska Koruna -4 524,76 Ft\nKORA 14:44 + -75,24 Ft -301 Ké\nKfc -3 315,62 Ft\n4 3:41--84,38 Ft -220 Kö\nMcCarthy's Irish -13 260,62 Ft\nS Pub -880 Ké\n2:23 --39,38 Ft\nApropénz-megtakaritas 5";
const REVOLUT_2 = "2148 QO Hm ®@ = R QAR 7198\n102 117.36 Ft\nnov. 13., 21:10\nugusztus szeptember október november\n\"a HUF - CZK -100 000 Ft\n2110 +6 648,16 KC\nKlasterni pivovar -21983,52 Ft\n»’ Strahov -1 463 Kö\n19:08 - -16,48 Ft\no Bakeshop -1730,20 Ft\n15:25 : -69,80 Ft -115 KC\n4 . . Havelská Koruna -4 524,76 Ft\ns 14:44 - -75,24 Ft -301 KC\nKfc -3 315,62 Ft\nSs 3:41--84,38 Ft -220 KC\nMcCarthy's Irish ~~ -13 260,62 Ft\nRi Pub -880 Ké\n2:23 --39,38 Ft\nAprépénz-megtakaritas 5";
const ERSTE_ROSSZ_EV = "2121 CZ @&ER B = 75% =\n€- CZARTH CSANAD PETER\nTranzakciok Funkciók Információ\nAugusztus 2026\nIR\n3 GoBuda Mozi -4 900 Ft\nA? 5026.08. 05.\nHitelkártya használat\n3LIDL Igazan megeri 17 -25 333 Ft\n2026. 08. 05.\nHitelkártya használat\n3LIDL Igazan megeri 17 -1324 Ft\n2026. 08. 04.\nHitelkártya használat\nMm McDonalds 34800006 -8 060 Ft\n2026. 08. 03.\nHitelkartya hasznalat\n» Perem Bisztro -4 347 Ft\nV 2026.08.03.\nHitelkartya hasznalat";

const REVOLUT_VART = [
  ["Klasterni pivovar Strahov", 21983],
  ["Bakeshop", 1730],
  ["Havelska Koruna", 4524],
  ["KFC", 3315],
  ["McCarthy's Irish Pub", 13260],
];

describe("Story 10.5 – Revolut valódi OCR-szöveggel", () => {
  it("AC1: állapotsor, pénzváltás, korona (KC/Kö/Ké) és díj-alsor nem tétel; ikon-zaj le a névről", () => {
    for (const text of [REVOLUT_1, REVOLUT_2]) {
      const txs = parseBankText(text, NOW);
      // az ékezet menetenként változik („Havelska” / „Havelská”) – ékezet nélkül hasonlítunk
      expect(txs.map((t) => [fold(t.merchant), t.amount])).toEqual(REVOLUT_VART.map(([m, a]) => [fold(String(m)), a]));
      expect(txs.every((t) => t.day === "2026-11-13" && t.kind === "expense")).toBe(true);
    }
  });
});

describe("Story 10.5 – Erste valódi OCR-szöveggel", () => {
  it("AC2: elrontott évszámú dátum („5026.08. 05.”) esetén a következő tétel napja", () => {
    const txs = parseBankText(ERSTE_ROSSZ_EV, NOW);
    expect(txs.map((t) => [t.merchant, t.amount, t.day])).toEqual([
      ["GoBuda Mozi", 4900, "2026-08-05"],
      ["Lidl", 25333, "2026-08-05"],
      ["Lidl", 1324, "2026-08-04"],
      ["McDonald's", 8060, "2026-08-03"],
      ["Perem Bisztro", 4347, "2026-08-03"],
    ]);
  });
});
