import { requireUser } from "@/lib/auth";
import { getNote, listHouseholdMembers, hasSurprisePassword } from "@/lib/data";
import { getSession } from "@/lib/session";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { SurpriseUnlock } from "@/components/ui/SurpriseUnlock";
import { ConfirmDeleteButton } from "@/components/ui/ConfirmDeleteButton";
import { NoteForm } from "../NoteForm";
import { saveNoteAction, deleteNoteAction, unlockSurpriseAction } from "../actions";
import { reminderLabel } from "../reminder-format";
import { Bell } from "lucide-react";

export default async function JegyzetPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const me = await requireUser();
  const note = await getNote(me.householdId, id);
  if (!note) notFound();

  // Meglepetés: az érintett tag csak feloldás után látja a tartalmat.
  const session = await getSession();
  if (note.surpriseFor === me.userId && !session.surpriseUnlocked) {
    const hasPw = await hasSurprisePassword(me.householdId);
    return (
      <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
        <PageHeader title="Meglepetés" back="/jegyzetek" />
        <SurpriseUnlock hasSurprisePw={hasPw} unlockAction={unlockSurpriseAction} />
      </main>
    );
  }

  const [members, hasSurprisePw] = await Promise.all([
    listHouseholdMembers(me.householdId),
    hasSurprisePassword(me.householdId),
  ]);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title={note.title || "Jegyzet"}
        subtitle={
          note.reminderAt && !note.reminderDone
            ? undefined
            : "Szerkesztés és mentés"
        }
        back="/jegyzetek"
      />

      {note.reminderAt !== null && !note.reminderDone && (
        <p className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-[var(--color-primary-soft)] px-3 py-1 text-xs font-medium text-[var(--color-primary)]">
          <Bell className="w-3.5 h-3.5" />
          Emlékeztető: {reminderLabel(note.reminderAt)}
        </p>
      )}

      <div className="mt-5">
        <NoteForm
          action={saveNoteAction}
          initial={note}
          members={members}
          otherMembers={members.filter((m) => m.id !== me.userId)}
          hasSurprisePw={hasSurprisePw}
          myId={me.userId}
        />
      </div>

      <div className="mt-4">
        <ConfirmDeleteButton
          id={note.id}
          title={note.title || "Jegyzet"}
          deleteAction={deleteNoteAction}
        />
      </div>
    </main>
  );
}
