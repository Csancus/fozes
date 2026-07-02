import type { ReactNode } from "react";

export function Section({
  title,
  action,
  children,
  className,
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={className}>
      {title && (
        <div className="flex items-center justify-between mb-3 px-1">
          <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em]">
            {title}
          </h2>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}
