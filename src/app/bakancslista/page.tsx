import { requireUser } from "@/lib/auth";
import {
  listSavedItems,
  listHouseholdMembers,
  hasSurprisePassword,
  ensureDefaultSavedTypes,
} from "@/lib/data";
import { getSession } from "@/lib/session";
import Link from "next/link";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Bookmark, Plus, Table2, ScanText, SlidersHorizontal } from "lucide-react";
import { SavedListClient } from "./SavedListClient";
import {
  setSurpriseBatchAction,
  unlockSurpriseAction,
} from "./actions";

export default async function BakancslistaPage() {
  const me = await requireUser();
  const [items, members, hasSurprisePw, types, session] = await Promise.all([
    listSavedItems(me.householdId),
    listHouseholdMembers(me.householdId),
    hasSurprisePassword(me.householdId),
    ensureDefaultSavedTypes(me.householdId),
    getSession(),
  ]);
  const unlocked = !!session.surpriseUnlocked;

  const nameOf = (id: string) =>
    members.find((m) => m.id === id)?.name ?? "valaki";

  // Nekem szánt meglepetések: feloldásig rejtve.
  const lockedForMe = unlocked
    ? []
    : items.filter((i) => i.surpriseFor === me.userId);
  const lockedCount = lockedForMe.length;

  // A látható tételek + jelölés, ha én rejtettem el valaki elől.
  const visible = items
    .filter((i) => !(i.surpriseFor === me.userId && !unlocked))
    .map((i) => ({
      ...i,
      surpriseForName:
        i.surpriseFor && i.surpriseFor !== me.userId
          ? nameOf(i.surpriseFor)
          : null,
      // A saját tételeimen nem mutatunk nevet — csak a másokén.
      ownerName:
        i.ownerId && i.ownerId !== me.userId ? nameOf(i.ownerId) : null,
    }));

  const otherMembers = members.filter((m) => m.id !== me.userId);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Bakancslista"
        subtitle="Amit egyszer meg akarsz csinálni"
        back="/"
        action={
          <div className="flex items-center gap-1">
            <Link
              href="/bakancslista/beallitasok"
              aria-label="Beállítások"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
            >
              <SlidersHorizontal className="w-5 h-5" />
            </Link>
            <Button
              href="/bakancslista/uj"
              size="sm"
              leftIcon={<Plus className="w-4 h-4" />}
            >
              Új
            </Button>
          </div>
        }
      />

      <Button
        href="/bakancslista/gyors"
        size="lg"
        variant="secondary"
        fullWidth
        className="mt-3"
        leftIcon={<Table2 className="w-4 h-4" />}
      >
        Gyors táblázat (több elem)
      </Button>

      <Button
        href="/bakancslista/kep"
        size="lg"
        variant="secondary"
        fullWidth
        className="mt-3"
        leftIcon={<ScanText className="w-4 h-4" />}
      >
        Kép alapján
      </Button>

      <Link
        href="/bakancslista/beallitasok"
        className="mt-3 flex items-center justify-between rounded-xl border border-dashed border-[var(--color-border)] px-4 h-11 text-sm font-medium text-[var(--color-muted-foreground)] hover:border-[var(--color-primary)]/40 hover:text-[var(--color-foreground)] transition"
      >
        <span className="flex items-center gap-2">
          <SlidersHorizontal className="w-4 h-4" />
          Típusok kezelése
        </span>
        <span className="text-[var(--color-primary)]">Beállítások</span>
      </Link>

      {visible.length === 0 && lockedCount === 0 ? (
        <div className="mt-6">
          <EmptyState
            icon={Bookmark}
            title="Üres a lista"
            description="Éttermek, utazások, könyvek, cikkek, videók — mentsd el őket egy helyre, képekkel, linkekkel, fájlokkal."
            action={
              <Button href="/bakancslista/uj" leftIcon={<Plus className="w-4 h-4" />}>
                Első mentés
              </Button>
            }
          />
        </div>
      ) : (
        <SavedListClient
          items={visible}
          types={types}
          lockedCount={lockedCount}
          hasSurprisePw={hasSurprisePw}
          members={otherMembers}
          allMembers={members}
          myId={me.userId}
          unlockAction={unlockSurpriseAction}
          setSurpriseBatchAction={setSurpriseBatchAction}
        />
      )}
    </main>
  );
}
