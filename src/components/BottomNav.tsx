"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Tab = {
  href: string;
  icon: string;
  label: string;
};

const TABS: Tab[] = [
  { href: "/", icon: "🏠", label: "Kezdő" },
  { href: "/receptek", icon: "📖", label: "Receptek" },
  { href: "/spajz", icon: "🥫", label: "Spájz" },
  { href: "/bevasarlas", icon: "🛒", label: "Bevásárlás" },
  { href: "/vasarlas", icon: "🧾", label: "Vásárlás" },
];

function isActive(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function BottomNav() {
  const pathname = usePathname();

  if (pathname === "/belepes" || pathname.startsWith("/belepes/")) {
    return null;
  }

  return (
    <nav
      className="fixed bottom-0 inset-x-0 z-40 border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur pb-[env(safe-area-inset-bottom)]"
      aria-label="Fő navigáció"
    >
      <ul className="grid grid-cols-5">
        {TABS.map((tab) => {
          const active = isActive(pathname, tab.href);
          return (
            <li key={tab.href} className="contents">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={
                  "flex flex-col items-center justify-center gap-0.5 py-2 text-[11px] leading-tight " +
                  (active
                    ? "font-semibold text-orange-600 dark:text-orange-400"
                    : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-50")
                }
              >
                <span className="text-xl leading-none" aria-hidden="true">
                  {tab.icon}
                </span>
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
