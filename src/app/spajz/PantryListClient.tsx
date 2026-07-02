"use client";

import { useMemo, useState } from "react";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { LinkCard } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { fmt } from "@/lib/units";
import type { Location, LocationKind, PantryItem } from "@/lib/types";
import {
  Refrigerator,
  Snowflake,
  Package,
  Box,
  Package2,
  ChevronRight,
  Trash2,
  Search,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function daysUntil(ts: number | null): number | null {
  if (!ts) return null;
  return Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryBadge(ts: number | null) {
  const d = daysUntil(ts);
  if (d === null) return null;
  if (d < 0) return <Badge tone="danger">Lejárt {-d} napja</Badge>;
  if (d === 0) return <Badge tone="danger">Ma jár le</Badge>;
  if (d <= 3) return <Badge tone="warning">Lejár {d} nap múlva</Badge>;
  return <Badge tone="muted">Lejár {d} nap múlva</Badge>;
}

const KIND_ICON: Record<LocationKind, LucideIcon> = {
  fridge: Refrigerator,
  freezer: Snowflake,
  pantry: Package,
  custom: Box,
};

export function PantryListClient({
  items,
  locations,
}: {
  items: PantryItem[];
  locations: Location[];
}) {
  const [q, setQ] = useState("");
  const needle = q.trim().toLowerCase();
  const isSearching = needle.length > 0;

  const locById = useMemo(
    () => new Map(locations.map((l) => [l.id, l])),
    [locations]
  );

  const filtered = useMemo(() => {
    if (!needle) return items;
    return items.filter((it) => it.name.toLowerCase().includes(needle));
  }, [items, needle]);

  const grouped = useMemo(() => {
    const map = new Map<string, PantryItem[]>();
    for (const l of locations) map.set(l.id, []);
    for (const it of items) {
      if (!map.has(it.locationId)) map.set(it.locationId, []);
      map.get(it.locationId)!.push(it);
    }
    return map;
  }, [items, locations]);

  const orphans = useMemo(
    () => items.filter((it) => !locById.has(it.locationId)),
    [items, locById]
  );

  return (
    <div className="mt-4">
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

      {isSearching ? (
        <div className="mt-6">
          {filtered.length === 0 ? (
            <p className="mt-4 text-center text-sm text-[var(--color-muted-foreground)]">
              Nincs találat a keresésre.
            </p>
          ) : (
            <ul className="space-y-2">
              {filtered.map((it) => {
                const loc = locById.get(it.locationId);
                return (
                  <li key={it.id}>
                    <LinkCard href={`/spajz/${it.id}`} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                          <Package2 className="w-4.5 h-4.5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[15px] truncate">
                            {it.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-[var(--color-muted-foreground)]">
                              {fmt(it.qty, it.unit)}
                            </span>
                            {loc && (
                              <span className="text-xs text-[var(--color-muted-foreground)]">
                                · {loc.name}
                              </span>
                            )}
                            {expiryBadge(it.expiresAt)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                      </div>
                    </LinkCard>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      ) : (
        <div className="mt-6 space-y-6">
          {locations.map((l) => {
            const list = grouped.get(l.id) ?? [];
            if (list.length === 0) return null;
            const Icon = KIND_ICON[l.kind] ?? Box;
            return (
              <Section
                key={l.id}
                title={l.name}
                action={
                  <Icon
                    className="w-4 h-4 text-[var(--color-muted-foreground)]"
                    strokeWidth={1.75}
                  />
                }
              >
                <ul className="space-y-2">
                  {list.map((it) => (
                    <li key={it.id}>
                      <LinkCard href={`/spajz/${it.id}`} className="p-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                            <Package2
                              className="w-4.5 h-4.5"
                              strokeWidth={2}
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-[15px] truncate">
                              {it.name}
                            </p>
                            <div className="mt-1 flex items-center gap-2 flex-wrap">
                              <span className="text-xs font-mono text-[var(--color-muted-foreground)]">
                                {fmt(it.qty, it.unit)}
                              </span>
                              {expiryBadge(it.expiresAt)}
                            </div>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                        </div>
                      </LinkCard>
                    </li>
                  ))}
                </ul>
              </Section>
            );
          })}

          {orphans.length > 0 && (
            <Section
              title="Törölt hely"
              action={
                <Trash2
                  className="w-4 h-4 text-[var(--color-muted-foreground)]"
                  strokeWidth={1.75}
                />
              }
            >
              <ul className="space-y-2">
                {orphans.map((it) => (
                  <li key={it.id}>
                    <LinkCard href={`/spajz/${it.id}`} className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-[var(--color-muted)] text-[var(--color-muted-foreground)] flex items-center justify-center shrink-0">
                          <Package2 className="w-4.5 h-4.5" strokeWidth={2} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-[15px] truncate">
                            {it.name}
                          </p>
                          <div className="mt-1 flex items-center gap-2 flex-wrap">
                            <span className="text-xs font-mono text-[var(--color-muted-foreground)]">
                              {fmt(it.qty, it.unit)}
                            </span>
                            {expiryBadge(it.expiresAt)}
                          </div>
                        </div>
                        <ChevronRight className="w-4 h-4 text-[var(--color-muted-foreground)] shrink-0" />
                      </div>
                    </LinkCard>
                  </li>
                ))}
              </ul>
            </Section>
          )}
        </div>
      )}
    </div>
  );
}
