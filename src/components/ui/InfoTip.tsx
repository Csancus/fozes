"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { Info } from "lucide-react";
import { cn } from "@/lib/cn";

// Kis (i) gomb, ami hoverre/kattintásra egy magyarázó buborékot nyit.
export function InfoTip({
  children,
  label = "Mit jelent?",
  className,
}: {
  children: ReactNode;
  label?: string;
  className?: string;
}) {
  // Hover és klikk KÜLÖN: asztalon a hover már megnyitja, és ha a klikk
  // ugyanazt az egy állapotot togglelné, a kattintás azonnal be is csukná.
  const [hover, setHover] = useState(false);
  const [pinned, setPinned] = useState(false);
  const open = hover || pinned;
  const box = useRef<HTMLSpanElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (box.current && !box.current.contains(e.target as Node)) setPinned(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setPinned(false);
        setHover(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <span
      ref={box}
      className={cn("relative inline-flex", className)}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
    >
      <button
        type="button"
        aria-label={label}
        onClick={() => setPinned((v) => !v)}
        className="inline-flex h-5 w-5 items-center justify-center rounded-full text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
      >
        <Info className="w-4 h-4" />
      </button>

      {open && (
        <span
          role="tooltip"
          className="absolute left-1/2 top-full z-40 mt-2 w-64 -translate-x-1/2 rounded-xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 text-[12px] leading-relaxed font-normal text-[var(--color-foreground)] shadow-lg"
        >
          <span className="absolute -top-1.5 left-1/2 h-3 w-3 -translate-x-1/2 rotate-45 border-l border-t border-[var(--color-border)] bg-[var(--color-card)]" />
          {children}
        </span>
      )}
    </span>
  );
}
