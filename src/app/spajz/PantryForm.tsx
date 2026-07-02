import { UNITS } from "@/lib/units";
import type { Location, PantryItem, Unit } from "@/lib/types";
import { Save } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input, Select, Textarea, Field } from "@/components/ui/Input";

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
  initial,
}: {
  action: (fd: FormData) => void | Promise<void>;
  locations: Location[];
  initial?: PantryItem;
}) {
  return (
    <form action={action} className="space-y-4">
      {initial && <input type="hidden" name="id" value={initial.id} />}

      <Field label="Név" required>
        <Input name="name" required defaultValue={initial?.name ?? ""} />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mennyiség" required>
          <Input
            name="qty"
            type="number"
            step="any"
            required
            defaultValue={initial?.qty ?? 1}
          />
        </Field>
        <Field label="Egység">
          <Select
            name="unit"
            defaultValue={initial?.unit ?? ("db" satisfies Unit)}
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
