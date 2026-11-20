import { afterEach, describe, expect, it, vi } from "vitest";
import { isSidebarCollapsed, setSidebarCollapsed } from "@/lib/sidebar";
import { themeInitScript } from "@/lib/theme-script";

function fakeRoot() {
  const attrs: Record<string, string> = {};
  return {
    attrs,
    root: {
      getAttribute: (k: string) => attrs[k] ?? null,
      setAttribute: (k: string, v: string) => (attrs[k] = v),
      removeAttribute: (k: string) => delete attrs[k],
    } as unknown as HTMLElement,
  };
}

describe("Story 8.3 – becsukható oldalsáv", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("AC4: becsukás/kinyitás az attribútumot és a localStorage-t is állítja", () => {
    const store: Record<string, string> = {};
    vi.stubGlobal("localStorage", {
      setItem: (k: string, v: string) => (store[k] = v),
      removeItem: (k: string) => delete store[k],
    });
    const { root, attrs } = fakeRoot();
    setSidebarCollapsed(true, root);
    expect(attrs["data-sidebar"]).toBe("collapsed");
    expect(store.sidebar).toBe("collapsed");
    expect(isSidebarCollapsed(root)).toBe(true);
    setSidebarCollapsed(false, root);
    expect(attrs["data-sidebar"]).toBeUndefined();
    expect(store.sidebar).toBeUndefined();
    expect(isSidebarCollapsed(root)).toBe(false);
  });

  it("AC4: a head-script újratöltés után visszaállítja a becsukott állapotot", () => {
    const run = (store: Record<string, string>) => {
      const attrs: Record<string, string> = {};
      const document = { documentElement: { setAttribute: (k: string, v: string) => (attrs[k] = v) } };
      const localStorage = { getItem: (k: string) => store[k] ?? null };
      new Function("document", "localStorage", themeInitScript)(document, localStorage);
      return attrs;
    };
    expect(run({ sidebar: "collapsed" })["data-sidebar"]).toBe("collapsed");
    expect(run({})["data-sidebar"]).toBeUndefined();
  });
});
