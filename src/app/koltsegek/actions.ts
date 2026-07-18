"use server";

import { requireUser } from "@/lib/auth";
import {
  saveExpense,
  deleteExpense,
  getMerchantMap,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
} from "@/lib/data";
import { slug } from "@/lib/redis";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseDate(v: string): number {
  if (!v) return Date.now();
  const t = new Date(v + "T12:00:00").getTime();
  return isNaN(t) ? Date.now() : t;
}

function parseAmount(v: string): number {
  const n = Number(String(v).replace(/\s/g, "").replace(",", "."));
  return isNaN(n) ? 0 : Math.round(n);
}

export async function saveExpenseAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "") || undefined;
  const amount = parseAmount(String(fd.get("amount") ?? ""));
  const merchant = String(fd.get("merchant") ?? "").trim();
  let categoryId = String(fd.get("categoryId") ?? "").trim() || null;
  const note = String(fd.get("note") ?? "").trim();
  const spentAt = parseDate(String(fd.get("spentAt") ?? ""));

  if (amount <= 0 || !merchant) return;

  // Ha nincs kézzel választva kategória, próbáljuk a tanult bolt→kategória párost.
  if (!categoryId) {
    const map = await getMerchantMap(me.householdId);
    categoryId = map[slug(merchant)] ?? null;
  }

  await saveExpense(me.householdId, {
    id,
    amount,
    merchant,
    categoryId,
    note,
    spentAt,
  });
  revalidatePath("/koltsegek");
  revalidatePath("/");
  redirect("/koltsegek");
}

export async function deleteExpenseAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteExpense(me.householdId, id);
  revalidatePath("/koltsegek");
  revalidatePath("/");
  redirect("/koltsegek");
}

// ============ KATEGÓRIÁK ============

export async function createCategoryAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "zinc").trim();
  const icon = String(fd.get("icon") ?? "tag").trim();
  if (!name) return;
  await createExpenseCategory(me.householdId, { name, color, icon });
  revalidatePath("/koltsegek/kategoriak");
  revalidatePath("/koltsegek");
}

export async function updateCategoryAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "zinc").trim();
  const icon = String(fd.get("icon") ?? "tag").trim();
  if (!id || !name) return;
  await updateExpenseCategory(me.householdId, id, { name, color, icon });
  revalidatePath("/koltsegek/kategoriak");
  revalidatePath("/koltsegek");
}

export async function deleteCategoryAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteExpenseCategory(me.householdId, id);
  revalidatePath("/koltsegek/kategoriak");
  revalidatePath("/koltsegek");
}
