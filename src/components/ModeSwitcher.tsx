"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { resolveMode, systemPrefersDark, toggleMode } from "@/lib/appearance";
import { cn } from "@/lib/cn";
import { useAppearance } from "./useAppearance";

/**
 * Egyetlen ikon: megnyomásra vált világos ↔ sötét között (Story 8.2).
 * Az ikon a jelenlegi módot mutatja (nap = világos, hold = sötét).
 */
export function ModeSwitcher({ className }: { className?: string }) {
  const { mode } = useAppearance();
  // A rendszerbeállítás csak böngészőben ismert – hidratálás után számoljuk.
  const [systemDark, setSystemDark] = useState<boolean | null>(null);
  useEffect(() => {
    setSystemDark(systemPrefersDark());
  }, []);

  const dark =
    systemDark === null ? null : resolveMode(mode, systemDark) === "dark";
  const label = dark ? "Váltás világos módra" : "Váltás sötét módra";

  return (
    <button
      type="button"
      onClick={toggleMode}
      aria-label={label}
      title={label}
      className={cn(
        "w-7 h-7 shrink-0 inline-flex items-center justify-center rounded-full ring-1 ring-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-foreground)] transition hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-ring)]",
        className,
      )}
    >
      {dark === null ? null : dark ? (
        <Moon className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
      ) : (
        <Sun className="w-3.5 h-3.5" strokeWidth={2} aria-hidden />
      )}
    </button>
  );
}
