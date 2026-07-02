"use server";

import { requireUser } from "@/lib/auth";
import {
  saveCookedMeal,
  deleteCookedMeal,
  getCookedMeal,
} from "@/lib/data";
import { newId } from "@/lib/redis";
import type { CookedMeal } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseDate(v: string): number {
  if (!v) return Date.now();
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : Date.now();
}

export async function saveCookedMealAction(fd: FormData) {
  const me = await requireUser();

  const idRaw = String(fd.get("id") ?? "").trim();
  const recipeIdRaw = String(fd.get("recipeId") ?? "").trim();
  const recipeName = String(fd.get("recipeName") ?? "").trim();
  const photoRaw = String(fd.get("photo") ?? "");
  const cookedAtRaw = String(fd.get("cookedAt") ?? "").trim();
  const ratingRaw = Number(fd.get("rating") ?? 0);
  const notes = String(fd.get("notes") ?? "").trim();
  const costRaw = String(fd.get("ingredientCost") ?? "").trim();

  if (!recipeName) return;

  const rating = Math.min(5, Math.max(1, Math.round(ratingRaw || 5)));

  const existing = idRaw ? await getCookedMeal(me.householdId, idRaw) : null;
  const finalId = existing?.id ?? (idRaw || newId());

  const meal: CookedMeal = {
    id: finalId,
    recipeId: recipeIdRaw || null,
    recipeName,
    photo: photoRaw.startsWith("data:image/") ? photoRaw : existing?.photo ?? null,
    cookedAt: parseDate(cookedAtRaw),
    rating,
    notes,
    ingredientCost:
      costRaw === "" || Number.isNaN(Number(costRaw))
        ? existing?.ingredientCost ?? null
        : Math.round(Number(costRaw)),
    createdAt: existing?.createdAt ?? Date.now(),
  };

  await saveCookedMeal(me.householdId, meal);
  revalidatePath("/etelek");
  if (meal.recipeId) revalidatePath(`/receptek/${meal.recipeId}`);
  redirect(`/etelek/${meal.id}`);
}

export async function deleteCookedMealAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const meal = await getCookedMeal(me.householdId, id);
  await deleteCookedMeal(me.householdId, id);
  revalidatePath("/etelek");
  if (meal?.recipeId) revalidatePath(`/receptek/${meal.recipeId}`);
  redirect("/etelek");
}
