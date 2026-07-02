import { PageHeader } from "@/components/ui/PageHeader";
import { RecipeForm } from "../RecipeForm";
import { saveRecipeAction } from "../actions";

export default function UjReceptPage() {
  return (
    <main className="min-h-dvh px-5 pb-8 max-w-md md:max-w-2xl mx-auto">
      <PageHeader title="Új recept" back="/receptek" />
      <div className="mt-5 animate-fade-up">
        <RecipeForm action={saveRecipeAction} />
      </div>
    </main>
  );
}
