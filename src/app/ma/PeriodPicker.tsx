"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/cn";
import {
  addDays,
  fromStr,
  makePeriod,
  monthGrid,
  periodHref,
  toStr,
  type PeriodKind,
} from "@/lib/period";

const MONTHS = [
  "Január", "Február", "Március", "Április", "Május", "Június",
  "Július", "Augusztus", "Szeptember", "Október", "November", "December",
];
const DOW = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];
const KINDS: { key: PeriodKind; label: string }[] = [
  { key: "day", label: "Nap" },
  { key: "week", label: "Hét" },
  { key: "month", label: "Hónap" },
];

// Story 9.1 – időszak-választó: Nap / Hét / Hónap, léptetés és naptár.
export function PeriodPicker({
  kind,
  start,
  end,
  today,
  prevHref,
  nextHref,
  isCurrent,
  counts,
}: {
  kind: PeriodKind;
  start: string;
  end: string;
  today: string;
  prevHref: string;
  nextHref: string;
  isCurrent: boolean;
  /** nyitott teendők száma határidő-naponként (naptár-pöttyökhöz) */
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [shown, setShown] = useState(start.slice(0, 8) + "01");

  const go = (k: PeriodKind, date: string) => {
    const p = makePeriod(k, date, today);
    router.push(periodHref(p, today));
  };

  const shownDate = fromStr(shown);
  const shiftShown = (dir: number) =>
    setShown(toStr(new Date(shownDate.getFullYear(), shownDate.getMonth() + dir, 1)));
  const days = monthGrid(shown);
  const todayHref = periodHref(makePeriod(kind, today, today), today);

  return (
    <div className="mt-4 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <div
          className="grid grid-cols-3 gap-0.5 p-0.5 rounded-xl bg-[var(--color-muted)]"
          role="radiogroup"
          aria-label="Nézet"
          data-segmented
        >
          {KINDS.map((k) => (
            <button
              key={k.key}
              type="button"
              role="radio"
              aria-checked={kind === k.key}
              onClick={() => go(k.key, kind === "day" ? start : isCurrent ? today : start)}
              className={cn(
                "h-8 px-3 rounded-[10px] text-xs font-medium transition",
                kind === k.key
                  ? "bg-[var(--color-card)] text-[var(--color-foreground)] shadow-sm"
                  : "text-[var(--color-muted-foreground)] hover:text-[var(--color-foreground)]"
              )}
            >
              {k.label}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <Link
            href={prevHref}
            aria-label="Előző időszak"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <ChevronLeft className="w-4.5 h-4.5" />
          </Link>
          {!isCurrent && (
            <Link
              href={todayHref}
              className="h-8 px-3 rounded-lg flex items-center text-xs font-semibold text-[var(--color-primary)] hover:bg-[var(--color-muted)] transition"
            >
              {kind === "day" ? "Ma" : kind === "week" ? "Ez a hét" : "Ez a hónap"}
            </Link>
          )}
          <Link
            href={nextHref}
            aria-label="Következő időszak"
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <ChevronRight className="w-4.5 h-4.5" />
          </Link>
          <button
            type="button"
            onClick={() => {
              setShown(start.slice(0, 8) + "01");
              setOpen((o) => !o);
            }}
            aria-expanded={open}
            aria-label="Naptár"
            title="Naptár"
            className={cn(
              "w-8 h-8 rounded-lg flex items-center justify-center transition",
              open
                ? "bg-[var(--color-primary)] text-white"
                : "text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)]"
            )}
          >
            <CalendarDays className="w-4.5 h-4.5" />
          </button>
        </div>
      </div>

      {open && (
        <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3 shadow-sm md:max-w-sm md:ml-auto">
          <div className="mb-2 flex items-center justify-between">
            <button
              type="button"
              onClick={() => shiftShown(-1)}
              aria-label="Előző hónap"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                go("month", shown);
              }}
              className="text-sm font-semibold hover:text-[var(--color-primary)]"
              title="Az egész hónap"
            >
              {shownDate.getFullYear()}. {MONTHS[shownDate.getMonth()]}
            </button>
            <button
              type="button"
              onClick={() => shiftShown(1)}
              aria-label="Következő hónap"
              className="w-8 h-8 rounded-lg flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)]"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {DOW.map((d) => (
              <span
                key={d}
                className="py-1 text-[10px] font-semibold uppercase text-[var(--color-muted-foreground)]"
              >
                {d}
              </span>
            ))}
            {days.map((d) => {
              const inMonth = d.slice(0, 7) === shown.slice(0, 7);
              const selected = d >= start && d <= end;
              const isToday = d === today;
              const n = counts[d] ?? 0;
              return (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    setOpen(false);
                    go(kind, d);
                  }}
                  className={cn(
                    "relative h-9 rounded-lg text-sm tabular-nums transition",
                    selected
                      ? "bg-[var(--color-primary)] text-white font-semibold"
                      : "hover:bg-[var(--color-muted)]",
                    !selected && !inMonth && "text-[var(--color-muted-foreground)] opacity-50",
                    !selected && isToday && "text-[var(--color-primary)] font-bold ring-1 ring-[var(--color-primary)]/50"
                  )}
                  aria-label={`${d}${n ? `, ${n} teendő` : ""}`}
                >
                  {fromStr(d).getDate()}
                  {n > 0 && (
                    <span
                      className={cn(
                        "absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full",
                        selected ? "bg-white" : d < today ? "bg-red-500" : "bg-[var(--color-primary)]"
                      )}
                    />
                  )}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-center text-[11px] text-[var(--color-muted-foreground)]">
            {kind === "day"
              ? "Válassz egy napot."
              : kind === "week"
                ? "Kattints egy napra – az egész hetét mutatom."
                : "Kattints egy napra vagy a hónap nevére."}
          </p>
          <div className="mt-2 flex justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                go("day", today);
              }}
              className="h-7 px-3 rounded-full border border-[var(--color-border)] text-[11px] font-medium hover:bg-[var(--color-muted)]"
            >
              Ma
            </button>
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                go("day", addDays(today, 1));
              }}
              className="h-7 px-3 rounded-full border border-[var(--color-border)] text-[11px] font-medium hover:bg-[var(--color-muted)]"
            >
              Holnap
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
