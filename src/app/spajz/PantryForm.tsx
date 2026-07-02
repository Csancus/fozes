"use client";

import { useState } from "react";
import { UNITS } from "@/lib/units";
import type {
  Location,
  PantryItem,
  Unit,
  CatalogItem,
} from "@/lib/types";
import { Save, Package, Plus } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Field } from "@/components/ui/Input";
import Link from "next/link";

function dateInput(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function PantryForm({
  action,
  locations,
  catalog,
  initial,
}: {
  action: (fd: FormData) => void | Promise<void>;
  locations: Location[];
  catalog: CatalogItem[];
  initial?: PantryItem;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [unit, setUnit] = useState<Unit>(initial?.unit ?? "db");
  const [qty, setQty] = useState<string>(String(initial?.qty ?? 1));
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>("");

  function applyCatalog(id: string) {
    setSelectedCatalogId(id);
    if (!id) return;
    const item = catalog.find((c) => c.id === id);
    if (!item) return;
    setName(item.name);
    setUnit(item.defaultUnit);
    if (item.defaultQty != null) setQty(String(item.defaultQty));
  }

  return (
    <form action={action} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      {catalog.length > 0 && !initial && (
        <div className="rounded-2xl border border-dashed border-[var(--color-primary)]/40 bg-[var(--color-primary-soft)]/40 p-4 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-[var(--color-primary)] text-sm font-semibold">
              <Package className="w-4 h-4" />
              Katalógusból választás
            </div>
            <Link
              href="/katalogus/uj"
              className="inline-flex items-center gap-1 text-xs text-[var(--color-primary)] hover:underline"
            >
              <Plus className="w-3 h-3" /> Új termék
            </Link>
          </div>
          <Select
            value={selectedCatalogId}
            onChange={(e) => applyCatalog(e.target.value)}
          >
            <option value="">— válassz —</option>
            {catalog.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
                {c.brand ? ` (${c.brand})` : ""}
              </option>
            ))}
          </Select>
          <p className="text-[11px] text-[var(--color-muted-foreground)]">
            Katalógusból választva a név, egység és alap mennyiség kitöltődik.
          </p>
        </div>
      )}

      <Field label="Név" required>
        <Input
          name="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          list="pantry-catalog-names"
        />
        {catalog.length > 0 && (
          <datalist id="pantry-catalog-names">
            {catalog.map((c) => (
              <option key={c.id} value={c.name} />
            ))}
          </datalist>
        )}
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mennyiség" required>
          <Input
            name="qty"
            type="number"
            step="any"
            required
            value={qty}
            onChange={(e) => setQty(e.target.value)}
          />
        </Field>
        <Field label="Egység">
          <Select
            name="unit"
            value={unit}
            onChange={(e) => setUnit(e.target.value as Unit)}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </Field>
      </div>

      <Field label="Hely" required>
        <Select
          name="locationId"
          required
          defaultValue={initial?.locationId ?? locations[0]?.id}
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </Select>
      </Field>

      <Field label="Lejárati dátum" hint="Opcionális">
        <Input
          name="expiresAt"
          type="date"
          defaultValue={dateInput(initial?.expiresAt ?? null)}
        />
      </Field>

      <Field label="Ár (Ft)" hint="Opcionális">
        <Input
          name="price"
          type="number"
          step="1"
          defaultValue={initial?.price ?? ""}
        />
      </Field>

      <Field label="Megjegyzés">
        <Textarea name="note" defaultValue={initial?.note ?? ""} rows={2} />
      </Field>

      <Button
        type="submit"
        size="lg"
        fullWidth
        leftIcon={<Save className="w-4 h-4" />}
      >
        Mentés
      </Button>
    </form>
  );
}
