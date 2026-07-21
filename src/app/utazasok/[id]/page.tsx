import { requireUser } from "@/lib/auth";
import { getTrip } from "@/lib/data";
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

  const dateRange = [trip.startDate, trip.endDate].filter(Boolean).join(" – ");
  const stopCount = trip.days.reduce((n, d) => n + d.items.length, 0);

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
          {trip.note && (
            <p className="pt-1 text-[15px] whitespace-pre-wrap leading-relaxed">
              {trip.note}
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
