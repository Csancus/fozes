import { requireUser } from "@/lib/auth";
import { listSavedItems } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { Button } from "@/components/ui/Button";
import { Bookmark, Plus, Table2 } from "lucide-react";
import Link from "next/link";
import { SavedListClient } from "./SavedListClient";

export default async function BakancslistaPage() {
  const me = await requireUser();
  const items = await listSavedItems(me.householdId);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title="Bakancslista"
        subtitle="Amit egyszer meg akarsz csinálni"
        back="/"
        action={
          <div className="flex items-center gap-2">
            <Link
              href="/bakancslista/gyors"
              aria-label="Táblázatos felvitel"
              className="w-9 h-9 rounded-xl flex items-center justify-center text-[var(--color-muted-foreground)] hover:bg-[var(--color-muted)] hover:text-[var(--color-foreground)] transition"
            >
              <Table2 className="w-5 h-5" />
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

      {items.length === 0 ? (
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
          <p className="mt-4 text-center text-sm text-[var(--color-muted-foreground)]">
            vagy{" "}
            <Link
              href="/bakancslista/gyors"
              className="text-[var(--color-primary)] font-medium"
            >
              vigyél fel többet egyszerre táblázatban
            </Link>
          </p>
        </div>
      ) : (
        <SavedListClient items={items} />
      )}
    </main>
  );
}
