import { PageHeader } from "@/components/PageHeader";
import { RecipeForm } from "../RecipeForm";
import { saveRecipeAction } from "../actions";

export default function UjReceptPage() {
  return (
    <main className="min-h-dvh px-5 py-6 bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-50">
      <PageHeader title="Új recept" back="/receptek" />
      <div className="mt-6">
        <RecipeForm action={saveRecipeAction} />
      </div>
    </main>
  );
}
