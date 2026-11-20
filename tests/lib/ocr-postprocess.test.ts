import { describe, expect, it } from "vitest";
import { cleanOcrText, findAmounts, findDate, isJunkLine, parseHufNumber } from "@/lib/ocr/postprocess";

// Story 10.1 – szám-, összeg- és dátum-utófeldolgozás tipikus OCR-hibákkal.
const NOW = new Date("2026-11-20T12:00:00");

describe("Story 10.1 – OCR utófeldolgozás", () => {
  it("AC3: magyar összegformák számmá (ezres szóköz/pont, tizedesvessző, angol forma)", () => {
    expect(parseHufNumber("12 345")).toBe(12345);
    expect(parseHufNumber("12.345")).toBe(12345);
    expect(parseHufNumber("4 990,00")).toBe(4990);
    expect(parseHufNumber("2 350,50")).toBe(2350); // fillér levágva (Story 10.4)
    expect(parseHufNumber("1990")).toBe(1990);
    expect(parseHufNumber("4,990.00")).toBe(4990);
    expect(parseHufNumber("33 3 299")).toBeNull(); // hibás tagolás
  });

  it("AC3: összegek egy sorban – előjel, Ft/HUF; az idő (14:26) nem olvad az összegbe", () => {
    expect(findAmounts("Kártyás vásárlás · 16:33 3 299 Ft").map((a) => a.value)).toEqual([3299]);
    expect(findAmounts("Átutalás - 06:00 +612 000 Ft")).toMatchObject([{ value: 612000, sign: "+" }]);
    expect(findAmounts("Netflix.com -4 990,00 Ft")).toMatchObject([{ value: 4990, sign: "-" }]);
    expect(findAmounts("Spotify -1 990 HUF")).toMatchObject([{ value: 1990, currency: true }]);
    expect(findAmounts("November 2026")).toEqual([]);
    expect(findAmounts("ÖSSZESEN: 3 055", true).map((a) => a.value)).toEqual([3055]);
    expect(findAmounts("2026.11.18 17:42", true)).toEqual([]);
  });

  it("AC3: cleanOcrText – O/e/@/l a számban, F+ / Et / FT az Ft helyett, aláhúzás a mínusz helyett", () => {
    expect(cleanOcrText("ÖSSZESEN: 3 e55 Ft")).toBe("ÖSSZESEN: 3 055 Ft");
    expect(cleanOcrText("BANKKÁRTYA 3 @55 Ft")).toBe("BANKKÁRTYA 3 055 Ft");
    expect(cleanOcrText("Tesco l 2O0 F+")).toBe("Tesco 1 200 Ft");
    expect(cleanOcrText("BANÁN 1,2 kg 718 Et")).toBe("BANÁN 1,2 kg 718 Ft"); // a „kg” g-je marad
    expect(cleanOcrText("IKEA Budaörs _45 990 Ft")).toBe("IKEA Budaörs -45 990 Ft");
    expect(cleanOcrText("Gázszámla: 18 450 FT")).toBe("Gázszámla: 18 450 Ft");
    expect(cleanOcrText("Lidl 0123 −8 761 Ft")).toBe("Lidl 0123 -8 761 Ft");
    // betűs szöveg nem válik számmá
    expect(cleanOcrText("Bolt -2 350 Ft")).toBe("Bolt -2 350 Ft");
  });

  it("AC3: szemétsorok (zajból olvasott jelek) kiesnek, a rövid értelmes sorok maradnak", () => {
    expect(isJunkLine("r Ty")).toBe(true);
    expect(isJunkLine("a  4")).toBe(true);
    expect(isJunkLine(", 4 1 [4")).toBe(true);
    expect(isJunkLine("—    9\" ,")).toBe(true);
    expect(isJunkLine("Ma")).toBe(false);
    expect(isJunkLine("Bolt")).toBe(false);
    expect(isJunkLine("9:41 5G 87%")).toBe(false);
    expect(cleanOcrText("Köszönjük!\nr Ty\na  4\nMa")).toBe("Köszönjük!\nMa");
  });

  it("AC3: dátumformák – „2026. 11. 15.”, OCR-vessző, „nov. 17.”, „16 Nov 2026”, Ma/Tegnap", () => {
    expect(findDate("2026. 11. 15.", NOW)?.day).toBe("2026-11-15");
    expect(findDate("2026.11.18 17:42", NOW)?.day).toBe("2026-11-18");
    expect(findDate("2026,11.18 17:42", NOW)?.day).toBe("2026-11-18");
    expect(findDate("2026-11-02", NOW)?.day).toBe("2026-11-02");
    expect(findDate("nov. 17.", NOW)?.day).toBe("2026-11-17");
    expect(findDate("november 3", NOW)?.day).toBe("2026-11-03");
    expect(findDate("Nov 16", NOW)?.day).toBe("2026-11-16");
    expect(findDate("16 Nov 2026", NOW)?.day).toBe("2026-11-16");
    expect(findDate("Ma", NOW)?.day).toBe("2026-11-20");
    expect(findDate("Tegnap", NOW)?.day).toBe("2026-11-19");
    expect(findDate("Yesterday", NOW)?.day).toBe("2026-11-19");
  });

  it("AC3: év nélküli jövőbeli dátum az előző évre esik; érvénytelen dátum nincs", () => {
    expect(findDate("dec. 28.", NOW)?.day).toBe("2025-12-28");
    expect(findDate("2026. 02. 30.", NOW)).toBeNull();
    expect(findDate("Bolt -2 350 Ft", NOW)).toBeNull();
  });
});
