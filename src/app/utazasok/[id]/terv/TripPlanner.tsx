"use client";

import { useMemo, useRef, useState, useTransition } from "react";
import { cn } from "@/lib/cn";
import { SubmitButton } from "@/components/ui/SubmitButton";
import {
  Plus,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
  Loader2,
  Check,
  ExternalLink,
} from "lucide-react";
import { TRIP_PLAN_COLUMNS } from "@/lib/types";
import type { TripDay, TripPlanItem } from "@/lib/types";

let counter = 0;
function uid(prefix: string): string {
  counter += 1;
  return `${prefix}-${counter}`;
}

function emptyItem(): TripPlanItem {
  return {
    id: uid("i"),
    start: "",
    place: "",
    type: "",
    travelTime: "",
    duration: "",
    arrival: "",
    note: "",
    link: "",
    accommodation: "",
    bikeDist: "",
    kayak: "",
    gear: "",
  };
}

function emptyDay(): TripDay {
  return {
    id: uid("d"),
    date: "",
    title: "",
    start: "",
    travelTime: "",
    duration: "",
    arrival: "",
    items: [emptyItem()],
  };
}

// Oszlop-szélességek (px) — a vízszintes görgetéshez.
const COL_WIDTH: Record<string, number> = {
  start: 72,
  place: 200,
  type: 110,
  travelTime: 90,
  duration: 90,
  arrival: 90,
  note: 240,
  link: 160,
  accommodation: 220,
  bikeDist: 100,
  kayak: 200,
  gear: 160,
};

const cellCls =
  "h-9 w-full rounded-md border border-transparent bg-transparent px-1.5 text-[13px] hover:border-[var(--color-border)] focus:outline-none focus:border-[var(--color-primary)] focus:bg-[var(--color-card)] focus:ring-1 focus:ring-[var(--color-ring)]";

