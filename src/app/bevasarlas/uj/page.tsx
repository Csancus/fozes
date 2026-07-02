import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { RecipeMatrix } from "./RecipeMatrix";

export default async function UjBevasarlasPage() {
  const me = await requireUser();
  const recipes = await listRecipes(me.householdId);

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50 pb-24">
      <PageHeader title="Új bevásárlólista" back="/bevasarlas" />
      <div className="mt-6">
        <RecipeMatrix recipes={recipes} />
      </div>
    </main>
  );
}
