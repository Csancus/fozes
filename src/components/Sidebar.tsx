"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { isAuthRoute } from "@/lib/auth-routes";
import { setSidebarCollapsed } from "@/lib/sidebar";
import { logout } from "@/app/belepes/actions";
import {
  ChevronDown,
  Home,
  LogOut,
  PanelLeftClose,
  PanelLeftOpen,
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
  ListChecks,
  ListTodo,
  CalendarCheck,
  Layers,
  LayoutGrid,
  Plane,
  NotebookPen,
  StickyNote,
  Map as MapIcon,
  FolderKanban,
  Settings,
  HelpCircle,
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
  { href: "/", label: "Kezdőlap", icon: Home },
  { href: "/ma", label: "Aktuális", icon: CalendarCheck },
  { href: "/fozes", label: "Főzés", icon: ChefHat },
  { href: "/koltsegek", label: "Költségek", icon: Wallet },
  { href: "/bakancslista", label: "Bakancslista", icon: Bookmark },
  { href: "/jegyzetek", label: "Jegyzetek", icon: StickyNote },
  { href: "/naplo", label: "Napló", icon: NotebookPen },
  { href: "/utazasok", label: "Utazások", icon: Plane },
  { href: "/teendok", label: "Teendők", icon: ListTodo },
  { href: "/csalad", label: "Család", icon: Users },
  { href: "/beallitasok", label: "Globális beállítások", icon: Settings },
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
  { href: "/koltsegek/attekintes", label: "Áttekintés", icon: LayoutDashboard },
  { href: "/koltsegek", label: "Költségkezelés", icon: Wallet },
  { href: "/koltsegek/gyors", label: "Gyors rögzítés", icon: Table2 },
  { href: "/koltsegek/csoportok", label: "Csoportok", icon: Layers },
  { href: "/koltsegek/teendok", label: "Teendők", icon: ListChecks },
  {
    href: "/koltsegek/beallitasok",
    label: "Beállítások",
    icon: SlidersHorizontal,
  },
  { href: "/koltsegek/sugo", label: "Hogyan működik", icon: HelpCircle },
  { href: "/beallitasok", label: "Célok és projektek", icon: FolderKanban },
];

const todos: NavItem[] = [
  { href: "/ma", label: "Aktuális", icon: CalendarCheck },
  { href: "/teendok", label: "Teendők", icon: ListTodo },
  { href: "/teendok/board", label: "Board", icon: LayoutGrid },
  { href: "/teendok/gyors", label: "Gyors felvitel", icon: Table2 },
  { href: "/beallitasok", label: "Beállítások", icon: SlidersHorizontal },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href === "/fozes")
    return COOKING_PREFIXES.some(
      (p) => pathname === p || pathname.startsWith(p + "/"),
    );
  return pathname === href || pathname.startsWith(href + "/");
}

function NavLink({
  item,
  pathname,
  expanded,
  onToggle,
}: {
  item: NavItem;
  pathname: string;
  /** van almenüje: kinyitva/összecsukva (Story 8.3 AC7) */
  expanded?: boolean;
  onToggle?: () => void;
}) {
  const active = isActive(pathname, item.href);
  const Icon = item.icon;
  return (
    <div className="relative">
      <Link
        href={item.href}
        className={cn(
          "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition",
          onToggle && "pr-10",
          active
            ? "bg-[var(--color-primary-soft)] text-[var(--color-primary)]"
            : "text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
        )}
      >
        <Icon className="w-4.5 h-4.5" strokeWidth={active ? 2.25 : 1.85} />
        <span>{item.label}</span>
      </Link>
      {onToggle && (
        <button
          type="button"
          onClick={onToggle}
          aria-expanded={expanded}
          aria-label={expanded ? `${item.label} almenü összecsukása` : `${item.label} almenü kinyitása`}
          title={expanded ? "Összecsukás" : "Kinyitás"}
          className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
        >
          <ChevronDown className={cn("w-4 h-4 transition-transform", !expanded && "-rotate-90")} />
        </button>
      )}
    </div>
  );
}

// Összecsukott almenük (href-ek), localStorage-ban megjegyezve.
const GROUPS_KEY = "sidebar-groups";
function readGroups(): string[] {
  try {
    const v = JSON.parse(localStorage.getItem(GROUPS_KEY) ?? "[]");
    return Array.isArray(v) ? v.filter((x): x is string => typeof x === "string") : [];
  } catch {
    return [];
  }
}
function useCollapsedGroups() {
  const [collapsed, setCollapsed] = useState<string[]>([]);
  useEffect(() => {
    const stored = readGroups();
    if (stored.length) queueMicrotask(() => setCollapsed(stored));
  }, []);
  const toggle = (href: string) =>
    setCollapsed((cur) => {
      const next = cur.includes(href) ? cur.filter((h) => h !== href) : [...cur, href];
      try {
        localStorage.setItem(GROUPS_KEY, JSON.stringify(next));
      } catch {}
      return next;
    });
  return { isOpen: (href: string) => !collapsed.includes(href), toggle };
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
          : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)] hover:bg-[var(--color-muted)]",
      )}
    >
      <Icon className="w-4 h-4" strokeWidth={active ? 2.25 : 1.85} />
      <span>{item.label}</span>
    </Link>
  );
}