export function TripPlanner({
  tripId,
  initialDays,
  action,
}: {
  tripId: string;
  initialDays: TripDay[];
  action: (fd: FormData) => void | Promise<void>;
}) {
  const [days, setDays] = useState<TripDay[]>(
    initialDays.length > 0 ? initialDays : [emptyDay()]
  );
  const [collapsed, setCollapsed] = useState<Set<string>>(new Set());
  const [dirty, setDirty] = useState(false);
  const [saved, setSaved] = useState(false);
  const [pending, startTransition] = useTransition();
  const cleanRef = useRef(JSON.stringify(initialDays));

  function mutate(next: TripDay[]) {
    setDays(next);
    setDirty(JSON.stringify(next) !== cleanRef.current);
    setSaved(false);
  }

  function updateDay(dayId: string, patch: Partial<TripDay>) {
    mutate(days.map((d) => (d.id === dayId ? { ...d, ...patch } : d)));
  }
  function updateItem(dayId: string, itemId: string, patch: Partial<TripPlanItem>) {
    mutate(
      days.map((d) =>
        d.id === dayId
          ? {
              ...d,
              items: d.items.map((it) =>
                it.id === itemId ? { ...it, ...patch } : it
              ),
            }
          : d
      )
    );
  }
  function addItem(dayId: string) {
    mutate(
      days.map((d) =>
        d.id === dayId ? { ...d, items: [...d.items, emptyItem()] } : d
      )
    );
  }
  function removeItem(dayId: string, itemId: string) {
    mutate(
      days.map((d) =>
        d.id === dayId
          ? { ...d, items: d.items.filter((it) => it.id !== itemId) }
          : d
      )
    );
  }
  function addDay() {
    mutate([...days, emptyDay()]);
  }
  function removeDay(dayId: string) {
    mutate(days.filter((d) => d.id !== dayId));
  }
  function toggle(dayId: string) {
    setCollapsed((cur) => {
      const next = new Set(cur);
      if (next.has(dayId)) next.delete(dayId);
      else next.add(dayId);
      return next;
    });
  }

  function save() {
    const fd = new FormData();
    fd.set("id", tripId);
    fd.set("days", JSON.stringify(days));
    startTransition(async () => {
      await action(fd);
      cleanRef.current = JSON.stringify(days);
      setDirty(false);
      setSaved(true);
    });
  }

  const minWidth = useMemo(
    () =>
      44 +
      TRIP_PLAN_COLUMNS.reduce((s, c) => s + (COL_WIDTH[c.key] ?? 120), 0) +
      36,
    []
  );

  return (
    <div className="mt-5 pb-28">
      <div className="space-y-4">
        {days.map((day, di) => {
          const isCollapsed = collapsed.has(day.id);
          return (
            <div
              key={day.id}
              className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] overflow-hidden"
            >
              {/* Nap fejléc */}
              <div className="flex items-start gap-2 p-3 bg-[var(--color-muted)]/40 border-b border-[var(--color-border)]">
                <button
                  type="button"
                  onClick={() => toggle(day.id)}
                  className="mt-1.5 text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
                  aria-label={isCollapsed ? "Kinyitás" : "Összecsukás"}
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-4 h-4" />
                  ) : (
                    <ChevronDown className="w-4 h-4" />
                  )}
                </button>
                <div className="flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-6 gap-2">
                  <input
                    value={day.date}
                    onChange={(e) => updateDay(day.id, { date: e.target.value })}
                    placeholder="Dátum (pl. ápr. 30. Cs)"
                    className={cn(cellCls, "font-semibold col-span-2")}
                  />
                  <input
                    value={day.title}
                    onChange={(e) => updateDay(day.id, { title: e.target.value })}
                    placeholder="Nap címe (pl. Budapest–Velika Planina)"
                    className={cn(cellCls, "font-medium col-span-2 sm:col-span-4")}
                  />
                  <LabeledMini
                    label="Start"
                    value={day.start}
                    onChange={(v) => updateDay(day.id, { start: v })}
                  />
                  <LabeledMini
                    label="Menet"
                    value={day.travelTime}
                    onChange={(v) => updateDay(day.id, { travelTime: v })}
                  />
                  <LabeledMini
                    label="Időtart."
                    value={day.duration}
                    onChange={(v) => updateDay(day.id, { duration: v })}
                  />
                  <LabeledMini
                    label="Érkezés"
                    value={day.arrival}
                    onChange={(v) => updateDay(day.id, { arrival: v })}
                  />
                </div>
                <button
                  type="button"
                  onClick={() => removeDay(day.id)}
                  className="mt-1 h-7 w-7 flex items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:text-red-600 hover:bg-red-500/10"
                  aria-label="Nap törlése"
                  title={`${di + 1}. nap törlése`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Tételek táblázat */}
              {!isCollapsed && (
                <div className="overflow-x-auto">
                  <table
                    className="border-separate border-spacing-0"
                    style={{ minWidth: `${minWidth}px` }}
                  >
                    <thead>
                      <tr className="text-left text-[10px] uppercase tracking-wider text-[var(--color-muted-foreground)]">
                        <th className="w-8 px-1 py-1.5" />
                        {TRIP_PLAN_COLUMNS.map((c) => (
                          <th
                            key={c.key}
                            className="px-1.5 py-1.5 font-semibold"
                            style={{ minWidth: `${COL_WIDTH[c.key] ?? 120}px` }}
                          >
                            {c.label}
                          </th>
                        ))}
                        <th className="w-9" />
                      </tr>
                    </thead>
                    <tbody>
                      {day.items.map((it) => (
                        <tr key={it.id} className="align-top">
                          <td className="px-1 pt-1 text-[var(--color-muted-foreground)]">
                            <GripVertical className="w-3.5 h-3.5 mt-1.5 opacity-40" />
                          </td>
                          {TRIP_PLAN_COLUMNS.map((c) => (
                            <td key={c.key} className="px-0.5 py-0.5">
                              {c.key === "link" ? (
                                <div className="flex items-center gap-1">
                                  <input
                                    value={it.link}
                                    onChange={(e) =>
                                      updateItem(day.id, it.id, {
                                        link: e.target.value,
                                      })
                                    }
                                    placeholder="https://…"
                                    inputMode="url"
                                    className={cellCls}
                                  />
                                  {it.link.trim() && (
                                    <a
                                      href={it.link}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-[var(--color-primary)] shrink-0"
                                      aria-label="Link megnyitása"
                                    >
                                      <ExternalLink className="w-3.5 h-3.5" />
                                    </a>
                                  )}
                                </div>
                              ) : (
                                <input
                                  value={it[c.key]}
                                  onChange={(e) =>
                                    updateItem(day.id, it.id, {
                                      [c.key]: e.target.value,
                                    })
                                  }
                                  className={cellCls}
                                />
                              )}
                            </td>
                          ))}
                          <td className="px-0.5 pt-1">
                            <button
                              type="button"
                              onClick={() => removeItem(day.id, it.id)}
                              className="h-8 w-7 flex items-center justify-center rounded-lg text-[var(--color-muted-foreground)] hover:text-red-600"
                              aria-label="Sor törlése"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {!isCollapsed && (
                <div className="p-2 border-t border-[var(--color-border)]">
                  <button
                    type="button"
                    onClick={() => addItem(day.id)}
                    className="inline-flex items-center gap-1.5 px-2 py-1 text-[13px] font-medium text-[var(--color-primary)] hover:brightness-110"
                  >
                    <Plus className="w-4 h-4" /> Sor
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <button
        type="button"
        onClick={addDay}
        className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-[var(--color-primary)] hover:brightness-110"
      >
        <Plus className="w-4 h-4" /> Új nap
      </button>

      {/* Mentés-sáv */}
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-[var(--color-border)] bg-[var(--color-background)]/95 backdrop-blur-md md:pl-64">
        <div className="max-w-md md:max-w-5xl mx-auto px-5 py-3 flex items-center justify-between gap-3">
          <div className="text-sm text-[var(--color-muted-foreground)]">
            {days.length} nap ·{" "}
            {days.reduce((n, d) => n + d.items.length, 0)} programpont
          </div>
          <button
            type="button"
            onClick={save}
            disabled={pending || !dirty}
            className="h-11 px-5 rounded-xl bg-[var(--color-primary)] text-white font-medium inline-flex items-center justify-center gap-2 hover:brightness-110 disabled:opacity-40 transition"
          >
            {pending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : saved && !dirty ? (
              <Check className="w-4 h-4" />
            ) : null}
            {pending ? "Mentés…" : saved && !dirty ? "Mentve" : "Mentés"}
          </button>
        </div>
      </div>
    </div>
  );
}

function LabeledMini({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex flex-col">
      <span className="text-[9px] uppercase tracking-wider text-[var(--color-muted-foreground)] pl-1.5">
        {label}
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="—"
        className={cn(cellCls, "tabular-nums")}
      />
    </label>
  );
}
