"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, BookOpen, Refrigerator, ShoppingCart, Receipt } from "lucide-react";
import { cn } from "@/lib/cn";

const items = [
  { href: "/", label: "Kezdő", icon: Home, match: (p: string) => p === "/" },
  { href: "/receptek", label: "Receptek", icon: BookOpen, match: (p: string) => p.startsWith("/receptek") },
  { href: "/spajz", label: "Spájz", icon: Refrigerator, match: (p: string) => p.startsWith("/spajz") || p.startsWith("/helyek") },
  { href: "/bevasarlas", label: "Bevásárlás", icon: ShoppingCart, match: (p: string) => p.startsWith("/bevasarlas") },
  { href: "/vasarlas", label: "Vásárlás", icon: Receipt, match: (p: string) => p.startsWith("/vasarlas") || p.startsWith("/statisztika") },
];

export function BottomNav() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/belepes")) return null;

  return (
    <nav
      className="md:hidden fixed bottom-0 inset-x-0 z-40 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-md"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="grid grid-cols-5 max-w-md mx-auto">
        {items.map((it) => {
          const active = it.match(pathname);
          const Icon = it.icon;
          return (
            <li key={it.href}>
              <Link
                href={it.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-2.5 text-[11px] font-medium transition relative",
                  active
                    ? "text-[var(--color-primary)]"
                    : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                )}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-[var(--color-primary)]" />
                )}
                <Icon className="w-5 h-5" strokeWidth={active ? 2.25 : 1.85} />
                <span>{it.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
