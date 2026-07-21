import { requireUser } from "@/lib/auth";
import Link from "next/link";
import { Table2, ScanText } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { SavedForm } from "../SavedForm";
import { saveSavedAction } from "../actions";

export default async function NewSavedPage() {
  await requireUser();
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
        <SavedForm action={saveSavedAction} />
      </Card>
    </main>
  );
}
