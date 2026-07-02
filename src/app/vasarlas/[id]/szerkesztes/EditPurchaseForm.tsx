"use client";

import { useMemo, useState } from "react";
import { UNITS } from "@/lib/units";
import type { Location, Purchase, PurchaseLine, Unit } from "@/lib/types";
import { updatePurchaseAction } from "../../actions";
import { Button } from "@/components/ui/Button";
import { Input, Select, Field } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Plus, Save, Trash2, Sprout } from "lucide-react";

function dateInput(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

type LineState = PurchaseLine;

function emptyLine(): LineState {
  return {
    name: "",
    qty: 1,
    unit: "db",
    unitPrice: 0,
    total: 0,
    addToPantry: false,
    locationId: null,
    expiresAt: null,
  };
}

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

const SOURCE_LABEL: Record<string, string> = {
  text: "Szöveg",
  pdf: "PDF",
  photo: "Fotó",
  manual: "Kézi",
};

const SOURCE_TONE: Record<string, "neutral" | "primary" | "muted"> = {
  text: "neutral",
  pdf: "primary",
  photo: "primary",
  manual: "muted",
};

export function EditPurchaseForm({
  purchase,
  locations,
}: {
  purchase: Purchase;
  locations: Location[];
}) {
  const [lines, setLines] = useState<LineState[]>(() =>
    purchase.lines.length > 0
      ? purchase.lines.map((l) => ({ ...l }))
      : [emptyLine()]
  );

  const defaultLoc = locations[0]?.id ?? "";

  const total = useMemo(
    () => lines.reduce((s, l) => s + (Number(l.total) || 0), 0),
    [lines]
  );

  function patch(i: number, next: Partial<LineState>) {
    setLines((cur) => cur.map((l, idx) => (idx === i ? { ...l, ...next } : l)));
  }

  function remove(i: number) {
    setLines((cur) => cur.filter((_, idx) => idx !== i));
  }

  function add() {
    setLines((cur) => [...cur, emptyLine()]);
  }

  const allChecked = lines.length > 0 && lines.every((l) => l.addToPantry);

  function toggleAll(checked: boolean) {
    setLines((cur) =>
      cur.map((l) => ({
        ...l,
        addToPantry: checked,
        locationId: checked ? l.locationId ?? defaultLoc : l.locationId,
      }))
    );
  }

  return (
    <form action={updatePurchaseAction} className="space-y-5">
      <input type="hidden" name="id" value={purchase.id} />
      <input type="hidden" name="lineCount" value={lines.length} />

      <Card>
        <div className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <Badge tone={SOURCE_TONE[purchase.source] ?? "neutral"}>
              {SOURCE_LABEL[purchase.source] ?? purchase.source}
            </Badge>
            <div className="text-right">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                Összesen
              </div>
              <div className="text-lg font-bold tabular-nums font-mono">{fmtFt(total)}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Field label="Bolt">
              <Input name="store" defaultValue={purchase.store} />
            </Field>
            <Field label="Dátum">
              <Input name="purchasedAt" type="date" defaultValue={dateInput(purchase.purchasedAt)} />
            </Field>
          </div>

          <label className="flex items-center gap-2 text-sm pt-1">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => toggleAll(e.target.checked)}
              className="w-4 h-4 rounded border-[var(--color-input)] accent-[var(--color-primary)]"
            />
            <Sprout className="w-3.5 h-3.5 text-[var(--color-success)]" />
            <span className="text-[var(--color-foreground)]">Mind spájzba</span>
          </label>
        </div>
      </Card>

      <div className="space-y-3">
        {lines.map((l, i) => (
          <Card key={i} className="relative">
            <button
              type="button"
              onClick={() => remove(i)}
              aria-label="Sor törlése"
              className="absolute top-2.5 right-2.5 w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-red-500/10 hover:text-[var(--color-danger)] transition"
            >
              <Trash2 className="w-4 h-4" />
            </button>

            <div className="p-4 space-y-3">
              <Field label={`Tétel ${i + 1}`}>
                <Input
                  name={`name-${i}`}
                  value={l.name}
                  onChange={(e) => patch(i, { name: e.target.value })}
                  placeholder="pl. Tej 2,8% 1l"
                  className="pr-10"
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Mennyiség">
                  <Input
                    name={`qty-${i}`}
                    type="number"
                    step="any"
                    value={l.qty}
                    onChange={(e) => patch(i, { qty: Number(e.target.value) })}
                  />
                </Field>
                <Field label="Egység">
                  <Select
                    name={`unit-${i}`}
                    value={l.unit}
                    onChange={(e) => patch(i, { unit: e.target.value as Unit })}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Egységár">
                  <Input
                    name={`unitPrice-${i}`}
                    type="number"
                    step="1"
                    value={l.unitPrice}
                    onChange={(e) => patch(i, { unitPrice: Number(e.target.value) })}
                    className="tabular-nums"
                  />
                </Field>
                <Field label="Összesen">
                  <Input
                    name={`total-${i}`}
                    type="number"
                    step="1"
                    value={l.total}
                    onChange={(e) => patch(i, { total: Number(e.target.value) })}
                    className="tabular-nums"
                  />
                </Field>
              </div>

              <label className="flex items-center gap-2 text-sm pt-1">
                <input
                  type="checkbox"
                  name={`addToPantry-${i}`}
                  checked={l.addToPantry}
                  onChange={(e) =>
                    patch(i, {
                      addToPantry: e.target.checked,
                      locationId: e.target.checked
                        ? l.locationId ?? defaultLoc
                        : l.locationId,
                    })
                  }
                  className="w-4 h-4 rounded border-[var(--color-input)] accent-[var(--color-primary)]"
                />
                <Sprout className="w-3.5 h-3.5 text-[var(--color-success)]" />
                <span>Spájzba kerül</span>
              </label>

              {l.addToPantry && (
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Hely">
                    <Select
                      name={`locationId-${i}`}
                      value={l.locationId ?? ""}
                      onChange={(e) => patch(i, { locationId: e.target.value || null })}
                    >
                      <option value="">—</option>
                      {locations.map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.name}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="Lejár">
                    <Input
                      type="date"
                      name={`expiresAt-${i}`}
                      value={dateInput(l.expiresAt)}
                      onChange={(e) => {
                        const t = new Date(e.target.value).getTime();
                        patch(i, { expiresAt: isNaN(t) ? null : t });
                      }}
                    />
                  </Field>
                </div>
              )}
              {!l.addToPantry && (
                <>
                  <input type="hidden" name={`locationId-${i}`} value={l.locationId ?? ""} />
                  <input type="hidden" name={`expiresAt-${i}`} value={dateInput(l.expiresAt)} />
                </>
              )}
            </div>
          </Card>
        ))}
      </div>

      <Button
        type="button"
        onClick={add}
        variant="ghost"
        fullWidth
        leftIcon={<Plus className="w-4 h-4" />}
        className="border border-dashed border-[var(--color-input)]"
      >
        Új sor
      </Button>

      {purchase.raw && (
        <details className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm">
          <summary className="cursor-pointer px-5 py-3 text-sm text-[var(--color-muted-foreground)]">
            Nyers szöveg (hivatkozáshoz)
          </summary>
          <pre className="px-5 pb-4 text-xs font-mono whitespace-pre-wrap text-[var(--color-foreground)]/80">
            {purchase.raw}
          </pre>
        </details>
      )}

      <Button type="submit" size="lg" fullWidth leftIcon={<Save className="w-4 h-4" />}>
        Mentés
      </Button>
    </form>
  );
}
