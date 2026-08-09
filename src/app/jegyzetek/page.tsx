import { requireUser } from "@/lib/auth";
import {
  listNotes,
  listHouseholdMembers,
  hasSurprisePassword,
} from "@/lib/data";
import { getSession } from "@/lib/session";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { StickyNote, Plus } from "lucide-react";
import { NotesListClient, type NoteEntry } from "./NotesListClient";
import { reminderLabel } from "./reminder-format";

export default async function JegyzetekPage() {
  const me = await requireUser();
  const [notes, members, hasSurprisePw, session] = await Promise.all([
    listNotes(me.householdId),
    listHouseholdMembers(me.householdId),
    hasSurprisePassword(me.householdId),
    getSession(),
  ]);
  const unlocked = !!session.surpriseUnlocked;
  const now = Date.now();

  const nameOf = (id: string) =>
    members.find((m) => m.id === id)?.name ?? "valaki";

  const lockedCount = unlocked
    ? 0
    : notes.filter((n) => n.surpriseFor === me.userId).length;

  const visible: NoteEntry[] = notes
    .filter((n) => !(n.surpriseFor === me.userId && !unlocked))
    .map((n) => ({
      ...n,
      ownerName: n.ownerId ? nameOf(n.ownerId) : null,
      surpriseForName:
        n.surpriseFor && n.surpriseFor !== me.userId
          ? nameOf(n.surpriseFor)
          : null,
      reminderLabel: n.reminderAt ? reminderLabel(n.reminderAt, now) : null,
      reminderDue:
        n.reminderAt !== null && !n.reminderDone && n.reminderAt <= now,
    }));

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-5xl mx-auto">
      <PageHeader
        title="Jegyzetek"
        subtitle="Listák, feljegyzések, emlékeztetők"
        back="/"
        action={
          <Button
            href="/jegyzetek/uj"
            size="sm"
            leftIcon={<Plus className="w-4 h-4" />}
          >
            Új
          </Button>
        }
      />

      {notes.length === 0 && lockedCount === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={StickyNote}
            title="Nincs még jegyzet"
            description="Írj bármit — bevásárlólistát pipálható sorokkal, ötleteket, teendőket. Emlékeztetőt is állíthatsz hozzá, és el is rejtheted valaki elől."
            action={
              <Button href="/jegyzetek/uj" leftIcon={<Plus className="w-4 h-4" />}>
                Első jegyzet
              </Button>
            }
          />
        </div>
      ) : (
        <NotesListClient
          notes={visible}
          allMembers={members}
          myId={me.userId}
          lockedCount={lockedCount}
          hasSurprisePw={hasSurprisePw}
        />
      )}
    </main>
  );
}
