import { cn } from "@/lib/cn";
import type { ReactNode } from "react";

type Tone = "neutral" | "primary" | "success" | "warning" | "danger" | "muted";

const tones: Record<Tone, string> = {
  neutral:
    "bg-[var(--color-muted)] text-[var(--color-foreground)] border border-[var(--color-border)]",
  primary:
    "bg-[var(--color-primary-soft)] text-[var(--color-primary)] border border-[var(--color-primary)]/20",
  success: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-400 border border-emerald-500/25",
  warning: "bg-amber-500/12 text-amber-700 dark:text-amber-400 border border-amber-500/25",
  danger: "bg-red-500/12 text-red-700 dark:text-red-400 border border-red-500/25",
  muted:
    "bg-transparent text-[var(--color-muted-foreground)] border border-[var(--color-border)]",
};

export function Badge({
  tone = "neutral",
  className,
  children,
}: {
  tone?: Tone;
  className?: string;
  children: ReactNode;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[11px] font-medium leading-5",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
