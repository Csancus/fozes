import { requireUser } from "@/lib/auth";
import { listRecipes } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { RecipeMatrix } from "./RecipeMatrix";

export default async function UjBevasarlasPage() {
  const me = await requireUser();
  const recipes = await listRecipes(me.householdId);

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-3xl mx-auto">
      <PageHeader title="Új bevásárlólista" back="/bevasarlas" />
      <div className="mt-5 animate-fade-up">
        <RecipeMatrix recipes={recipes} />
      </div>
    </main>
  );
}
