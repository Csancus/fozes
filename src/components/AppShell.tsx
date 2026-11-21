"use client";

import { usePathname } from "next/navigation";
import { isAuthRoute } from "@/lib/auth-routes";
import { StickyTableHeads } from "./StickyTableHeads";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "/";
  if (isAuthRoute(pathname)) return <div className="min-h-dvh">{children}</div>;
  return (
    <div className="app-main min-h-dvh pb-[calc(var(--bottom-nav-h)+1.25rem)] md:pb-0 md:pl-64">
      <StickyTableHeads />
      {children}
    </div>
  );
}
