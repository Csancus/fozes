import { requireUser } from "@/lib/auth";
import { listTrips } from "@/lib/data";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Plane, Plus, MapPin, CalendarDays, ListChecks } from "lucide-react";

export default async function UtazasokPage() {
  const me = await requireUser();
  const trips = await listTrips(me.householdId);

  // Évenkénti csoportosítás (csökkenő).
  const byYear = new Map<number, typeof trips>();
  for (const t of trips) {
    const arr = byYear.get(t.year) ?? [];
    arr.push(t);
    byYear.set(t.year, arr);
  }
  const years = [...byYear.keys()].sort((a, b) => b - a);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Utazások"
        subtitle="Tervezd meg az utakat évről évre"
        back="/"
        action={
          <Button
            href="/utazasok/uj"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Új
          </Button>
        }
      />

      {trips.length === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Plane}
            title="Még nincs utazás"
            description="Hozz létre egy utazást (pl. Ausztria 2026), majd tervezd meg napról napra a részletes útitervben."
            action={
              <Button href="/utazasok/uj" leftIcon={<Plus className="w-4 h-4" />}>
                Első utazás
              </Button>
            }
          />
        </div>
      ) : (
        <div className="mt-6 space-y-8">
          {years.map((year) => (
            <section key={year}>
              <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-[var(--color-muted-foreground)]">
                <span className="tabular-nums text-[var(--color-foreground)]">
                  {year}
                </span>
                <span className="h-px flex-1 bg-[var(--color-border)]" />
              </h2>
              <div className="grid gap-3 sm:grid-cols-2">
                {(byYear.get(year) ?? []).map((t) => (
                  <TripCard key={t.id} trip={t} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

function TripCard({
  trip,
}: {
  trip: {
    id: string;
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    days: unknown[];
  };
}) {
  const dateRange = [trip.startDate, trip.endDate].filter(Boolean).join(" – ");
  return (
    <Link
      href={`/utazasok/${trip.id}`}
      className="group flex flex-col rounded-2xl border border-[var(--color-border)] bg-[var(--color-card)] shadow-sm overflow-hidden transition hover:border-[var(--color-primary)]/40 hover:shadow-md active:scale-[0.99]"
    >
      <div className="h-24 bg-[var(--color-primary-soft)] flex items-center justify-center">
        <Plane className="w-8 h-8 text-[var(--color-primary)]" />
      </div>
      <div className="p-4">
        <p className="font-semibold text-[15px] leading-tight">{trip.name}</p>
        {trip.destination && (
          <p className="mt-1 text-xs text-[var(--color-muted-foreground)] flex items-center gap-1 truncate">
            <MapPin className="w-3 h-3 shrink-0" /> {trip.destination}
          </p>
        )}
        <div className="mt-2 flex items-center gap-3 text-[11px] text-[var(--color-muted-foreground)]">
          {dateRange && (
            <span className="inline-flex items-center gap-1">
              <CalendarDays className="w-3 h-3" /> {dateRange}
            </span>
          )}
          <span className="inline-flex items-center gap-1">
            <ListChecks className="w-3 h-3" /> {trip.days.length} nap
          </span>
        </div>
      </div>
    </Link>
  );
}
