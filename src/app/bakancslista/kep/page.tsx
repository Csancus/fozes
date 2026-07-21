import { requireUser } from "@/lib/auth";
import { PageHeader } from "@/components/ui/PageHeader";
import {
  listHouseholdMembers,
  hasSurprisePassword,
  ensureDefaultSavedTypes,
} from "@/lib/data";
import { OcrImport } from "./OcrImport";
import { saveSavedAction } from "../actions";

export default async function OcrImportPage() {
  const me = await requireUser();
  const [members, hasSurprisePw, types] = await Promise.all([
    listHouseholdMembers(me.householdId),
    hasSurprisePassword(me.householdId),
    ensureDefaultSavedTypes(me.householdId),
  ]);
  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Kép a listára"
        subtitle="Képernyőképből kiolvasott elem"
        back="/bakancslista"
      />
      <OcrImport
        action={saveSavedAction}
        types={types}
        members={members}
        myId={me.userId}
        hasSurprisePw={hasSurprisePw}
      />
    </main>
  );
}
