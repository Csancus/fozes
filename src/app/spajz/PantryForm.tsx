import { UNITS } from "@/lib/units";
import type { Location, PantryItem, Unit } from "@/lib/types";

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

      <Field label="Név">
        <input
          name="name"
          required
          defaultValue={initial?.name ?? ""}
          className={inputClass}
        />
      </Field>

      <div className="grid grid-cols-2 gap-3">
        <Field label="Mennyiség">
          <input
            name="qty"
            type="number"
            step="any"
            required
            defaultValue={initial?.qty ?? 1}
            className={inputClass}
          />
        </Field>
        <Field label="Egység">
          <select
            name="unit"
            defaultValue={initial?.unit ?? ("db" satisfies Unit)}
            className={inputClass}
          >
            {UNITS.map((u) => (
              <option key={u} value={u}>{u}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Hely">
        <select
          name="locationId"
          required
          defaultValue={initial?.locationId ?? locations[0]?.id}
          className={inputClass}
        >
          {locations.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </Field>

      <Field label="Lejárati dátum (opcionális)">
        <input
          name="expiresAt"
          type="date"
          defaultValue={dateInput(initial?.expiresAt ?? null)}
          className={inputClass}
        />
      </Field>

      <Field label="Ár (Ft, opcionális)">
        <input
          name="price"
          type="number"
          step="1"
          defaultValue={initial?.price ?? ""}
          className={inputClass}
        />
      </Field>

      <Field label="Megjegyzés">
        <textarea
          name="note"
          defaultValue={initial?.note ?? ""}
          rows={2}
          className={inputClass}
        />
      </Field>

      <button className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 py-3 font-medium">
        Mentés
      </button>
    </form>
  );
}

const inputClass =
  "w-full rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 text-zinc-900 dark:text-zinc-50";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-sm text-zinc-700 dark:text-zinc-300">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
