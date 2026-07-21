import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Input, Textarea, Field } from "@/components/ui/Input";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { Plane } from "lucide-react";
import { createTripAction } from "../actions";

export default async function NewTripPage() {
  await requireUser();
  const year = new Date().getFullYear();
  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Új utazás" back="/utazasok" />
      <Card className="mt-6 p-5">
        <form action={createTripAction} className="space-y-5">
          <Field label="Név" required>
            <Input name="name" required placeholder="pl. Ausztria 2026" autoFocus />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Év" required>
              <Input
                name="year"
                type="number"
                inputMode="numeric"
                defaultValue={year}
                required
              />
            </Field>
            <Field label="Úti cél" hint="opcionális">
              <Input name="destination" placeholder="pl. Alpok, Ausztria" />
            </Field>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Mettől" hint="opcionális">
              <Input name="startDate" placeholder="pl. ápr. 30." />
            </Field>
            <Field label="Meddig" hint="opcionális">
              <Input name="endDate" placeholder="pl. máj. 5." />
            </Field>
          </div>
          <Field label="Jegyzet">
            <Textarea name="note" placeholder="Bármi, amit érdemes tudni az útról" />
          </Field>
          <SubmitButton size="lg" fullWidth leftIcon={<Plane className="w-4 h-4" />}>
            Utazás létrehozása
          </SubmitButton>
        </form>
      </Card>
    </main>
  );
}
