"use client";

import { useMemo, useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { LinkCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { ShoppingList } from "@/lib/types";
import { ShoppingCart, ClipboardList, ChevronRight, Search } from "lucide-react";

function formatDate(ts: number): string {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}. ${m}. ${day}.`;
}

export function ShoppingListClient({ lists }: { lists: ShoppingList[] }) {
  const [q, setQ] = useState("");

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    if (!needle) return lists;
    return lists.filter((l) => l.name.toLowerCase().includes(needle));
  }, [lists, q]);

  return (
    <div className="mt-4 animate-fade-up">
      <div className="relative">
        <Search
          className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--color-muted-foreground)] pointer-events-none"
          strokeWidth={2}
        />
        <Input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Keresés..."
          className="pl-10"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="mt-8 text-center text-sm text-[var(--color-muted-foreground)]">
          Nincs találat a keresésre.
        </p>
      ) : (
        <ul className="mt-5 space-y-3">
          {filtered.map((l) => {
            const toBuy = l.items.filter((it) => it.need > 0);
            const boughtCount = toBuy.filter((it) => it.checked).length;
            const done = l.completedAt != null;
            const pct =
              toBuy.length > 0
                ? Math.round((boughtCount / toBuy.length) * 100)
                : 0;
            const Icon = done ? ClipboardList : ShoppingCart;
            return (
              <li key={l.id}>
                <LinkCard href={`/bevasarlas/${l.id}`} className="group p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5" strokeWidth={2} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-[15px] truncate">
                          {l.name}
                        </p>
                        {done && <Badge tone="success">Kész</Badge>}
                      </div>
                      <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5 truncate">
                        {formatDate(l.createdAt)}
                        {toBuy.length > 0 && (
                          <>
                            {" "}
                            · {boughtCount} / {toBuy.length} megvéve
                          </>
                        )}
                      </p>
                      {toBuy.length > 0 && !done && (
                        <div className="mt-2 h-1.5 w-full rounded-full bg-[var(--color-muted)] overflow-hidden">
                          <div
                            className="h-full bg-[var(--color-primary)] transition-[width]"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      )}
                    </div>
                    <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] group-hover:text-[var(--color-primary)] transition shrink-0" />
                  </div>
                </LinkCard>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
