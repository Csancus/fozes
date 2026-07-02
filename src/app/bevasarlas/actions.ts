"use server";

import { requireUser } from "@/lib/auth";
import {
  listRecipes,
  listPantry,
  getShoppingList,
  saveShoppingList,
  deleteShoppingList,
} from "@/lib/data";
import { newId } from "@/lib/redis";
import type { ShoppingList } from "@/lib/types";
import { aggregateIngredients } from "./aggregate";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function defaultName() {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `Bevásárlás ${y}-${m}-${day}`;
}

export async function createShoppingListAction(fd: FormData) {
  const me = await requireUser();
  const recipeIds = fd.getAll("recipeIds").map((v) => String(v)).filter(Boolean);
  const name = String(fd.get("name") ?? "").trim() || defaultName();

  const [allRecipes, pantry] = await Promise.all([
    listRecipes(me.householdId),
    listPantry(me.householdId),
  ]);
  const selected = allRecipes.filter((r) => recipeIds.includes(r.id));
  const items = aggregateIngredients(selected, pantry);

  const list: ShoppingList = {
    id: newId(),
    name,
    recipeIds: selected.map((r) => r.id),
    items,
    createdAt: Date.now(),
    completedAt: null,
  };

  await saveShoppingList(me.householdId, list);
  revalidatePath("/bevasarlas");
  redirect(`/bevasarlas/${list.id}`);
}

export async function toggleItemAction(fd: FormData) {
  const me = await requireUser();
  const listId = String(fd.get("listId") ?? "");
  const itemIndex = Number(fd.get("itemIndex") ?? -1);
  if (!listId || itemIndex < 0) return;

  const list = await getShoppingList(me.householdId, listId);
  if (!list) return;
  if (itemIndex >= list.items.length) return;

  const items = list.items.map((it, i) =>
    i === itemIndex ? { ...it, checked: !it.checked } : it
  );
  const allChecked = items.length > 0 && items.every((it) => it.checked || it.need === 0);
  const next: ShoppingList = {
    ...list,
    items,
    completedAt: allChecked ? (list.completedAt ?? Date.now()) : null,
  };
  await saveShoppingList(me.householdId, next);
  revalidatePath(`/bevasarlas/${listId}`);
  revalidatePath("/bevasarlas");
}

export async function deleteShoppingListAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteShoppingList(me.householdId, id);
  revalidatePath("/bevasarlas");
  redirect("/bevasarlas");
}
