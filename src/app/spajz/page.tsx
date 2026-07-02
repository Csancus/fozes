import { requireUser } from "@/lib/auth";
import { listPantry, listLocations, ensureDefaultLocations } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { LinkCard } from "@/components/ui/Card";
import { fmt } from "@/lib/units";
import type { LocationKind } from "@/lib/types";
import {
  Refrigerator,
  Snowflake,
  Package,
  Box,
  Package2,
  ChevronRight,
  Plus,
  Trash2,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";

function daysUntil(ts: number | null): number | null {
  if (!ts) return null;
  return Math.ceil((ts - Date.now()) / (1000 * 60 * 60 * 24));
}

function expiryBadge(ts: number | null) {
  const d = daysUntil(ts);
  if (d === null) return null;
  if (d < 0)
    return <Badge tone="danger">Lejárt {-d} napja</Badge>;
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

export default async function SpajzPage() {
  const me = await requireUser();
  await ensureDefaultLocations(me.householdId);
  const [items, locations] = await Promise.all([
    listPantry(me.householdId),
    listLocations(me.householdId),
  ]);
  const locById = new Map(locations.map((l) => [l.id, l]));

  const grouped = new Map<string, typeof items>();
  for (const l of locations) grouped.set(l.id, []);
  for (const it of items) {
    if (!grouped.has(it.locationId)) grouped.set(it.locationId, []);
    grouped.get(it.locationId)!.push(it);
  }

  const orphans = items.filter((it) => !locById.has(it.locationId));
  const isEmpty = items.length === 0;

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Spájz"
        action={
          <Button
            href="/spajz/uj"
            size="sm"
            variant="primary"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Új tétel
          </Button>
        }
      />

      <div className="mt-4">
        <Button
          href="/helyek"
          size="sm"
          variant="secondary"
          leftIcon={<Box className="w-4 h-4" />}
        >
          Helyek kezelése
        </Button>
      </div>

      {isEmpty ? (
        <EmptyState
          icon={Refrigerator}
          title="Üres a spájz"
          description="Add hozzá az első tételt."
          action={
            <Button
              href="/spajz/uj"
              variant="primary"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Új tétel
            </Button>
          }
        />
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
    </main>
  );
}
