"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/cn";

type Theme = "default" | "green" | "turquoise" | "blue";

const themes: { key: Theme; label: string; from: string; to: string }[] = [
  { key: "default", label: "Narancs", from: "#ea580c", to: "#f59e0b" },
  { key: "green", label: "Zöld", from: "#059669", to: "#10b981" },
  { key: "turquoise", label: "Türkiz", from: "#0d9488", to: "#06b6d4" },
  { key: "blue", label: "Kék", from: "#2563eb", to: "#38bdf8" },
];

function applyTheme(t: Theme) {
  const root = document.documentElement;
  if (t === "default") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", t);
}

type Style = "plain" | "csempe";

// A stílus színfüggetlen: bármelyik témaszínnel együtt használható.
const styles: { key: Style; label: string }[] = [
  { key: "plain", label: "Sima" },
  { key: "csempe", label: "Üveges csempe" },
];

function applyStyle(s: Style) {
  const root = document.documentElement;
  if (s === "csempe") root.setAttribute("data-style", "csempe");
  else root.removeAttribute("data-style");
}

export function ThemeSwitcher({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("default");
  const [style, setStyle] = useState<Style>("plain");

  useEffect(() => {
    let storedTheme: Theme = "default";
    let storedStyle: Style = "plain";
    try {
      storedTheme =
        (localStorage.getItem("theme") as Theme | null) ?? "default";
      storedStyle =
        localStorage.getItem("style") === "csempe" ? "csempe" : "plain";
    } catch {}
    setTheme(storedTheme);
    setStyle(storedStyle);
    applyTheme(storedTheme);
    applyStyle(storedStyle);
  }, []);

  function pickStyle(s: Style) {
    setStyle(s);
    applyStyle(s);
    try {
      localStorage.setItem("style", s);
    } catch {}
  }

  function pick(t: Theme) {
    setTheme(t);
    applyTheme(t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }

  return (
    <div className={cn("space-y-3", className)}>
      <div className="flex items-center gap-2">
        {themes.map((t) => {
          const active = theme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              onClick={() => pick(t.key)}
              aria-label={`Téma: ${t.label}`}
              title={t.label}
              className={cn(
                "w-7 h-7 rounded-full transition ring-offset-2 ring-offset-[var(--color-card)]",
                active
                  ? "ring-2 ring-[var(--color-foreground)] scale-105"
                  : "ring-1 ring-[var(--color-border)] hover:scale-105",
              )}
              style={{
                backgroundImage: `linear-gradient(135deg, ${t.from}, ${t.to})`,
              }}
            />
          );
        })}
      </div>
      <div
        className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-[var(--color-muted)]"
        role="radiogroup"
        aria-label="Stílus"
      >
        {styles.map((st) => {
          const active = style === st.key;
          return (
            <button
              key={st.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => pickStyle(st.key)}
              className={cn(
                "text-xs font-medium py-1.5 rounded-lg transition",
                active
                  ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
              )}
            >
              {st.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
