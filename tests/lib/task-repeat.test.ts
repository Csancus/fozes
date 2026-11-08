import { describe, expect, it } from "vitest";
import { addInterval, nextDueDate, repeatLabel } from "@/lib/task-repeat";

// Story 5.1 (visszamenőleges) – ismétlődő teendők.
describe("Story 5.1 – ismétlődés", () => {
  it("AC: nap/hét léptetés hónap- és évhatáron át", () => {
    expect(addInterval("2026-12-30", { every: 3, unit: "day" })).toBe("2027-01-02");
    expect(addInterval("2026-02-25", { every: 1, unit: "week" })).toBe("2026-03-04");
  });

  it("AC: havi léptetés a hónap végére vág (jan 31 → feb 28/29)", () => {
    expect(addInterval("2026-01-31", { every: 1, unit: "month" })).toBe("2026-02-28");
    expect(addInterval("2028-01-31", { every: 1, unit: "month" })).toBe("2028-02-29");
    expect(addInterval("2026-11-15", { every: 2, unit: "month" })).toBe("2027-01-15");
    expect(addInterval("2028-02-29", { every: 1, unit: "year" })).toBe("2029-02-28");
  });

  it("AC: régen elmaradt teendőnél a következő esedékesség a jövőben van, nem sorozat", () => {
    expect(nextDueDate("2026-01-01", { every: 1, unit: "week" }, "2026-11-08")).toBe("2026-11-12");
    expect(nextDueDate(null, { every: 1, unit: "day" }, "2026-11-08")).toBe("2026-11-09");
  });

  it("felirat", () => {
    expect(repeatLabel({ every: 1, unit: "week" })).toBe("Hetente");
    expect(repeatLabel({ every: 2, unit: "month" })).toBe("2 hónaponta");
    expect(repeatLabel(null)).toBeNull();
  });
});
