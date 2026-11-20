"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { setAppearance, type Mode } from "@/lib/appearance";
import { cn } from "@/lib/cn";
import { useAppearance } from "./useAppearance";

const modes: { key: Mode; label: string; icon: LucideIcon }[] = [
  { key: "light", label: "Világos", icon: Sun },
  { key: "dark", label: "Sötét", icon: Moon },
  { key: "system", label: "Rendszer", icon: Monitor },
];

/**
 * Világos / Sötét / Rendszer szegmentált kapcsoló (Story 8.2).
 * `compact`: csak ikonok (pl. a belépés oldal sarkában).
 */
export function ModeSwitcher({ compact, className }: { compact?: boolean; className?: string }) {
  const { mode } = useAppearance();
  return (
    <div
      role="radiogroup"
      aria-label="Megjelenés: világos, sötét vagy rendszer"
      data-segmented
      className={cn(
        "grid grid-cols-3 gap-0.5 p-0.5 rounded-xl bg-[var(--color-muted)]",
        compact && "inline-grid rounded-full",
        className,
      )}
    >
      {modes.map(({ key, label, icon: Icon }) => {
        const active = mode === key;
        return (
          <button
            key={key}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            title={label}
            onClick={() => setAppearance({ mode: key })}
            className={cn(
              "flex items-center justify-center gap-1.5 font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
              compact ? "w-8 h-7 rounded-full" : "h-8 rounded-[10px] text-xs",
              active
                ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]",
            )}
          >
            <Icon className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
            {!compact && <span>{label}</span>}
          </button>
        );
      })}
    </div>
  );
}
