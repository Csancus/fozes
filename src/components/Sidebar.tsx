"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Wallet,
  Bookmark,
  Users,
  Compass,
  ChefHat,
  BookOpen,
  Refrigerator,
  ShoppingCart,
  Receipt,
  Package,
  Utensils,
  BarChart3,
  LayoutDashboard,
  Table2,
  SlidersHorizontal,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";
import { ThemeSwitcher } from "./ThemeSwitcher";

type NavItem = { href: string; label: string; icon: LucideIcon };

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

const primary: NavItem[] = [
  { href: "/", label: "Kezdő", icon: Home },
  { href: "/fozes", label: "Főzés", icon: ChefHat },
  { href: "/koltsegek", label: "Költségek", icon: Wallet },
  { href: "/bakancslista", label: "Bakancslista", icon: Bookmark },
  { href: "/csalad", label: "Család", icon: Users },
];

const cooking: NavItem[] = [
  { href: "/receptek", label: "Receptek", icon: BookOpen },
  { href: "/spajz", label: "Spájz", icon: Refrigerator },
  { href: "/bevasarlas", label: "Bevásárlás", icon: ShoppingCart },
  { href: "/vasarlas", label: "Vásárlás", icon: Receipt },
  { href: "/katalogus", label: "Katalógus", icon: Package },
  { href: "/etelek", label: "Elkészült", icon: Utensils },
  { href: "/statisztika", label: "Statisztika", icon: BarChart3 },
];

const costs: NavItem[] = [
  { href: "/koltsegek", label: "Áttekintés", icon: LayoutDashboard },
  { href: "/koltsegek/gyors", label: "Gyors rögzítés", icon: Table2 },
  { href: "/koltsegek/beallitasok", label: "Beállítások", icon: SlidersHorizontal },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/fozes") return COOKING_PREFIXES.some((p) => pathname === p || pathname.startsWith(p + "/"));
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({ item, pathname }: { item: NavItem; pathname: string }) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
        active
          ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
          : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      <Icon className="w-4.5 h-4.5" strokeWidth={active ? 2.25 : 1.85} />
      <span>{item.label}</span>
    </Link>
  );
}

function SubLink({
  item,
  pathname,
  exact,
}: {
  item: NavItem;
  pathname: string;
  exact?: boolean;
}) {
  const active = exact
    ? pathname === item.href
    : pathname === item.href || pathname.startsWith(item.href + "/");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={cn(
        "flex items-center gap-2.5 pl-4 pr-3 py-2 rounded-lg text-[13px] font-medium transition",
        active
          ? "text-[var(--color-primary)]"
          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]"
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={active ? 2.25 : 1.85} />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/belepes")) return null;

  const inCooking = COOKING_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );
  const inCosts = pathname === "/koltsegek" || pathname.startsWith("/koltsegek/");

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] z-40">
      <Link href="/" className="px-5 pt-6 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-sm shrink-0">
          <Compass className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="font-bold tracking-tight leading-none">Élet Portál</p>
          <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
            Kövesd a dolgaid
          </p>
        </div>
      </Link>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {primary.map((it) => (
          <div key={it.href}>
            <NavLink item={it} pathname={pathname} />
            {it.href === "/fozes" && inCooking && (
              <div className="mt-1 mb-1 space-y-0.5 border-l border-[var(--color-border)] ml-4">
                {cooking.map((sub) => (
                  <SubLink key={sub.href} item={sub} pathname={pathname} />
                ))}
              </div>
            )}
            {it.href === "/koltsegek" && inCosts && (
              <div className="mt-1 mb-1 space-y-0.5 border-l border-[var(--color-border)] ml-4">
                {costs.map((sub) => (
                  <SubLink
                    key={sub.href}
                    item={sub}
                    pathname={pathname}
                    exact={sub.href === "/koltsegek"}
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </nav>

      <div className="p-4 border-t border-[var(--color-border)] space-y-3">
        <div>
          <p className="text-[10px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-wider mb-2">
            Téma
          </p>
          <ThemeSwitcher />
        </div>
      </div>
    </aside>
  );
}
