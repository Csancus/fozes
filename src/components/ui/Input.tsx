import { cn } from "@/lib/cn";
import type { ComponentProps, ReactNode } from "react";

export function Input({
  className,
  ...props
}: ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3.5 text-[15px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)] transition",
        className
      )}
      {...props}
    />
  );
}

export function Textarea({
  className,
  ...props
}: ComponentProps<"textarea">) {
  return (
    <textarea
      className={cn(
        "w-full min-h-24 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3.5 py-3 text-[15px] text-[var(--color-foreground)] placeholder:text-[var(--color-muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)] transition resize-y",
        className
      )}
      {...props}
    />
  );
}

export function Select({
  className,
  children,
  ...props
}: ComponentProps<"select">) {
  return (
    <select
      className={cn(
        "w-full h-11 rounded-xl border border-[var(--color-input)] bg-[var(--color-card)] px-3.5 text-[15px] text-[var(--color-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--color-ring)] focus:border-[var(--color-primary)] transition appearance-none",
        className
      )}
      {...props}
    >
      {children}
    </select>
  );
}

export function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="block text-sm font-medium text-[var(--color-foreground)] mb-1.5">
        {label} {required && <span className="text-[var(--color-danger)]">*</span>}
      </span>
      {children}
      {hint && (
        <span className="block text-xs text-[var(--color-muted-foreground)] mt-1.5">
          {hint}
        </span>
      )}
    </label>
  );
}
