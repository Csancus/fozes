"use client";

import { setAppearance, type Theme } from "@/lib/appearance";
import { cn } from "@/lib/cn";
import { ModeSwitcher } from "./ModeSwitcher";
import { useAppearance } from "./useAppearance";

const themes: { key: Theme; label: string; from: string; to: string }[] = [
  { key: "default", label: "Narancs", from: "#ea580c", to: "#f59e0b" },
  { key: "green", label: "Zöld", from: "#059669", to: "#10b981" },
  { key: "turquoise", label: "Türkiz", from: "#0d9488", to: "#06b6d4" },
  { key: "blue", label: "Kék", from: "#2563eb", to: "#38bdf8" },
];

export function ThemeSwitcher({ className }: { className?: string }) {
  const { theme } = useAppearance();

  return (
    <div className={cn("flex items-center gap-2", className)}>
      <div className="flex items-center gap-2">
        <div
          className="flex items-center gap-2"
          role="radiogroup"
          aria-label="Témaszín"
        >
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
                  "relative touch-hit w-7 h-7 rounded-full transition ring-offset-2 ring-offset-[var(--color-card)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
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
        <span
          aria-hidden
          className="mx-0.5 h-5 w-px bg-[var(--color-border)]"
        />
        <ModeSwitcher />
      </div>
    </div>
  );
}
