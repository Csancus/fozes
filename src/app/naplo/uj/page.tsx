import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { JournalForm } from "../JournalForm";
import { createJournalAction } from "../actions";

export default async function NewJournalPage() {
  await requireUser();
  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Új napló-bejegyzés" back="/naplo" />
      <Card className="mt-6 p-5">
        <JournalForm action={createJournalAction} />
      </Card>
    </main>
  );
}
