"use client";

import { useMemo, useState } from "react";
import { UNITS } from "@/lib/units";
import type { Location, Purchase, PurchaseLine, Unit } from "@/lib/types";
import { updatePurchaseAction } from "../../actions";

function dateInput(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

const inputClass =
  "w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-50";

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

  const allChecked =
    lines.length > 0 && lines.every((l) => l.addToPantry);

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
    <form action={updatePurchaseAction} className="space-y-4">
      <input type="hidden" name="id" value={purchase.id} />
      <input type="hidden" name="lineCount" value={lines.length} />

      <div className="grid grid-cols-2 gap-3">
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Bolt</span>
          <input
            name="store"
            defaultValue={purchase.store}
            className={`${inputClass} mt-1`}
          />
        </label>
        <label className="block">
          <span className="text-sm text-zinc-700 dark:text-zinc-300">Dátum</span>
          <input
            name="purchasedAt"
            type="date"
            defaultValue={dateInput(purchase.purchasedAt)}
            className={`${inputClass} mt-1`}
          />
        </label>
      </div>

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3">
        <div className="flex items-center justify-between mb-3">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={allChecked}
              onChange={(e) => toggleAll(e.target.checked)}
            />
            <span>Mind spájzba</span>
          </label>
          <div className="text-sm font-semibold">Összesen: {fmtFt(total)}</div>
        </div>

        <div className="space-y-3">
          {lines.map((l, i) => (
            <div
              key={i}
              className="rounded-lg border border-zinc-200 dark:border-zinc-800 p-3 space-y-2"
            >
              <div className="flex items-center gap-2">
                <input
                  name={`name-${i}`}
                  value={l.name}
                  onChange={(e) => patch(i, { name: e.target.value })}
                  placeholder="Tétel"
                  className={`${inputClass} flex-1`}
                />
                <button
                  type="button"
                  onClick={() => remove(i)}
                  className="text-xs text-red-600 hover:underline"
                >
                  Töröl
                </button>
              </div>

              <div className="grid grid-cols-4 gap-2">
                <label className="block">
                  <span className="text-[10px] uppercase text-zinc-500">Mennyiség</span>
                  <input
                    name={`qty-${i}`}
                    type="number"
                    step="any"
                    value={l.qty}
                    onChange={(e) =>
                      patch(i, { qty: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-zinc-500">Egység</span>
                  <select
                    name={`unit-${i}`}
                    value={l.unit}
                    onChange={(e) => patch(i, { unit: e.target.value as Unit })}
                    className={inputClass}
                  >
                    {UNITS.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-zinc-500">Egységár</span>
                  <input
                    name={`unitPrice-${i}`}
                    type="number"
                    step="1"
                    value={l.unitPrice}
                    onChange={(e) =>
                      patch(i, { unitPrice: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="block">
                  <span className="text-[10px] uppercase text-zinc-500">Összesen</span>
                  <input
                    name={`total-${i}`}
                    type="number"
                    step="1"
                    value={l.total}
                    onChange={(e) =>
                      patch(i, { total: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </label>
              </div>

              <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-end">
                <label className="flex items-center gap-2 text-sm h-9">
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
                  />
                  <span>Spájzba</span>
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase text-zinc-500">Hely</span>
                  <select
                    name={`locationId-${i}`}
                    value={l.locationId ?? ""}
                    onChange={(e) =>
                      patch(i, { locationId: e.target.value || null })
                    }
                    disabled={!l.addToPantry}
                    className={inputClass}
                  >
                    <option value="">—</option>
                    {locations.map((loc) => (
                      <option key={loc.id} value={loc.id}>
                        {loc.name}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="block">
                  <span className="text-[10px] uppercase text-zinc-500">Lejár</span>
                  <input
                    type="date"
                    name={`expiresAt-${i}`}
                    value={dateInput(l.expiresAt)}
                    onChange={(e) => {
                      const t = new Date(e.target.value).getTime();
                      patch(i, {
                        expiresAt: isNaN(t) ? null : t,
                      });
                    }}
                    className={inputClass}
                  />
                </label>
              </div>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={add}
          className="mt-3 w-full rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 py-2 text-sm text-zinc-600 dark:text-zinc-400 hover:border-zinc-500"
        >
          + Új tétel
        </button>
      </div>

      {purchase.raw && (
        <details className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
          <summary className="cursor-pointer px-4 py-3 text-sm text-zinc-600 dark:text-zinc-400">
            Nyers szöveg (hivatkozáshoz)
          </summary>
          <pre className="px-4 pb-4 text-xs font-mono whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">
            {purchase.raw}
          </pre>
        </details>
      )}

      <button className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 py-3 font-medium">
        Mentés
      </button>
    </form>
  );
}
