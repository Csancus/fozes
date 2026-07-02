"use server";

import { requireUser } from "@/lib/auth";
import { saveRecipe, deleteRecipe } from "@/lib/data";
import { parseIngredientText } from "@/lib/ingredient-parse";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveRecipeAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "") || undefined;
  const name = String(fd.get("name") ?? "").trim();
  const servings = Math.max(1, Number(fd.get("servings") ?? 4));
  const ingredientsText = String(fd.get("ingredients") ?? "");
  const instructions = String(fd.get("instructions") ?? "").trim();
  const tags = String(fd.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);

  if (!name) return;

  await saveRecipe(me.householdId, {
    id,
    name,
    servings,
    ingredients: parseIngredientText(ingredientsText),
    instructions,
    tags,
  });
  revalidatePath("/receptek");
  redirect("/receptek");
}

export async function deleteRecipeAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteRecipe(me.householdId, id);
  revalidatePath("/receptek");
  redirect("/receptek");
}
