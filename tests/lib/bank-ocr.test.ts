import { describe, expect, it } from "vitest";
import { cleanMerchant, parseBankText } from "@/lib/bank-ocr";

// Story 10.1 – bank-képernyőkép és blokk szövegének feldolgozása valós-szerű
// (tesseract-kimenetből vett) OCR-szövegeken, a tipikus hibákkal együtt.
const NOW = new Date("2026-11-20T12:00:00");

describe("Story 10.1 – bank-ocr parser", () => {
  it("AC4: K&H-szerű lista – név fölötte, alcím + idő + összeg egy sorban; az idő nem keveredik az összegbe", () => {
    const text = [
      "9:41 5G 87%",
      "Számlatörténet",
      "Egyenleg",
      "284 512 Ft",
      "November 2026",
      "Ma",
      "SPAR Budaörs",
      "Kártyás vásárlás - 14:26 12345 Ft",
      "Tegnap",
      "Wolt Budapest .",
      "Kártyás vásárlás . 19:02 -4 990 Ft",
      "nov. 17.",
      "Fizetés ACME Kft.",
      "[Átutalás - 06:00 +612 000 Ft",
      "2026. 11. 15.",
      "dm drogerie markt .",
      "Kártyás vásárlás . 16:33 3 299 Ft",
    ].join("\n");
    const tx = parseBankText(text, NOW);
    expect(tx).toEqual([
      { kind: "expense", amount: 12345, merchant: "Spar", day: "2026-11-20", note: "" },
      { kind: "expense", amount: 4990, merchant: "Wolt", day: "2026-11-19", note: "" },
      { kind: "income", amount: 612000, merchant: "Fizetés ACME Kft", day: "2026-11-17", note: "" },
      { kind: "expense", amount: 3299, merchant: "dm", day: "2026-11-15", note: "" },
    ]);
  });

  it("AC4: Revolut-szerű lista – név + összeg egy sorban, alcím alatta; tizedes összeg, HUF", () => {
    const text = [
      "Ma",
      "Netflix.com -4 990,00 Ft",
      "Előfizetés · 09:12",
      "Bolt -2 350,50 Ft",
      "Utazás · 08:31",
      "nov. 16.",
      "Spotify -1 990 HUF",
      "Előfizetés · 00:01",
    ].join("\n");
    expect(parseBankText(text, NOW)).toEqual([
      { kind: "expense", amount: 4990, merchant: "Netflix", day: "2026-11-20", note: "" },
      { kind: "expense", amount: 2351, merchant: "Bolt", day: "2026-11-20", note: "" },
      { kind: "expense", amount: 1990, merchant: "Spotify", day: "2026-11-16", note: "" },
    ]);
  });

  it("AC4: lekicsinyített kép – az alcím (kategória + idő) nem lehet boltnév, a fölötte lévő név az", () => {
    const text = [
      "Ma",
      "Netflix.com",
      "Előfizetés : 09:12 -4 990,00 Ft",
      "Bolt",
      "Utazás - 08:31 -2 350,00 Ft",
      "nov. 16.",
      "Starbucks",
      "Kávé - 07:45 -1890 Ft",
    ].join("\n");
    const tx = parseBankText(text, NOW);
    expect(tx.map((t) => t.merchant)).toEqual(["Netflix", "Bolt", "Starbucks"]);
    expect(tx.map((t) => t.amount)).toEqual([4990, 2350, 1890]);
  });

  it("AC4: tipikus OCR-hibák – O/e/@ a számban, F+ az Ft helyett, aláhúzás a mínusz helyett", () => {
    const text = ["Tegnap", "IKEA Budaörs _45 99O Ft", "Tesco 1 2e5 F+", "MOL -3 @55 Ft"].join("\n");
    expect(parseBankText(text, NOW).map((t) => [t.merchant, t.amount, t.kind])).toEqual([
      ["IKEA", 45990, "expense"],
      ["Tesco", 1205, "expense"],
      ["MOL", 3055, "expense"],
    ]);
  });

  it("AC4: az egyenleg (címke alatti összeg) és az állapotsor nem tétel; dátum-fejléc nélkül is olvas", () => {
    const text = ["21:07 4G 52%", "Egyenleg", "284 512 Ft", "Lidl 0123 -8 761 Ft", "Kártyás vásárlás · 18:40"].join("\n");
    expect(parseBankText(text, NOW)).toEqual([
      { kind: "expense", amount: 8761, merchant: "Lidl", day: "2026-11-20", note: "" },
    ]);
  });

  it("AC5: blokk – egy tétel a végösszeggel, a dátum és a cégnév a blokkról; a tétel-összeg ellenőrzi a végösszeget", () => {
    const text = [
      "SPAR Magyarország Kft.",
      "2040 Budaörs, Kinizsi u. 2.",
      "Adószám: 10485824-2-44",
      "NYUGTA",
      "TEJ 2,8% 1L 389 Ft",
      "KENYÉR FEHÉR 649 Ft",
      "BANÁN 1,2 kg 718 Ft",
      "SAJT TRAPPISTA 1 299 Ft",
      "ÖSSZESEN: 3 e55 Ft", // OCR: 0 → e
      "BANKKÁRTYA 3 955 Ft", // OCR: 0 → 9
      "2026,11.18 17:42", // OCR: pont → vessző
    ].join("\n");
    expect(parseBankText(text, NOW)).toEqual([
      { kind: "expense", amount: 3055, merchant: "Spar", day: "2026-11-18", note: "4 tétel a blokkon" },
    ]);
  });

  it("AC5: blokk pénznem nélküli végösszeggel – a kártyás fizetés sora erősíti meg", () => {
    const text = ["Lidl Magyarország Bt.", "NYUGTA", "KIFLI 89", "ÖSSZESEN: 1 234", "BANKKÁRTYA 1 234 Ft", "2026.11.02"].join("\n");
    expect(parseBankText(text, NOW)).toEqual([
      { kind: "expense", amount: 1234, merchant: "Lidl", day: "2026-11-02", note: "" },
    ]);
  });

  it("AC4: boltnév-takarítás – ikonból olvasott zaj és záró írásjel le", () => {
    expect(cleanMerchant("[Átutalás")).toBe("Átutalás");
    expect(cleanMerchant("Anna Kovács or")).toBe("Anna Kovács");
    expect(cleanMerchant("dm drogerie markt .")).toBe("dm drogerie markt");
    expect(cleanMerchant("Wolt Budapest    I")).toBe("Wolt Budapest");
    expect(cleanMerchant("Bolt")).toBe("Bolt");
  });
});
