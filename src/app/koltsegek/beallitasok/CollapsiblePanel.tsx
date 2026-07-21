"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/cn";

// Összecsukható panel, alapból csukva.
export function CollapsiblePanel({
  title,
  count,
  defaultOpen = false,
  children,
}: {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="w-full flex items-center justify-between gap-3 px-4 h-14 text-left hover:bg-[var(--color-muted)]/40 transition"
      >
        <span className="flex items-center gap-2 font-semibold">
          {title}
          {typeof count === "number" && (
            <span className="text-xs font-normal text-[var(--color-muted-foreground)] rounded-full bg-[var(--color-muted)] px-2 py-0.5 tabular-nums">
              {count}
            </span>
          )}
        </span>
        <ChevronDown
          className={cn(
            "w-5 h-5 text-[var(--color-muted-foreground)] transition-transform",
            open && "rotate-180"
          )}
        />
      </button>
      <div className={cn("px-4 pb-4", !open && "hidden")}>{children}</div>
    </div>
  );
}
