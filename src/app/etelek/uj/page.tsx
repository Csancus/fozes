import { requireUser } from "@/lib/auth";
import { getRecipe, listPantry } from "@/lib/data";
import { estimateRecipeCost } from "@/lib/cost";
import { PageHeader } from "@/components/ui/PageHeader";
import { CookedMealForm } from "./CookedMealForm";

export default async function UjEtelPage({
  searchParams,
}: {
  searchParams: Promise<{ recipeId?: string }>;
}) {
  const me = await requireUser();
  const sp = await searchParams;
  const recipeId = sp.recipeId?.trim() || null;

  let recipeName = "";
  let ingredientCost: number | null = null;

  if (recipeId) {
    const [recipe, pantry] = await Promise.all([
      getRecipe(me.householdId, recipeId),
      listPantry(me.householdId),
    ]);
    if (recipe) {
      recipeName = recipe.name;
      const { total } = estimateRecipeCost(recipe.ingredients, pantry);
      ingredientCost = total;
    }
  }

  const back = recipeId ? `/receptek/${recipeId}` : "/etelek";

  return (
    <main className="min-h-dvh px-5 pt-3 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Elkészítettem" back={back} />
      <div className="mt-5 animate-fade-up">
        <CookedMealForm
          recipeId={recipeId}
          recipeName={recipeName}
          ingredientCost={ingredientCost}
        />
      </div>
    </main>
  );
}
