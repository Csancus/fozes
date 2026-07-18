import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SavedForm } from "../SavedForm";
import { saveSavedAction } from "../actions";

export default async function NewSavedPage() {
  await requireUser();
  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Új mentés" back="/bakancslista" />
      <Card className="mt-6 p-5">
        <SavedForm action={saveSavedAction} />
      </Card>
    </main>
  );
}
