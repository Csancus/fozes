"use client";

import { useMemo, useState } from "react";
import type {
  Location,
  Purchase,
  ShoppingList,
} from "@/lib/types";
import { fmt } from "@/lib/units";
import { finalizeMatchAction } from "../../szamla/actions";

function dateInput(ts: number | null): string {
  if (!ts) return "";
  const d = new Date(ts);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

const inputClass =
  "w-full rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-2 py-1.5 text-sm text-zinc-900 dark:text-zinc-50";

type LineUi = {
  match: string; // itemIndex-as-string | "none" | "skip"
  addToPantry: boolean;
  locationId: string;
  expiresAt: string; // yyyy-mm-dd, empty for none
};

export function MatchForm({
  list,
  purchase,
  locations,
  suggestedMatches,
}: {
  list: ShoppingList;
  purchase: Purchase;
  locations: Location[];
  suggestedMatches: (number | null)[];
}) {
  const defaultLoc = locations[0]?.id ?? "";

  const [rows, setRows] = useState<LineUi[]>(() =>
    purchase.lines.map((_, i) => {
      const suggested = suggestedMatches[i];
      return {
        match: suggested !== null && suggested !== undefined
          ? String(suggested)
          : "none",
        addToPantry: true,
        locationId: defaultLoc,
        expiresAt: "",
      };
    })
  );

  const matchedIndices = useMemo(() => {
    const s = new Set<number>();
    for (const r of rows) {
      if (r.match !== "none" && r.match !== "skip") {
        const n = Number(r.match);
        if (Number.isFinite(n)) s.add(n);
      }
    }
    return s;
  }, [rows]);

  function patch(i: number, next: Partial<LineUi>) {
    setRows((cur) => cur.map((r, idx) => (idx === i ? { ...r, ...next } : r)));
  }

  return (
    <form action={finalizeMatchAction} className="space-y-6">
      <input type="hidden" name="listId" value={list.id} />
      <input type="hidden" name="purchaseId" value={purchase.id} />

      <div className="grid gap-6 md:grid-cols-[2fr_1fr]">
        {/* LEFT: parsed lines */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Blokk tételek ({purchase.lines.length})
          </h2>

          {purchase.lines.length === 0 && (
            <p className="mt-3 text-sm text-zinc-500">
              Nem sikerült tételt beolvasni. Nyisd meg a blokkot a{" "}
              <a
                href={`/vasarlas/${purchase.id}/szerkesztes`}
                className="underline"
              >
                vásárlások szerkesztőjében
              </a>{" "}
              és add hozzá kézzel.
            </p>
          )}

          <ul className="mt-2 space-y-3">
            {purchase.lines.map((line, i) => {
              const row = rows[i];
              return (
                <li
                  key={i}
                  className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-3 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{line.name}</div>
                      <div className="text-xs text-zinc-500 mt-0.5">
                        {fmt(line.qty, line.unit)}
                        {line.unitPrice > 0 && (
                          <>
                            {" "}× {fmtFt(line.unitPrice)}/{line.unit}
                          </>
                        )}
                      </div>
                    </div>
                    <div className="text-right shrink-0 text-sm font-medium">
                      {fmtFt(line.total)}
                    </div>
                  </div>

                  <label className="block">
                    <span className="text-[10px] uppercase text-zinc-500">
                      Kösd hozzá
                    </span>
                    <select
                      name={`match-${i}`}
                      value={row.match}
                      onChange={(e) => patch(i, { match: e.target.value })}
                      className={inputClass}
                    >
                      <option value="none">— egyik sem (spájzba mehet) —</option>
                      <option value="skip">kihagyás</option>
                      <optgroup label="Listaelemek">
                        {list.items.map((it, itIdx) => (
                          <option key={itIdx} value={String(itIdx)}>
                            {it.name} ({fmt(it.need, it.unit)})
                            {it.checked ? " ✓" : ""}
                          </option>
                        ))}
                      </optgroup>
                    </select>
                  </label>

                  <div className="grid grid-cols-[auto_1fr_1fr] gap-2 items-end">
                    <label className="flex items-center gap-2 text-sm h-9">
                      <input
                        type="checkbox"
                        name={`addToPantry-${i}`}
                        checked={row.addToPantry}
                        onChange={(e) =>
                          patch(i, {
                            addToPantry: e.target.checked,
                            locationId: e.target.checked
                              ? row.locationId || defaultLoc
                              : row.locationId,
                          })
                        }
                      />
                      <span>Spájzba</span>
                    </label>

                    <label className="block">
                      <span className="text-[10px] uppercase text-zinc-500">Hely</span>
                      <select
                        name={`locationId-${i}`}
                        value={row.locationId}
                        onChange={(e) => patch(i, { locationId: e.target.value })}
                        disabled={!row.addToPantry}
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
                        value={row.expiresAt}
                        onChange={(e) => patch(i, { expiresAt: e.target.value })}
                        disabled={!row.addToPantry}
                        className={inputClass}
                      />
                    </label>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>

        {/* RIGHT: shopping list summary */}
        <aside>
          <h2 className="text-sm font-semibold text-zinc-500 uppercase tracking-wide">
            Lista ({list.items.length})
          </h2>
          <ul className="mt-2 divide-y divide-zinc-200 dark:divide-zinc-800 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm">
            {list.items.map((it, i) => {
              const matched = matchedIndices.has(i);
              return (
                <li
                  key={i}
                  className="px-3 py-2 flex items-center gap-2"
                >
                  <span
                    className={`h-4 w-4 rounded border flex-shrink-0 flex items-center justify-center text-[10px] ${
                      matched || it.checked
                        ? "bg-zinc-900 dark:bg-zinc-50 border-zinc-900 dark:border-zinc-50 text-zinc-50 dark:text-zinc-900"
                        : "border-zinc-400 dark:border-zinc-600"
                    }`}
                  >
                    {matched || it.checked ? "✓" : ""}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div
                      className={`truncate ${
                        matched || it.checked
                          ? "line-through text-zinc-400"
                          : ""
                      }`}
                    >
                      {it.name}
                    </div>
                    <div className="text-[10px] text-zinc-500">
                      {fmt(it.need, it.unit)}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>

      <button
        type="submit"
        className="w-full rounded-lg bg-zinc-900 dark:bg-zinc-50 text-zinc-50 dark:text-zinc-900 py-3 font-medium"
      >
        Mentés és lista frissítése
      </button>
    </form>
  );
}
