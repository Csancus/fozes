import { describe, expect, it } from "vitest";
import { parseBankText } from "@/lib/bank-ocr";

// Story 10.12 – Revolut havi nézet (valódi tesseract-kimenet a user augusztusi képernyőképeiről):
// egyenleg + hónap-fülek fejléc, „aug. 15. -155 000 Ft” napfejléc napi összeggel, díj-alsor,
// deviza-alsor, „Bankkártya hitelesítése” összeg nélkül, ikon-zaj a név előtt.
const NOW = new Date("2026-11-22T18:00:00");
const rows = (t: string) => parseBankText(t, NOW).map((x) => [x.merchant, x.amount, x.day, x.kind]);

const R01 = `1718 9 COC -. B ESR 7158
437 408.70 Ft
aug. 15., 3:53
június július augusztus szeptember OK
Aprópénz-megtakarítás 1
aug. 15. -155 000 Ft
B Booking.com -154 924,01 Ft
® 3:53--7599 Ft -424,80 €
Apropénz-megtakaritas 1
aug. 14. -37 100 Ft
KK Wiadár Kisállat Klinika -37 000 Ft
9:32 - -100 Ft
Aprópénz-megtakarítás 1
aug. 13. -17 373 Ft`;

const R03 = `17189 CO CP -. e EFR.lI7158
108 610,70 Ft
aug. 24., 18:48
junius julius augusztus szeptember ok
Apropénz-megtakaritas 1
aug. 24. -60 600 Ft
OMV -3 459,18 Ft
7 18:48 - -40,82 Ft -9,48 €
a Ikea -4 110,68 Ft
17:17 - -89,32 Ft -11,26 €
AM Shell -16 67716 Ft
13:59 - -22,84 Ft -45,77 €
Ka Vogelhubergut -36 144,25 Ft
7:42 - -55,75 Ft -99,20 €
Aprópénz-megtakarítás 4
aug. 23. -8 300 Ft`;

const R04 = `1718 0 CO CP . eR 71%a
177 510,70 Ft
aug. 22.,17:23
junius julius augusztus szeptember ok
aug. 22. -92 600 Ft
BILLA BILLA 10 317,31 Ft
WWW 17:23--82,69 Ft -28,34 €
Eni -19 476,93 Ft
16:57 - -23,07 Ft -53,50 €
Hofer -12 672,75 Ft
=? 16:35 -27,25 Ft -34,81 €
e Salzkammergutbah -34 039,12 Ft
Sn -93,50 €
14:38 - -60,88 Ft
B. Salzburg Ag -15 836,38 Ft
Tourism -43,50 €
13:41 - -63,62 Ft
e EasyPark
9:01 - Bankkartya hitelesítése`;

const R06 = `17179 00€£ . B ER. 7158
629 508.70 Ft
aug. 13., 19:02
június július augusztus szeptember OK
Aprópénz-megtakarítás 1
aug. 13. -17 373 Ft
emo, Kacsakő Bisztro -8 820 Ft
19:02 - -80 Ft
oS MAV -1998 Ft
17:54
& Visszatérítés tőle: MÁV +2 625 Ft
© 14:10
ms. Pasa Kebab -2 510 Ft
12:22 - -90 Ft
Mm McDonald's -6 430 Ft
1:10 - -70 Ft
Apropénz-megtakaritas 3`;

describe("Story 10.12 – Revolut havi nézet", () => {
  it("AC1: az egyenleg és a napi összeg nem tétel; a napfejléc adja a napot", () => {
    expect(rows(R01)).toEqual([
      ["Booking.com", 154924, "2026-08-15", "expense"],
      ["Wiadár Kisállat Klinika", 37000, "2026-08-14", "expense"],
    ]);
  });

  it("AC2: elveszett tizedesvessző („16 67716 Ft” → 16 677), ikon-zaj le, láncnév", () => {
    expect(rows(R03)).toEqual([
      ["OMV", 3459, "2026-08-24", "expense"],
      ["IKEA", 4110, "2026-08-24", "expense"],
      ["Shell", 16677, "2026-08-24", "expense"],
      ["Vogelhubergut", 36144, "2026-08-24", "expense"],
    ]);
  });

  it("AC3: kétsoros név a deviza-alsorral is egyben; összeg nélküli hitelesítés nem tétel; „BILLA BILLA” egyszer", () => {
    const r = rows(R04);
    expect(r.map((x) => x[1])).toEqual([10317, 19476, 12672, 34039, 15836]);
    expect(r[0][0]).toBe("BILLA");
    expect(r[4][0]).toBe("Salzburg Ag Tourism");
    expect(r.every((x) => x[2] === "2026-08-22")).toBe(true);
  });

  it("AC4: visszatérítés bevétel a bolt nevével; „oS MAV”, „emo, …”, „Mm …” zaj le", () => {
    expect(rows(R06)).toEqual([
      ["Kacsakő Bisztro", 8820, "2026-08-13", "expense"],
      ["MAV", 1998, "2026-08-13", "expense"],
      ["MÁV", 2625, "2026-08-13", "income"],
      ["Pasa Kebab", 2510, "2026-08-13", "expense"],
      ["McDonald's", 6430, "2026-08-13", "expense"],
    ]);
  });
});
