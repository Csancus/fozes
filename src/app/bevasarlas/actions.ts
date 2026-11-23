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
import type { ShoppingList, ShoppingListItem, Unit } from "@/lib/types";
import { UNITS } from "@/lib/units";
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
  const idx = resolveItemIndex(list.items, itemIndex, fd.get("itemName"));
  if (idx < 0) return;

  const items = list.items.map((it, i) =>
    i === idx ? { ...it, checked: !it.checked } : it
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

export async function addItemAction(fd: FormData) {
  const me = await requireUser();
  const listId = String(fd.get("listId") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim();
  const qty = Number(fd.get("qty") ?? 0);
  const rawUnit = String(fd.get("unit") ?? "db");
  const unit: Unit = (UNITS as string[]).includes(rawUnit)
    ? (rawUnit as Unit)
    : "db";

  if (!listId || !name || !Number.isFinite(qty) || qty <= 0) return;

  const list = await getShoppingList(me.householdId, listId);
  if (!list) return;

  const newItem: ShoppingListItem = {
    name,
    qty,
    unit,
    have: 0,
    need: qty,
    checked: false,
  };

  const next: ShoppingList = {
    ...list,
    items: [...list.items, newItem],
    completedAt: null,
  };
  await saveShoppingList(me.householdId, next);
  revalidatePath(`/bevasarlas/${listId}`);
  revalidatePath("/bevasarlas");
}

export async function removeItemAction(fd: FormData) {
  const me = await requireUser();
  const listId = String(fd.get("listId") ?? "").trim();
  const itemIndex = Number(fd.get("itemIndex") ?? -1);
  if (!listId || !Number.isFinite(itemIndex) || itemIndex < 0) return;

  const list = await getShoppingList(me.householdId, listId);
  if (!list) return;
  const idx = resolveItemIndex(list.items, itemIndex, fd.get("itemName"));
  if (idx < 0) return;

  const items = list.items.filter((_, i) => i !== idx);
  const allChecked =
    items.length > 0 && items.every((it) => it.checked || it.need === 0);
  const next: ShoppingList = {
    ...list,
    items,
    completedAt: allChecked ? (list.completedAt ?? Date.now()) : null,
  };
  await saveShoppingList(me.householdId, next);
  revalidatePath(`/bevasarlas/${listId}`);
  revalidatePath("/bevasarlas");
}

// A sorszám mellé a tétel nevét is küldjük: ha közben (dupla koppintás, másik családtag) változott
// a lista, a név alapján a valódi tételt találjuk meg – nem a helyére csúszott következőt.
function resolveItemIndex(items: { name: string }[], index: number, rawName: FormDataEntryValue | null): number {
  const name = rawName == null ? null : String(rawName);
  if (name === null) return index < items.length ? index : -1;
  if (items[index]?.name === name) return index;
  return items.findIndex((it) => it.name === name);
}
