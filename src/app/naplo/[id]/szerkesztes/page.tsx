import { requireUser } from "@/lib/auth";
import { getJournalEntry } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { JournalForm } from "../../JournalForm";
import { updateJournalAction } from "../../actions";

export default async function EditJournalPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const entry = await getJournalEntry(me.householdId, id);
  if (!entry) notFound();

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Bejegyzés szerkesztése" back={`/naplo/${id}`} />
      <Card className="mt-6 p-5">
        <JournalForm action={updateJournalAction} initial={entry} />
      </Card>
    </main>
  );
}
