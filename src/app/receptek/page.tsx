import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import Link from "next/link";
import { Archive, ChefHat, ChevronLeft, Plus } from "lucide-react";
import { RecipeListClient } from "./RecipeListClient";

export default async function ReceptekPage({
  searchParams,
}: {
  searchParams: Promise<{ archive?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const archiveMode = sp.archive === "1";

  const all = await listRecipes(me.householdId, {
    includeArchived: archiveMode,
  });
  const recipes = archiveMode
    ? all.filter((r) => (r.archivedAt ?? null) != null)
    : all;

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-4xl mx-auto">
      <PageHeader
        title={archiveMode ? "Archívum" : "Receptek"}
        back="/fozes"
        action={
          archiveMode ? (
            <Button
              href="/receptek"
              size="sm"
              variant="secondary"
              leftIcon={<ChevronLeft className="w-4 h-4" />}
            >
              Aktívak
            </Button>
          ) : (
            <div className="flex items-center gap-2">
              <Button
                href="/receptek?archive=1"
                size="sm"
                variant="secondary"
                leftIcon={<Archive className="w-4 h-4" />}
              >
                Archívum
              </Button>
              <Button
                href="/receptek/uj"
                size="sm"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Új recept
              </Button>
            </div>
          )
        }
      />

      {archiveMode && (
        <div className="mt-3">
          <Link
            href="/receptek"
            className="inline-flex items-center gap-1 text-sm text-[var(--color-muted-foreground)] hover:text-[var(--color-primary)] transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Vissza az aktívokhoz</span>
          </Link>
        </div>
      )}

      {recipes.length === 0 ? (
        <EmptyState
          icon={archiveMode ? Archive : ChefHat}
          title={archiveMode ? "Nincs archivált recept" : "Nincs még recepted"}
          description={
            archiveMode
              ? "Az archivált receptek itt jelennek meg."
              : "Vidd fel a kedvenceid, aztán generálj bevásárlólistát belőlük."
          }
          action={
            archiveMode ? undefined : (
              <Button
                href="/receptek/uj"
                leftIcon={<Plus className="w-4 h-4" />}
              >
                Új recept
              </Button>
            )
          }
        />
      ) : (
        <RecipeListClient recipes={recipes} />
      )}
    </main>
  );
}
