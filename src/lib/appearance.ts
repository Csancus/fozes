// Megjelenés-beállítások (Story 8.2): témaszín, stílus, világos/sötét mód.
// Tiszta függvények + egy kis kliens-oldali „store”, hogy a több helyen
// megjelenő kapcsolók (sidebar, belépés, Család oldal) szinkronban legyenek.

export type Theme = "default" | "green" | "turquoise" | "blue";
export type Style = "plain" | "csempe";
// "system" = még nem választott; ilyenkor a rendszer dönt. A UI csak világos/sötét között vált.
export type Mode = "light" | "dark" | "system";

export const THEMES: readonly Theme[] = ["default", "green", "turquoise", "blue"];
export const MODES: readonly Mode[] = ["light", "dark", "system"];

export type Appearance = { theme: Theme; style: Style; mode: Mode };
export const DEFAULT_APPEARANCE: Appearance = { theme: "default", style: "plain", mode: "system" };

export function parseTheme(v: string | null | undefined): Theme {
  return THEMES.includes(v as Theme) ? (v as Theme) : "default";
}
export function parseStyle(v: string | null | undefined): Style {
  return v === "csempe" ? "csempe" : "plain";
}
export function parseMode(v: string | null | undefined): Mode {
  return v === "light" || v === "dark" ? v : "system";
}

/** A ténylegesen látszó mód: „system” esetén a rendszerbeállítás dönt. */
export function resolveMode(mode: Mode, systemDark: boolean): "light" | "dark" {
  if (mode === "system") return systemDark ? "dark" : "light";
  return mode;
}

/** A <html> data-* attribútumai; null = az attribútum hiányzik. */
export function htmlAttributes(a: Appearance): {
  "data-theme": string | null;
  "data-style": string | null;
  "data-mode": string | null;
} {
  return {
    "data-theme": a.theme === "default" ? null : a.theme,
    "data-style": a.style === "csempe" ? "csempe" : null,
    "data-mode": a.mode === "system" ? null : a.mode,
  };
}

// ---- kliens-oldali store (csak böngészőben hívd) ----

const EVENT = "appearance-change";
const KEYS = { theme: "theme", style: "style", mode: "mode" } as const;

function safeGet(k: string): string | null {
  try {
    return localStorage.getItem(k);
  } catch {
    return null;
  }
}

let cache: Appearance = DEFAULT_APPEARANCE;

export function readAppearance(): Appearance {
  const next: Appearance = {
    theme: parseTheme(safeGet(KEYS.theme)),
    style: parseStyle(safeGet(KEYS.style)),
    mode: parseMode(safeGet(KEYS.mode)),
  };
  // useSyncExternalStore stabil referenciát vár, ha nem változott semmi.
  if (next.theme !== cache.theme || next.style !== cache.style || next.mode !== cache.mode) {
    cache = next;
  }
  return cache;
}

export function applyAppearance(a: Appearance, root: HTMLElement = document.documentElement) {
  for (const [attr, value] of Object.entries(htmlAttributes(a))) {
    if (value === null) root.removeAttribute(attr);
    else root.setAttribute(attr, value);
  }
}

/** A rendszer sötét-e (csak böngészőben). */
export function systemPrefersDark(): boolean {
  try {
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  } catch {
    return false;
  }
}

/** Egy kattintás: a ténylegesen látszó módból a másikba vált, és ezt el is menti. */
export function toggleMode() {
  const current = resolveMode(readAppearance().mode, systemPrefersDark());
  setAppearance({ mode: current === "dark" ? "light" : "dark" });
}

export function setAppearance(patch: Partial<Appearance>) {
  const next = { ...readAppearance(), ...patch };
  try {
    localStorage.setItem(KEYS.theme, next.theme);
    localStorage.setItem(KEYS.style, next.style);
    localStorage.setItem(KEYS.mode, next.mode);
  } catch {}
  applyAppearance(next);
  window.dispatchEvent(new Event(EVENT));
}

export function subscribeAppearance(cb: () => void): () => void {
  window.addEventListener(EVENT, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(EVENT, cb);
    window.removeEventListener("storage", cb);
  };
}
