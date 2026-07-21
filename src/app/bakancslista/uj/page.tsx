import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { Table2, ScanText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { listHouseholdMembers, hasSurprisePassword } from "@/lib/data";
import { SavedForm } from "../SavedForm";
import { saveSavedAction } from "../actions";

export default async function NewSavedPage() {
  const me = await requireUser();
  const [members, hasSurprisePw] = await Promise.all([
    listHouseholdMembers(me.householdId),
    hasSurprisePassword(me.householdId),
  ]);
  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Új mentés"
        back="/bakancslista"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/bakancslista/kep"
              aria-label="Kép a listára"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
            >
              <ScanText className="w-5 h-5" />
            </Link>
            <Link
              href="/bakancslista/gyors"
              aria-label="Táblázatos felvitel"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
            >
              <Table2 className="w-5 h-5" />
            </Link>
          </div>
        }
      />
      <Card className="mt-6 p-5">
        <SavedForm
          action={saveSavedAction}
          members={members}
          myId={me.userId}
          hasSurprisePw={hasSurprisePw}
        />
      </Card>
    </main>
  );
}
