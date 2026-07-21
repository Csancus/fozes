import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import { OcrImport } from "./OcrImport";
import { saveSavedAction } from "../actions";

export default async function OcrImportPage() {
  await requireUser();
  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Kép a listára"
        subtitle="Képernyőképből kiolvasott elem"
        back="/bakancslista"
      />
      <OcrImport action={saveSavedAction} />
    </main>
  );
}
