import { requireUser } from "@/lib/auth";
import { getTrip } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { TripPlanner } from "./TripPlanner";
import { saveTripDaysAction } from "../../actions";

export default async function TripPlanPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const trip = await getTrip(me.householdId, id);
  if (!trip) notFound();

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-none mx-auto">
      <PageHeader
        title="Terv"
        subtitle={trip.name}
        back={`/utazasok/${id}`}
      />
      <TripPlanner
        tripId={trip.id}
        initialDays={trip.days}
        action={saveTripDaysAction}
      />
    </main>
  );
}
