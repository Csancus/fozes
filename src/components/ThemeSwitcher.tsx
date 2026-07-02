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

export function ThemeSwitcher({ className }: { className?: string }) {
  const [theme, setTheme] = useState<Theme>("default");

  useEffect(() => {
    const stored = (localStorage.getItem("theme") as Theme | null) ?? "default";
    setTheme(stored);
    applyTheme(stored);
  }, []);

  function pick(t: Theme) {
    setTheme(t);
    applyTheme(t);
    try {
      localStorage.setItem("theme", t);
    } catch {}
  }

  return (
    <div className={cn("flex items-center gap-2", className)}>
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
                : "ring-1 ring-[var(--color-border)] hover:scale-105"
            )}
            style={{
              backgroundImage: `linear-gradient(135deg, ${t.from}, ${t.to})`,
            }}
          />
        );
      })}
    </div>
  );
}

