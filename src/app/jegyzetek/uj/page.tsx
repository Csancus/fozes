import { requireUser } from "@/lib/auth";
import { listHouseholdMembers, hasSurprisePassword } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { NoteForm } from "../NoteForm";
import { saveNoteAction } from "../actions";

export default async function UjJegyzetPage() {
  const me = await requireUser();
  const [members, hasSurprisePw] = await Promise.all([
    listHouseholdMembers(me.householdId),
    hasSurprisePassword(me.householdId),
  ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Új jegyzet" back="/jegyzetek" />
      <div className="mt-5">
        <NoteForm
          action={saveNoteAction}
          members={members}
          otherMembers={members.filter((m) => m.id !== me.userId)}
          hasSurprisePw={hasSurprisePw}
          myId={me.userId}
        />
      </div>
    </main>
  );
}
