import { requireUser } from "@/lib/auth";
import { getTrip, listTaskLists, listTasks } from "@/lib/data";
import { cn } from "@/lib/cn";
import { catColor } from "@/lib/expense-visuals";
import { plainToRichText, sanitizeRichText } from "@/lib/richtext";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import {
  Pencil,
  MapPin,
  CalendarDays,
  ListChecks,
  Map as MapIcon,
  ChevronRight,
  Route,
  StickyNote,
  ListTodo,
  Plus,
} from "lucide-react";

export default async function TripDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const trip = await getTrip(me.householdId, id);
  if (!trip) notFound();

  const [allLists, allTasks] = await Promise.all([
    listTaskLists(me.householdId),
    listTasks(me.householdId),
  ]);
  const tripLists = allLists
    .filter((l) => l.tripId === id)
    .map((l) => {
      const own = allTasks.filter((t) => t.listId === l.id);
      const doneCount = own.filter((t) => t.done).length;
      return {
        list: l,
        total: own.length,
        done: doneCount,
        pct: own.length ? Math.round((doneCount / own.length) * 100) : 0,
      };
    });

  const dateRange = [trip.startDate, trip.endDate].filter(Boolean).join(" – ");
  const stopCount = trip.days.reduce((n, d) => n + d.items.length, 0);
  // A régi sima jegyzet is itt jelenik meg, amíg valaki át nem menti.
  const noteHtml = sanitizeRichText(
    trip.planNote || plainToRichText(trip.note)
  );

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader
        title={trip.name}
        subtitle={`${trip.year}`}
        back="/utazasok"
        action={
          <Link
            href={`/utazasok/${id}/szerkesztes`}
            aria-label="Szerkesztés"
            className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
          >
            <Pencil className="w-4.5 h-4.5" />
          </Link>
        }
      />

      {/* Fejléc-kártya */}
      <div className="mt-5 rounded-2xl border border-[var(--color-border)] overflow-hidden">
        <div className="h-28 bg-[var(--color-primary-soft)] flex items-center justify-center">
          <Route className="w-10 h-10 text-[var(--color-primary)]" />
        </div>
        <div className="p-4 space-y-1.5">
          {trip.destination && (
            <p className="text-sm text-[var(--color-foreground)] flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[var(--color-muted-foreground)]" />
              {trip.destination}
            </p>
          )}
          {dateRange && (
            <p className="text-sm text-[var(--color-muted-foreground)] flex items-center gap-1.5">
              <CalendarDays className="w-4 h-4" /> {dateRange}
            </p>
          )}
        </div>
      </div>

      {/* Statok */}
      <div className="mt-4 grid grid-cols-2 gap-3">
        <Stat icon={CalendarDays} label="Nap" value={trip.days.length} />
        <Stat icon={ListChecks} label="Programpont" value={stopCount} />
      </div>

      {/* Terv belépő */}
      <h2 className="mt-8 mb-2 text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] px-1">
        Menü
      </h2>
      <Link
        href={`/utazasok/${id}/terv`}
        className="flex items-center gap-3 rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 hover:border-[var(--color-primary)]/40 hover:shadow-md transition active:scale-[0.99]"
      >
        <div className="w-11 h-11 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
          <MapIcon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="font-semibold">Terv</p>
          <p className="text-xs text-[var(--color-muted-foreground)]">
            Részletes útiterv napról napra — időzítés, szállás, felszerelés
          </p>
        </div>
        <ChevronRight className="w-5 h-5 text-[var(--color-muted-foreground)] shrink-0" />
      </Link>

      {/* Teendő-listák (csomagolás, intéznivalók…) */}
      <div className="mt-8 mb-2 flex items-center justify-between px-1">
        <h2 className="text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em]">
          Teendő-listák
        </h2>
        <Link
          href={`/teendok/listak/uj?utazas=${id}`}
          className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--color-primary)]"
        >
          <Plus className="w-4 h-4" /> Új lista
        </Link>
      </div>
      {tripLists.length === 0 ? (
        <Link
          href={`/teendok/listak/uj?utazas=${id}`}
          className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-[var(--color-border)] bg-[var(--color-muted)]/20 p-4 transition hover:border-[var(--color-primary)]/50"
        >
          <div className="w-10 h-10 rounded-xl bg-[var(--color-primary-soft)] text-[var(--color-primary)] flex items-center justify-center shrink-0">
            <ListTodo className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold">Lista az utazáshoz</p>
            <p className="text-xs text-[var(--color-muted-foreground)]">
              pl. Csomagolás, Intéznivalók indulás előtt
            </p>
          </div>
          <ChevronRight className="w-5 h-5 text-[var(--color-muted-foreground)] shrink-0" />
        </Link>
      ) : (
        <div className="grid gap-2.5 md:grid-cols-2">
          {tripLists.map(({ list, total, done, pct }) => {
            const col = catColor(list.color);
            return (
              <Link
                key={list.id}
                href={`/teendok/listak/${list.id}`}
                className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-3.5 shadow-sm transition hover:border-[var(--color-primary)]/40 hover:shadow-md active:scale-[0.99]"
              >
                <div className="flex items-center gap-2.5">
                  <span className={cn("w-2.5 h-2.5 rounded-full shrink-0", col.dot)} />
                  <p className="flex-1 min-w-0 font-semibold text-[15px] truncate">
                    {list.name}
                  </p>
                  <span className="text-[11px] text-[var(--color-muted-foreground)] tabular-nums">
                    {done}/{total}
                  </span>
                </div>
                <div className="mt-2.5 h-1.5 rounded-full bg-[var(--color-muted)] overflow-hidden">
                  <div className={cn("h-full rounded-full", col.dot)} style={{ width: `${pct}%` }} />
                </div>
              </Link>
            );
          })}
        </div>
      )}

      {noteHtml && (
        <>
          <h2 className="mt-8 mb-2 flex items-center gap-1.5 text-[11px] font-semibold text-[var(--color-muted-foreground)] uppercase tracking-[0.08em] px-1">
            <StickyNote className="w-3.5 h-3.5" /> Jegyzet
          </h2>
          <div
            className="rich-text rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4 text-[15px] leading-relaxed"
            dangerouslySetInnerHTML={{ __html: noteHtml }}
          />
        </>
      )}

      <div className="mt-8">
        <Button href={`/utazasok/${id}/terv`} size="lg" fullWidth leftIcon={<MapIcon className="w-4 h-4" />}>
          Terv megnyitása
        </Button>
      </div>
    </main>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] p-4">
      <div className="flex items-center gap-2 text-[var(--color-muted-foreground)]">
        <Icon className="w-4 h-4" />
        <span className="text-xs font-medium">{label}</span>
      </div>
      <p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>
    </div>
  );
}
