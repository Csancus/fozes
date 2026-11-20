"use client";

import { setAppearance, type Style, type Theme } from "@/lib/appearance";
import { cn } from "@/lib/cn";
import { ModeSwitcher } from "./ModeSwitcher";
import { useAppearance } from "./useAppearance";

const themes: { key: Theme; label: string; from: string; to: string }[] = [
  { key: "default", label: "Narancs", from: "#ea580c", to: "#f59e0b" },
  { key: "green", label: "Zöld", from: "#059669", to: "#10b981" },
  { key: "turquoise", label: "Türkiz", from: "#0d9488", to: "#06b6d4" },
  { key: "blue", label: "Kék", from: "#2563eb", to: "#38bdf8" },
];

// A stílus színfüggetlen: bármelyik témaszínnel együtt használható.
const styles: { key: Style; label: string }[] = [
  { key: "plain", label: "Sima" },
  { key: "csempe", label: "Üveges csempe" },
];

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme, style } = useAppearance();

  return (
    <div className={cn("space-y-3", className)}>
      <ModeSwitcher />
      <div className="flex items-center gap-2" role="radiogroup" aria-label="Témaszín">
        {themes.map((t) => {
          const active = theme === t.key;
          return (
            <button
              key={t.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAppearance({ theme: t.key })}
              aria-label={`Téma: ${t.label}`}
              title={t.label}
              className={cn(
                "w-7 h-7 rounded-full transition ring-offset-2 ring-offset-[var(--color-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
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
        className="grid grid-cols-2 gap-0.5 p-0.5 rounded-xl bg-[var(--color-muted)]"
        role="radiogroup"
        aria-label="Stílus"
        data-segmented
      >
        {styles.map((st) => {
          const active = style === st.key;
          return (
            <button
              key={st.key}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setAppearance({ style: st.key })}
              className={cn(
                "text-xs font-medium h-8 rounded-[10px] transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
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
