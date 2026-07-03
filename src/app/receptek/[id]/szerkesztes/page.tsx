import { requireUser } from "@/lib/auth";
import { getRecipe } from "@/lib/data";
import { notFound } from "next/navigation";
import { PageHeader } from "@/components/ui/PageHeader";
import { RecipeForm } from "../../RecipeForm";
import { saveRecipeAction } from "../../actions";

export default async function EditRecipePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const recipe = await getRecipe(me.householdId, id);
  if (!recipe) notFound();

  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader
        title="Szerkesztés"
        subtitle={recipe.name}
        back={`/receptek/${id}`}
      />
      <div className="mt-5 animate-fade-up">
        <RecipeForm action={saveRecipeAction} initial={recipe} />
      </div>
    </main>
  );
}
