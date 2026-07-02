"use server";

import { requireUser } from "@/lib/auth";
import {
  saveRecipe,
  deleteRecipe,
  getRecipe,
  archiveRecipe,
  unarchiveRecipe,
} from "@/lib/data";
import { parseIngredientText } from "@/lib/ingredient-parse";
import { RECIPE_CATEGORIES } from "@/lib/types";
import type { RecipeCategory } from "@/lib/types";
import { isRecipeCost, isRecipeDifficulty } from "@/lib/recipe-labels";
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
  const tags = Array.from(
    new Set(
      fd
        .getAll("tags")
        .map(String)
        .map((s) => s.trim())
        .filter(Boolean)
    )
  );
  const costRaw = String(fd.get("cost") ?? "").trim();
  const cost = costRaw && isRecipeCost(costRaw) ? costRaw : null;
  const difficultyRaw = String(fd.get("difficulty") ?? "").trim();
  const difficulty =
    difficultyRaw && isRecipeDifficulty(difficultyRaw) ? difficultyRaw : null;
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
    cost,
    difficulty,
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

export async function duplicateRecipeAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const src = await getRecipe(me.householdId, id);
  if (!src) return;
  const copy = await saveRecipe(me.householdId, {
    name: `${src.name} (másolat)`,
    servings: src.servings,
    category: src.category ?? null,
    eventId: src.eventId ?? null,
    caloriesPerServing: src.caloriesPerServing ?? null,
    proteinPerServing: src.proteinPerServing ?? null,
    imageUrl: src.imageUrl ?? null,
    ingredients: src.ingredients.map((i) => ({ ...i })),
    instructions: src.instructions,
    tags: [...src.tags],
    cost: src.cost ?? null,
    difficulty: src.difficulty ?? null,
    archivedAt: null,
  });
  revalidatePath("/receptek");
  redirect(`/receptek/${copy.id}`);
}

export async function archiveRecipeAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await archiveRecipe(me.householdId, id);
  revalidatePath("/receptek");
  revalidatePath(`/receptek/${id}`);
  redirect("/receptek");
}

export async function unarchiveRecipeAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await unarchiveRecipe(me.householdId, id);
  revalidatePath("/receptek");
  revalidatePath(`/receptek/${id}`);
  redirect(`/receptek/${id}`);
}
