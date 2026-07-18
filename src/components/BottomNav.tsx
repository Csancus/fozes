"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ChefHat, Wallet, Bookmark, Users } from "lucide-react";
import { cn } from "@/lib/cn";

const COOKING_PREFIXES = [
  "/fozes",
  "/receptek",
  "/spajz",
  "/helyek",
  "/bevasarlas",
  "/vasarlas",
  "/katalogus",
  "/etelek",
  "/statisztika",
];

const items = [
  { href: "/", label: "Kezdő", icon: Home, match: (p: string) => p === "/" },
  {
    href: "/fozes",
    label: "Főzés",
    icon: ChefHat,
    match: (p: string) => COOKING_PREFIXES.some((x) => p === x || p.startsWith(x + "/")),
  },
  {
    href: "/koltsegek",
    label: "Költségek",
    icon: Wallet,
    match: (p: string) => p.startsWith("/koltsegek"),
  },
  {
    href: "/bakancslista",
    label: "Listák",
    icon: Bookmark,
    match: (p: string) => p.startsWith("/bakancslista"),
  },
  {
    href: "/csalad",
    label: "Család",
    icon: Users,
    match: (p: string) => p.startsWith("/csalad"),
  },
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
