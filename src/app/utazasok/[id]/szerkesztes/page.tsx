import { requireUser } from "@/lib/auth";
import { getTrip } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Button } from "@/components/ui/Button";
import { Trash2 } from "lucide-react";
import { updateTripAction, deleteTripAction } from "../../actions";

export default async function EditTripPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const trip = await getTrip(me.householdId, id);
  if (!trip) notFound();

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Utazás szerkesztése" back={`/utazasok/${id}`} />
      <Card className="mt-6 p-5">
        <form action={updateTripAction} className="space-y-5">
          <input type="hidden" name="id" value={trip.id} />
          <Field label="Név" required>
            <Input name="name" required defaultValue={trip.name} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Év" required>
              <Input
                name="year"
                type="number"
                inputMode="numeric"
                defaultValue={trip.year}
                required
              />
            </Field>
            <Field label="Úti cél">
              <Input name="destination" defaultValue={trip.destination} />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mettől">
              <Input name="startDate" defaultValue={trip.startDate} />
            </Field>
            <Field label="Meddig">
              <Input name="endDate" defaultValue={trip.endDate} />
            </Field>
          </div>
          <Field label="Jegyzet">
            <Textarea name="note" defaultValue={trip.note} />
          </Field>
          <SubmitButton size="lg" fullWidth>
            Mentés
          </SubmitButton>
        </form>
      </Card>

      <form action={deleteTripAction} className="mt-6">
        <input type="hidden" name="id" value={trip.id} />
        <Button
          type="submit"
          variant="ghost"
          fullWidth
          className="text-red-600 hover:text-red-700"
          leftIcon={<Trash2 className="w-4 h-4" />}
        >
          Utazás törlése
        </Button>
      </form>
    </main>
  );
}
