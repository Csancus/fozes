"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  BookOpen,
  Refrigerator,
  ShoppingCart,
  Receipt,
  BarChart3,
  Users,
  ChefHat,
} from "lucide-react";
import { cn } from "@/lib/cn";
import type { LucideIcon } from "lucide-react";

type NavItem = { href: string; label: string; icon: LucideIcon };

const primary: NavItem[] = [
  { href: "/", label: "Kezdő", icon: Home },
  { href: "/receptek", label: "Receptek", icon: BookOpen },
  { href: "/spajz", label: "Spájz", icon: Refrigerator },
  { href: "/bevasarlas", label: "Bevásárlás", icon: ShoppingCart },
  { href: "/vasarlas", label: "Vásárlás", icon: Receipt },
];

const secondary: NavItem[] = [
  { href: "/statisztika", label: "Statisztika", icon: BarChart3 },
  { href: "/csalad", label: "Család", icon: Users },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
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

export function Sidebar() {
  const pathname = usePathname() ?? "/";
  if (pathname.startsWith("/belepes")) return null;

  return (
    <aside className="hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] z-40">
      <div className="px-5 pt-6 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-sm shrink-0">
          <ChefHat className="w-5 h-5 text-white" strokeWidth={2} />
        </div>
        <div>
          <p className="font-bold tracking-tight leading-none">Főzés</p>
          <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
            Konyha asszisztens
          </p>
        </div>
      </div>

      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
        {primary.map((it) => (
          <NavLink key={it.href} item={it} pathname={pathname} />
        ))}

        <div className="h-px bg-[var(--color-border)] my-3 mx-2" />

        {secondary.map((it) => (
          <NavLink key={it.href} item={it} pathname={pathname} />
        ))}
      </nav>

      <div className="p-3 border-t border-[var(--color-border)]">
        <p className="px-3 text-[11px] text-[var(--color-muted-foreground)]">
          Csancsus Fozes
        </p>
      </div>
    </aside>
  );
}
