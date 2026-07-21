import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { SavedBatchEntry } from "./SavedBatchEntry";
import { saveSavedBatchAction } from "../actions";

export default async function SavedBatchPage() {
  await requireUser();
  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Gyors felvitel"
        subtitle="Több tétel egyszerre, táblázatban"
        back="/bakancslista"
      />
      <SavedBatchEntry action={saveSavedBatchAction} />
    </main>
  );
}
