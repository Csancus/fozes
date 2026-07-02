import { requireUser } from "@/lib/auth";
import { getRecipe } from "@/lib/data";
import { PageHeader } from "@/components/ui/PageHeader";
import { notFound } from "next/navigation";
import { RecipeForm } from "../RecipeForm";
import { saveRecipeAction, deleteRecipeAction } from "../actions";
import { Trash2 } from "lucide-react";

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
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title={recipe.name} back="/receptek" />
      <div className="mt-5 animate-fade-up">
        <RecipeForm action={saveRecipeAction} initial={recipe} />
      </div>

      <form
        action={deleteRecipeAction}
        className="mt-6 flex justify-center"
      >
        <input type="hidden" name="id" value={recipe.id} />
        <button
          type="submit"
          className="inline-flex items-center gap-2 h-9 px-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-500/10 transition active:scale-[0.98]"
        >
          <Trash2 className="w-4 h-4" />
          <span>Recept törlése</span>
        </button>
      </form>
    </main>
  );
}
