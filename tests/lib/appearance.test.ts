import { describe, expect, it, vi } from "vitest";
import {
  htmlAttributes,
  parseMode,
  parseTheme,
  resolveMode,
  type Appearance,
} from "@/lib/appearance";
import { themeInitScript } from "@/lib/theme-script";

/** A head-script futtatása egy ál-documenttel és ál-localStorage-dzsal. */
function runInitScript(store: Record<string, string>) {
  const attrs: Record<string, string> = {};
  const document = {
    documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) },
  };
  const localStorage = { getItem: (k: string) => (k in store ? store[k] : null) };
  new Function("document", "localStorage", themeInitScript)(document, localStorage);
  return attrs;
}

describe("Story 8.2 – nappali / éjszakai / rendszer mód", () => {
  it("AC1: ismeretlen vagy hiányzó érték → rendszer mód", () => {
    expect(parseMode(null)).toBe("system");
    expect(parseMode("valami")).toBe("system");
    expect(parseMode("light")).toBe("light");
    expect(parseMode("dark")).toBe("dark");
  });

  it("AC1: rendszer módban a rendszerbeállítás dönt, egyébként a választás", () => {
    expect(resolveMode("system", true)).toBe("dark");
    expect(resolveMode("system", false)).toBe("light");
    expect(resolveMode("light", true)).toBe("light");
    expect(resolveMode("dark", false)).toBe("dark");
  });

  it("AC1: data-mode csak kifejezett választásnál kerül a <html>-re", () => {
    const base: Appearance = { theme: "default", mode: "system" };
    expect(htmlAttributes(base)).toEqual({ "data-theme": null, "data-mode": null });
    expect(htmlAttributes({ theme: "blue", mode: "dark" })).toEqual({
      "data-theme": "blue",
      "data-mode": "dark",
    });
  });

  it("AC1: hibás tárolt téma az alapértékre esik vissza", () => {
    expect(parseTheme("lila")).toBe("default");
    expect(parseTheme("turquoise")).toBe("turquoise");
  });

  it("AC2: a head-script ugyanazt állítja be, mint a htmlAttributes()", () => {
    const cases: Record<string, string>[] = [
      {},
      { mode: "dark" },
      { mode: "light", theme: "green", style: "csempe" },
      { mode: "system", theme: "default", style: "plain" },
      { mode: "rossz", theme: "lila" },
    ];
    for (const store of cases) {
      const expected = htmlAttributes({
        theme: parseTheme(store.theme),
        mode: parseMode(store.mode),
      });
      const want = Object.fromEntries(Object.entries(expected).filter(([, v]) => v !== null));
      expect(runInitScript(store)).toEqual(want);
    }
  });

  it("AC2: a head-script nem dob hibát, ha a localStorage nem elérhető", () => {
    const document = { documentElement: { setAttribute: () => {} } };
    const localStorage = {
      getItem: () => {
        throw new Error("blokkolva");
      },
    };
    expect(() => new Function("document", "localStorage", themeInitScript)(document, localStorage)).not.toThrow();
  });
});

describe("Story 8.2 – egy-ikonos világos/sötét váltó", () => {
  function stubBrowser(store: Record<string, string>, systemDark: boolean) {
    const attrs: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      getItem: (k: string) => (k in store ? store[k] : null),
      setItem: (k: string, v: string) => (store[k] = v),
    });
    vi.stubGlobal("window", {
      matchMedia: () => ({ matches: systemDark }),
      dispatchEvent: () => true,
    });
    vi.stubGlobal("document", {
      documentElement: {
        setAttribute: (k: string, v: string) => (attrs[k] = v),
        removeAttribute: (k: string) => delete attrs[k],
      },
    });
    vi.stubGlobal("Event", class {});
    return attrs;
  }

  it("AC3: választás nélkül a rendszer szerinti módból a másikba vált és elmenti", async () => {
    const { toggleMode } = await import("@/lib/appearance");
    const store: Record<string, string> = {};
    const attrs = stubBrowser(store, true);
    toggleMode();
    expect(store.mode).toBe("light");
    expect(attrs["data-mode"]).toBe("light");
    toggleMode();
    expect(store.mode).toBe("dark");
    expect(attrs["data-mode"]).toBe("dark");
    vi.unstubAllGlobals();
  });
});


describe("Story 8.3 – csempe alapból", () => {
  it("AC1: a megjelenés-store már nem kezel stílust, a régi 'style' kulcsot figyelmen kívül hagyja", () => {
    expect(Object.keys(htmlAttributes({ theme: "green", mode: "light" }))).not.toContain("data-style");
    const attrs: Record<string, string> = {};
    const document = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
    const localStorage = { getItem: (k: string) => (k === "style" ? "plain" : null) };
    new Function("document", "localStorage", themeInitScript)(document, localStorage);
    expect(attrs["data-style"]).toBeUndefined(); // a layout adja fixen
  });

  it("AC1: a root layout fixen data-style=\"csempe\"-t ad a <html>-nek", async () => {
    const { readFileSync } = await import("node:fs");
    const src = readFileSync("src/app/layout.tsx", "utf8");
    expect(src).toMatch(/data-style="csempe"/);
  });
});
