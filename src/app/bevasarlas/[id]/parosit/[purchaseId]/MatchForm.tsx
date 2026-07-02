"use client";

import { useState } from "react";
import type {
  Location,
  Purchase,
  ShoppingList,
} from "@/lib/types";
import { fmt } from "@/lib/units";
import { finalizeMatchAction } from "../../szamla/actions";
import { Select, Input, Field } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn } from "@/lib/cn";
import { Check, Sparkles, Package, Receipt } from "lucide-react";
import Link from "next/link";

function fmtFt(n: number): string {
  return `${new Intl.NumberFormat("hu-HU").format(Math.round(n))} Ft`;
}

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
        match:
          suggested !== null && suggested !== undefined
            ? String(suggested)
            : "none",
        addToPantry: true,
        locationId: defaultLoc,
        expiresAt: "",
      };
    })
  );

  function patch(i: number, next: Partial<LineUi>) {
    setRows((cur) =>
      cur.map((r, idx) => (idx === i ? { ...r, ...next } : r))
    );
  }

  if (purchase.lines.length === 0) {
    return (
      <div>
        <EmptyState
          icon={Receipt}
          title="Nem sikerült tételt beolvasni"
          description="Nyisd meg a blokkot a vásárlások szerkesztőjében és add hozzá kézzel."
          action={
            <Link
              href={`/vasarlas/${purchase.id}/szerkesztes`}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:underline"
            >
              Blokk szerkesztése
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <form action={finalizeMatchAction} className="space-y-5">
      <input type="hidden" name="listId" value={list.id} />
      <input type="hidden" name="purchaseId" value={purchase.id} />

      <ul className="space-y-3">
        {purchase.lines.map((line, i) => {
          const row = rows[i];
          const suggested = suggestedMatches[i];
          const suggestedName =
            suggested !== null && suggested !== undefined
              ? list.items[suggested]?.name
              : null;
          return (
            <li key={i}>
              <Card className="p-4 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[15px] truncate">
                      {line.name}
                    </p>
                    <p className="text-xs text-[var(--color-muted-foreground)] mt-0.5">
                      {fmt(line.qty, line.unit)}
                      {line.unitPrice > 0 && (
                        <>
                          {" "}
                          × {fmtFt(line.unitPrice)}/{line.unit}
                        </>
                      )}
                    </p>
                    {suggestedName && (
                      <div className="mt-2">
                        <Badge tone="primary">
                          <Sparkles className="w-3 h-3" />
                          Auto: {suggestedName}
                        </Badge>
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-base font-semibold tabular-nums">
                      {fmtFt(line.total)}
                    </p>
                  </div>
                </div>

                <Field label="Kösd hozzá a lista tételéhez">
                  <Select
                    name={`match-${i}`}
                    value={row.match}
                    onChange={(e) => patch(i, { match: e.target.value })}
                  >
                    <option value="none">
                      — egyik sem (spájzba mehet) —
                    </option>
                    <option value="skip">Kihagyás</option>
                    <optgroup label="Listaelemek">
                      {list.items.map((it, itIdx) => (
                        <option key={itIdx} value={String(itIdx)}>
                          {it.name} ({fmt(it.need, it.unit)})
                          {it.checked ? " ✓" : ""}
                        </option>
                      ))}
                    </optgroup>
                  </Select>
                </Field>

                <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-muted)]/40 p-3 space-y-3">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <span
                      className={cn(
                        "w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition",
                        row.addToPantry
                          ? "bg-[var(--color-primary)] text-[var(--color-primary-foreground)]"
                          : "border-2 border-[var(--color-input)] bg-[var(--color-card)] text-transparent"
                      )}
                    >
                      <Check className="w-4 h-4" strokeWidth={2.5} />
                    </span>
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
                      className="sr-only"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <Package className="w-3.5 h-3.5 text-[var(--color-muted-foreground)]" />
                        <span className="text-sm font-medium">
                          Spájzba tesz
                        </span>
                      </div>
                    </div>
                  </label>

                  {row.addToPantry && (
                    <div className="grid grid-cols-2 gap-2.5">
                      <Field label="Hely">
                        <Select
                          name={`locationId-${i}`}
                          value={row.locationId}
                          onChange={(e) =>
                            patch(i, { locationId: e.target.value })
                          }
                          disabled={!row.addToPantry}
                        >
                          <option value="">—</option>
                          {locations.map((loc) => (
                            <option key={loc.id} value={loc.id}>
                              {loc.name}
                            </option>
                          ))}
                        </Select>
                      </Field>
                      <Field label="Lejárat">
                        <Input
                          type="date"
                          name={`expiresAt-${i}`}
                          value={row.expiresAt}
                          onChange={(e) =>
                            patch(i, { expiresAt: e.target.value })
                          }
                          disabled={!row.addToPantry}
                        />
                      </Field>
                    </div>
                  )}
                </div>
              </Card>
            </li>
          );
        })}
      </ul>

      <Button
        type="submit"
        size="lg"
        fullWidth
        leftIcon={<Check className="w-4 h-4" />}
      >
        Mentés
      </Button>
    </form>
  );
}
