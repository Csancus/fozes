"use server";

import { requireUser } from "@/lib/auth";
import { saveRecipe, deleteRecipe } from "@/lib/data";
import { parseIngredientText } from "@/lib/ingredient-parse";
import { RECIPE_CATEGORIES } from "@/lib/types";
import type { RecipeCategory } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function saveRecipeAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "") || undefined;
  const name = String(fd.get("name") ?? "").trim();
  const servings = Math.max(1, Number(fd.get("servings") ?? 4));
  const kcalRaw = String(fd.get("caloriesPerServing") ?? "").trim();
  const proteinRaw = String(fd.get("proteinPerServing") ?? "").trim();
  const caloriesPerServing = kcalRaw === "" ? null : Math.max(0, Math.round(Number(kcalRaw)));
  const proteinPerServing = proteinRaw === "" ? null : Math.max(0, Number(proteinRaw));
  const ingredientsText = String(fd.get("ingredients") ?? "");
  const instructions = String(fd.get("instructions") ?? "").trim();
  const tags = String(fd.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const categoryRaw = String(fd.get("category") ?? "").trim();
  const category = (RECIPE_CATEGORIES as string[]).includes(categoryRaw)
    ? (categoryRaw as RecipeCategory)
    : null;
  const eventIdRaw = String(fd.get("eventId") ?? "").trim();
  const eventId = eventIdRaw || null;
  const imageUrlRaw = String(fd.get("imageUrl") ?? "").trim();
  const imageUrl =
    imageUrlRaw.startsWith("data:image/") || imageUrlRaw.startsWith("https://")
      ? imageUrlRaw
      : null;

  if (!name) return;

  await saveRecipe(me.householdId, {
    id,
    name,
    servings,
    category,
    eventId,
    caloriesPerServing: Number.isFinite(caloriesPerServing as number) ? caloriesPerServing : null,
    proteinPerServing: Number.isFinite(proteinPerServing as number) ? proteinPerServing : null,
    imageUrl,
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
