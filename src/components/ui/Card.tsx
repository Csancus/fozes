import Link from "next/link";
import { cn } from "@/lib/cn";
import type { ComponentProps, ReactNode } from "react";

type BaseProps = { className?: string; children: ReactNode };

export function Card({ className, children }: BaseProps) {
  return (
    <div
      className={cn(
        "rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm",
        className
      )}
    >
      {children}
    </div>
  );
}

export function LinkCard({
  href,
  className,
  children,
  ...rest
}: { href: string } & Omit<ComponentProps<typeof Link>, "href">) {
  return (
    <Link
      href={href}
      className={cn(
        "block rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm transition hover:border-[var(--color-primary)]/40 hover:shadow-md active:scale-[0.99]",
        className
      )}
      {...rest}
    >
      {children}
    </Link>
  );
}

export function CardHeader({ className, children }: BaseProps) {
  return (
    <div className={cn("px-5 pt-5", className)}>{children}</div>
  );
}

export function CardBody({ className, children }: BaseProps) {
  return <div className={cn("p-5", className)}>{children}</div>;
}
