import { requireUser } from "@/lib/auth";
import { listLocations, ensureDefaultLocations } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Section } from "@/components/ui/Section";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/Input";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  Refrigerator,
  Snowflake,
  Package,
  Box,
  Plus,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { LocationKind } from "@/lib/types";
import { createLocationAction, deleteLocationAction } from "./actions";

const KIND_LABEL: Record<LocationKind, string> = {
  fridge: "Hűtő",
  freezer: "Fagyasztó",
  pantry: "Tartós",
  custom: "Szekrény",
};

const KIND_ICON: Record<LocationKind, LucideIcon> = {
  fridge: Refrigerator,
  freezer: Snowflake,
  pantry: Package,
  custom: Box,
};

export default async function HelyekPage() {
  const me = await requireUser();
  await ensureDefaultLocations(me.householdId);
  const locations = await listLocations(me.householdId);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Tárolási helyek"
        subtitle="Ahova a spájz tételeket teszed"
        back="/spajz"
      />

      <Section title="Helyek" className="mt-6">
        {locations.length === 0 ? (
          <EmptyState
            icon={Box}
            title="Nincs még hely"
            description="Adj hozzá egy tárolási helyet lent."
          />
        ) : (
          <ul className="space-y-2">
            {locations.map((l) => {
              const Icon = KIND_ICON[l.kind] ?? Box;
              return (
                <li key={l.id}>
                  <Card className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
                        <Icon className="w-4.5 h-4.5" strokeWidth={2} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-[15px] truncate">
                          {l.name}
                        </p>
                        <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                          {KIND_LABEL[l.kind]}
                        </p>
                      </div>
                      <form action={deleteLocationAction}>
                        <input type="hidden" name="id" value={l.id} />
                        <Button
                          type="submit"
                          variant="ghost"
                          size="sm"
                          className="text-red-600 hover:text-red-700"
                          aria-label="Törlés"
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </form>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </Section>

      <Section title="Új hely" className="mt-8">
        <Card className="p-5">
          <form action={createLocationAction} className="space-y-4">
            <Field label="Név" required>
              <Input
                name="name"
                required
                placeholder="pl. Konyhaszekrény bal felső"
              />
            </Field>
            <Field label="Típus">
              <Select name="kind" defaultValue="custom">
                <option value="fridge">Hűtő</option>
                <option value="freezer">Fagyasztó</option>
                <option value="pantry">Tartós</option>
                <option value="custom">Szekrény / egyéb</option>
              </Select>
            </Field>
            <Button
              type="submit"
              size="lg"
              fullWidth
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Hozzáadás
            </Button>
          </form>
        </Card>
      </Section>
    </main>
  );
}
