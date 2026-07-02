import { requireUser } from "@/lib/auth";
import { getRecipe } from "@/lib/data";
import { PageHeader } from "@/components/PageHeader";
import { notFound } from "next/navigation";
import { RecipeForm } from "../RecipeForm";
import { saveRecipeAction, deleteRecipeAction } from "../actions";

export default async function EditReceptPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const me = await requireUser();
  const { id } = await params;
  const recipe = await getRecipe(me.householdId, id);
  if (!recipe) notFound();

  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <PageHeader title="Recept" back="/receptek" />
      <div className="mt-6">
        <RecipeForm action={saveRecipeAction} initial={recipe} />
      </div>
      <form action={deleteRecipeAction} className="mt-6">
        <input type="hidden" name="id" value={recipe.id} />
        <button className="text-sm text-red-600 hover:underline">Törlés</button>
      </form>
    </main>
  );
}
