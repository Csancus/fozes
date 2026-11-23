import { describe, expect, it } from "vitest";
import { groupDigits } from "@/lib/amount-input";

describe("groupDigits (Ft beviteli mező)", () => {
  it("tagol", () => {
    expect(groupDigits("1234567")).toBe("1 234 567");
    expect(groupDigits("")).toBe("");
  });
  it("beillesztett tizedes részt levágja, nem szorozza 100-zal", () => {
    expect(groupDigits("12 345,00 Ft")).toBe("12 345");
    expect(groupDigits("4,99")).toBe("4");
    expect(groupDigits("1500.5")).toBe("1 500");
  });
  it("az ezres pont/szóköz megmarad", () => {
    expect(groupDigits("1.234")).toBe("1 234");
    expect(groupDigits("12 345 Ft")).toBe("12 345");
  });
});
