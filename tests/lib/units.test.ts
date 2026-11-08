import { describe, expect, it } from "vitest";
import { canCompare, fmt, fromBase, toBase } from "@/lib/units";

// Story 3.2 (visszamenőleges) – mértékegység-átváltás a spájzhoz és receptekhez.
describe("Story 3.2 – mértékegységek", () => {
  it("AC: g/dkg/kg és ml/dl/l közös alapra vált", () => {
    expect(toBase(2, "kg")).toEqual({ base: "g", value: 2000 });
    expect(toBase(15, "dkg")).toEqual({ base: "g", value: 150 });
    expect(toBase(3, "dl")).toEqual({ base: "ml", value: 300 });
    expect(fromBase(1500, "l")).toBe(1.5);
  });

  it("AC: csak azonos dimenzió hasonlítható, a 'egyéb' (csomag, ek…) soha", () => {
    expect(canCompare("g", "kg")).toBe(true);
    expect(canCompare("ml", "g")).toBe(false);
    expect(canCompare("ek", "ek")).toBe(false);
  });

  it("fmt két tizedesre kerekít", () => {
    expect(fmt(1.23456, "kg")).toBe("1.23 kg");
  });
});
