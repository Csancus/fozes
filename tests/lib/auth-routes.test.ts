import { describe, expect, it } from "vitest";
import { isAuthRoute } from "@/lib/auth-routes";

describe("Story 8.1 – belépés oldal elrendezése", () => {
  it("AC1: a belépés és a jelszócsere oldal auth-útvonal (nincs sidebar-hely)", () => {
    expect(isAuthRoute("/belepes")).toBe(true);
    expect(isAuthRoute("/jelszo-csere")).toBe(true);
    expect(isAuthRoute("/belepes/valami")).toBe(true);
  });

  it("AC1: a többi oldal nem auth-útvonal, ott marad a sidebar-hely", () => {
    expect(isAuthRoute("/")).toBe(false);
    expect(isAuthRoute("/koltsegek")).toBe(false);
    expect(isAuthRoute("/belepesek")).toBe(false);
  });
});
