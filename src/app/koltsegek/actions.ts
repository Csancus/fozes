"use server";

import { requireUser } from "@/lib/auth";
import {
  saveExpense,
  deleteExpense,
  getMerchantMap,
  createExpenseCategory,
  updateExpenseCategory,
  deleteExpenseCategory,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  createPerson,
  updatePerson,
  deletePerson,
  createProject,
  updateProject,
  deleteProject,
} from "@/lib/data";
import { slug } from "@/lib/redis";
import type { PaymentKind } from "@/lib/types";
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
  const paymentMethodId = String(fd.get("paymentMethodId") ?? "").trim() || null;
  const personId = String(fd.get("personId") ?? "").trim() || null;
  const projectId = String(fd.get("projectId") ?? "").trim() || null;
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
    paymentMethodId,
    personId,
    projectId,
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
  revalidatePath("/koltsegek/beallitasok");
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
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function deleteCategoryAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteExpenseCategory(me.householdId, id);
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

// ============ FIZETÉSI MÓDOK (bankkártya / utalás / készpénz) ============

const PAY_KINDS: PaymentKind[] = ["card", "transfer", "cash"];

export async function createPaymentMethodAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const kindRaw = String(fd.get("kind") ?? "card") as PaymentKind;
  const kind = PAY_KINDS.includes(kindRaw) ? kindRaw : "card";
  const color = String(fd.get("color") ?? "zinc").trim();
  const last4 = String(fd.get("last4") ?? "")
    .replace(/\D/g, "")
    .slice(0, 4);
  if (!name) return;
  await createPaymentMethod(me.householdId, {
    name,
    kind,
    color,
    last4: last4 || null,
  });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function updatePaymentMethodAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const kindRaw = String(fd.get("kind") ?? "card") as PaymentKind;
  const kind = PAY_KINDS.includes(kindRaw) ? kindRaw : "card";
  const color = String(fd.get("color") ?? "zinc").trim();
  const last4 = String(fd.get("last4") ?? "")
    .replace(/\D/g, "")
    .slice(0, 4);
  if (!id || !name) return;
  await updatePaymentMethod(me.householdId, id, {
    name,
    kind,
    color,
    last4: last4 || null,
  });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function deletePaymentMethodAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deletePaymentMethod(me.householdId, id);
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

// ============ SZEMÉLYEK (ki költötte) ============

export async function createPersonAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "zinc").trim();
  if (!name) return;
  await createPerson(me.householdId, { name, color });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function updatePersonAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "zinc").trim();
  if (!id || !name) return;
  await updatePerson(me.householdId, id, { name, color });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function deletePersonAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deletePerson(me.householdId, id);
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

// ============ PROJEKTEK ============

export async function createProjectAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "zinc").trim();
  if (!name) return;
  await createProject(me.householdId, { name, color });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function updateProjectAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "zinc").trim();
  if (!id || !name) return;
  await updateProject(me.householdId, id, { name, color });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function deleteProjectAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteProject(me.householdId, id);
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

// ============ TÖMEGES RÖGZÍTÉS (táblázat) ============

type BatchRow = {
  amount: unknown;
  merchant: unknown;
  categoryId: unknown;
  paymentMethodId: unknown;
  personId: unknown;
  projectId: unknown;
  spentAt: unknown;
};

export async function saveExpensesBatchAction(fd: FormData) {
  const me = await requireUser();
  let rows: BatchRow[] = [];
  try {
    const parsed = JSON.parse(String(fd.get("rows") ?? "[]"));
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
    rows = [];
  }

  const map = await getMerchantMap(me.householdId);
  let saved = 0;

  for (const r of rows) {
    const amount = parseAmount(String(r.amount ?? ""));
    const merchant = String(r.merchant ?? "").trim();
    if (amount <= 0 || !merchant) continue;

    let categoryId = String(r.categoryId ?? "").trim() || null;
    if (!categoryId) categoryId = map[slug(merchant)] ?? null;
    const paymentMethodId = String(r.paymentMethodId ?? "").trim() || null;
    const personId = String(r.personId ?? "").trim() || null;
    const projectId = String(r.projectId ?? "").trim() || null;
    const spentAt = parseDate(String(r.spentAt ?? ""));

    await saveExpense(me.householdId, {
      amount,
      merchant,
      categoryId,
      paymentMethodId,
      personId,
      projectId,
      note: "",
      spentAt,
    });
    saved++;
  }

  if (saved > 0) {
    revalidatePath("/koltsegek");
    revalidatePath("/");
  }
  redirect("/koltsegek");
}