export function Sidebar() {
  const pathname = usePathname() ?? "/";
  const groups = useCollapsedGroups();
  if (isAuthRoute(pathname)) return null;

  const inCooking = COOKING_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(p + "/"),
  );
  const inCosts =
    pathname === "/koltsegek" ||
    pathname.startsWith("/koltsegek/") ||
    pathname === "/beallitasok";
  const inTodos =
    pathname === "/teendok" ||
    pathname.startsWith("/teendok/") ||
    pathname === "/beallitasok";

  // Egy konkrét utazáson belül: al-menü (Áttekintés / Terv).
  const tripMatch = pathname.match(/^\/utazasok\/([^/]+)/);
  const tripId = tripMatch && tripMatch[1] !== "uj" ? tripMatch[1] : null;
  const tripSub: NavItem[] = tripId
    ? [
        {
          href: `/utazasok/${tripId}`,
          label: "Áttekintés",
          icon: LayoutDashboard,
        },
        { href: `/utazasok/${tripId}/terv`, label: "Terv", icon: MapIcon },
      ]
    : [];
  const hasSub = (href: string) =>
    (href === "/fozes" && inCooking) ||
    (href === "/koltsegek" && inCosts) ||
    (href === "/teendok" && inTodos) ||
    (href === "/utazasok" && tripSub.length > 0);


  return (
    <>
      <button
        type="button"
        onClick={() => setSidebarCollapsed(false)}
        className="sidebar-open-btn hidden fixed bottom-4 left-4 z-40 w-10 h-10 rounded-xl items-center justify-center border border-[var(--color-border)] bg-[var(--color-card)] text-[var(--color-muted-foreground)] shadow-md hover:text-[var(--color-foreground)] transition"
        aria-label="Oldalsáv kinyitása"
        title="Oldalsáv kinyitása"
      >
        <PanelLeftOpen className="w-4.5 h-4.5" />
      </button>
      <aside className="sidebar-panel hidden md:flex md:flex-col md:fixed md:inset-y-0 md:left-0 md:w-64 border-r border-[var(--color-border)] bg-[var(--color-card)] z-40">
        <div className="flex items-start">
          <Link
            href="/"
            className="flex-1 min-w-0 pl-5 pr-2 pt-6 pb-4 flex items-center gap-3"
          >
            <div className="w-10 h-10 rounded-xl brand-gradient flex items-center justify-center shadow-sm shrink-0">
              <Compass className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div>
              <p className="font-bold tracking-tight leading-none">
                Élet Portál
              </p>
              <p className="text-[11px] text-[var(--color-muted-foreground)] mt-0.5">
                Kövesd a dolgaid
              </p>
            </div>
          </Link>
          <button
            type="button"
            onClick={() => setSidebarCollapsed(true)}
            className="mt-7 mr-3 w-8 h-8 shrink-0 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
            aria-label="Oldalsáv becsukása"
            title="Oldalsáv becsukása"
          >
            <PanelLeftClose className="w-4.5 h-4.5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-1">
          {primary.map((it) => (
            <div key={it.href}>
              <NavLink
                item={it}
                pathname={pathname}
                {...(hasSub(it.href)
                  ? { expanded: groups.isOpen(it.href), onToggle: () => groups.toggle(it.href) }
                  : {})}
              />
              {it.href === "/fozes" && inCooking && groups.isOpen(it.href) && (
                <div className="mt-1 mb-1 space-y-0.5 border-l border-[var(--color-border)] ml-4">
                  {cooking.map((sub) => (
                    <SubLink key={sub.href} item={sub} pathname={pathname} />
                  ))}
                </div>
              )}
              {it.href === "/koltsegek" && inCosts && groups.isOpen(it.href) && (
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
              {it.href === "/teendok" && inTodos && groups.isOpen(it.href) && (
                <div className="mt-1 mb-1 space-y-0.5 border-l border-[var(--color-border)] ml-4">
                  {todos.map((sub) => (
                    <SubLink
                      key={sub.href}
                      item={sub}
                      pathname={pathname}
                      exact={sub.href === "/teendok"}
                    />
                  ))}
                </div>
              )}
              {it.href === "/utazasok" && tripSub.length > 0 && groups.isOpen(it.href) && (
                <div className="mt-1 mb-1 space-y-0.5 border-l border-[var(--color-border)] ml-4">
                  {tripSub.map((sub) => (
                    <SubLink
                      key={sub.href}
                      item={sub}
                      pathname={pathname}
                      exact={sub.href === `/utazasok/${tripId}`}
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
          <form action={logout}>
            <button className="w-full h-9 px-3 rounded-xl flex items-center gap-2.5 text-sm font-medium text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition">
              <LogOut className="w-4 h-4" />
              Kijelentkezés
            </button>
          </form>
        </div>
      </aside>
    </>
  );
}
