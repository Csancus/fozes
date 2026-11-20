import { describe, expect, it } from "vitest";
import {
  makePeriod,
  monthGrid,
  parsePeriod,
  periodHref,
  periodLabel,
  shiftPeriod,
} from "@/lib/period";

const TODAY = "2026-11-20"; // péntek

describe("Story 9.1 – Aktuális: nap / hét / hónap", () => {
  it("AC1: paraméter nélkül (vagy hibás értékkel) a mai nap tölt be", () => {
    for (const sp of [{}, { nap: "2026-02-30" }, { het: "x" }, { ho: "2026-13" }]) {
      const p = parsePeriod(sp, TODAY);
      expect(p).toMatchObject({ kind: "day", start: TODAY, end: TODAY, isCurrent: true });
    }
    expect(periodHref(parsePeriod({}, TODAY), TODAY)).toBe("/ma");
  });

  it("AC2: bármelyik nap kiválasztható", () => {
    const p = parsePeriod({ nap: "2027-01-05" }, TODAY);
    expect(p).toMatchObject({ kind: "day", start: "2027-01-05", end: "2027-01-05", isCurrent: false });
    expect(periodHref(p, TODAY)).toBe("/ma?nap=2027-01-05");
  });

  it("AC2: hét – hétfőtől vasárnapig, bármelyik napjából", () => {
    const p = parsePeriod({ het: "2026-11-20" }, TODAY);
    expect(p).toMatchObject({ kind: "week", start: "2026-11-16", end: "2026-11-22", isCurrent: true });
    expect(periodHref(p, TODAY)).toBe("/ma?het=2026-11-16");
    // vasárnap még ugyanahhoz a héthez tartozik
    expect(makePeriod("week", "2026-11-22", TODAY).start).toBe("2026-11-16");
  });

  it("AC2: hónap – elsejétől az utolsó napig (szökőév is)", () => {
    expect(parsePeriod({ ho: "2028-02" }, TODAY)).toMatchObject({
      kind: "month",
      start: "2028-02-01",
      end: "2028-02-29",
    });
    expect(periodHref(makePeriod("month", "2026-11-05", TODAY), TODAY)).toBe("/ma?ho=2026-11");
  });

  it("AC3: léptetés előre-hátra, hónap- és évhatáron át", () => {
    expect(shiftPeriod(makePeriod("day", "2026-12-31", TODAY), 1, TODAY).start).toBe("2027-01-01");
    expect(shiftPeriod(makePeriod("week", TODAY, TODAY), -1, TODAY).start).toBe("2026-11-09");
    expect(shiftPeriod(makePeriod("month", "2026-01-31", TODAY), -1, TODAY).start).toBe("2025-12-01");
  });

  it("AC3: olvasható címke (Ma / Holnap / Ez a hét / hónapnév)", () => {
    expect(periodLabel(makePeriod("day", TODAY, TODAY), TODAY)).toBe("Ma · 2026. november 20., péntek");
    expect(periodLabel(makePeriod("day", "2026-11-21", TODAY), TODAY)).toMatch(/^Holnap · /);
    expect(periodLabel(makePeriod("week", TODAY, TODAY), TODAY)).toBe("Ez a hét · 2026. nov. 16–22.");
    expect(periodLabel(makePeriod("week", "2026-12-01", TODAY), TODAY)).toBe("2026. nov. 30. – dec. 6.");
    expect(periodLabel(makePeriod("month", "2027-03-01", TODAY), TODAY)).toBe("2027. március");
  });

  it("AC4: a naptárrács teljes hetekből áll, hétfővel kezdődik", () => {
    const g = monthGrid("2026-11-01");
    expect(g.length % 7).toBe(0);
    expect(g[0]).toBe("2026-10-26");
    expect(g.at(-1)).toBe("2026-12-06");
    expect(g).toContain("2026-11-30");
  });
});
