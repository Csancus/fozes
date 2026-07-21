"use server";

import { requireUser } from "@/lib/auth";
import {
  saveExpense,
  deleteExpense,
  setExpenseReview,
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
  createGroup,
  updateGroup,
  deleteGroup,
  createMerchant,
  updateMerchant,
  deleteMerchant,
  createRecurring,
  updateRecurring,
  deleteRecurring,
  createIncomeCategory,
  updateIncomeCategory,
  deleteIncomeCategory,
} from "@/lib/data";
import { slug } from "@/lib/redis";
import type { PaymentKind, ExpenseKind, ExpenseNature } from "@/lib/types";
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
  const kind: ExpenseKind =
    String(fd.get("kind") ?? "expense") === "income" ? "income" : "expense";
  const nature: ExpenseNature =
    String(fd.get("nature") ?? "avg") === "project" ? "project" : "avg";
  const review = String(fd.get("review") ?? "") === "on";
  const amount = parseAmount(String(fd.get("amount") ?? ""));
  const merchant = String(fd.get("merchant") ?? "").trim();
  let categoryId = String(fd.get("categoryId") ?? "").trim() || null;
  const paymentMethodId = String(fd.get("paymentMethodId") ?? "").trim() || null;
  const personId = String(fd.get("personId") ?? "").trim() || null;
  const projectId = String(fd.get("projectId") ?? "").trim() || null;
  const groupId = String(fd.get("groupId") ?? "").trim() || null;
  const note = String(fd.get("note") ?? "").trim();
  const spentAt = parseDate(String(fd.get("spentAt") ?? ""));

  if (amount <= 0 || !merchant) return;

  // Kiadásnál: ha nincs kézzel választva kategória, próbáljuk a tanult bolt→kategória párost.
  if (kind === "expense" && !categoryId) {
    const map = await getMerchantMap(me.householdId);
    categoryId = map[slug(merchant)] ?? null;
  }

  await saveExpense(me.householdId, {
    id,
    kind,
    amount,
    merchant,
    categoryId,
    paymentMethodId,
    personId,
    projectId,
    groupId,
    nature,
    review,
    note,
    spentAt,
  });

  // Ismétlődővé jelölés: létrehozunk egy havi szabályt is. A mostani hónapot a
  // most rögzített tétel lefedi → lastRunPeriod = ez a hónap (nem duplikál).
  if (!id && String(fd.get("recurring") ?? "") === "on") {
    const d = new Date(spentAt);
    const rawDay = parseInt(String(fd.get("recurringDay") ?? ""), 10);
    const dayOfMonth = Number.isFinite(rawDay) ? rawDay : d.getDate();
    const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    await createRecurring(me.householdId, {
      kind,
      amount,
      merchant,
      categoryId,
      paymentMethodId,
      personId,
      projectId,
      groupId,
      nature,
      note,
      dayOfMonth,
      active: true,
      lastRunPeriod: period,
    });
    revalidatePath("/koltsegek/ismetlodo");
  }

  revalidatePath("/koltsegek");
  revalidatePath("/koltsegek/bevetel");
  revalidatePath("/");
  redirect(kind === "income" ? "/koltsegek?nezet=bevetel" : "/koltsegek");
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

// Felülvizsgálat-jelölés váltása (Teendők oldalról, nincs redirect).
export async function setExpenseReviewAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const review = String(fd.get("review") ?? "") === "on";
  await setExpenseReview(me.householdId, id, review);
  revalidatePath("/koltsegek/teendok");
  revalidatePath("/koltsegek");
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

// Gyors, helyben létrehozott kategória (táblázatból / űrlapról). Visszaadja az újat.
export async function createCategoryInline(name: string) {
  const me = await requireUser();
  const n = name.trim();
  if (!n) return null;
  const cat = await createExpenseCategory(me.householdId, {
    name: n,
    color: "sky",
    icon: "tag",
  });
  revalidatePath("/koltsegek");
  revalidatePath("/koltsegek/beallitasok");
  return cat;
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

// ============ BEVÉTEL-KATEGÓRIÁK ============

export async function createIncomeCategoryInline(name: string) {
  const me = await requireUser();
  const n = name.trim();
  if (!n) return null;
  const cat = await createIncomeCategory(me.householdId, {
    name: n,
    color: "emerald",
    icon: "savings",
  });
  revalidatePath("/koltsegek");
  revalidatePath("/koltsegek/beallitasok");
  return cat;
}

export async function createIncomeCategoryAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "emerald").trim();
  const icon = String(fd.get("icon") ?? "savings").trim();
  if (!name) return;
  await createIncomeCategory(me.householdId, { name, color, icon });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function updateIncomeCategoryAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "emerald").trim();
  const icon = String(fd.get("icon") ?? "savings").trim();
  if (!id || !name) return;
  await updateIncomeCategory(me.householdId, id, { name, color, icon });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function deleteIncomeCategoryAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteIncomeCategory(me.householdId, id);
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

// ============ CSOPORTOK ============

export async function createGroupAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "violet").trim();
  if (!name) return;
  await createGroup(me.householdId, { name, color });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek/csoportok");
}

export async function updateGroupAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "violet").trim();
  if (!id || !name) return;
  await updateGroup(me.householdId, id, { name, color });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek/csoportok");
}

export async function deleteGroupAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteGroup(me.householdId, id);
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek/csoportok");
}

// ============ BOLTOK / KINEK (merchants) ============

export async function createMerchantAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const categoryId = String(fd.get("categoryId") ?? "").trim() || null;
  if (!name) return;
  await createMerchant(me.householdId, { name, categoryId });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function updateMerchantAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const categoryId = String(fd.get("categoryId") ?? "").trim() || null;
  if (!id || !name) return;
  await updateMerchant(me.householdId, id, { name, categoryId });
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

export async function deleteMerchantAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteMerchant(me.householdId, id);
  revalidatePath("/koltsegek/beallitasok");
  revalidatePath("/koltsegek");
}

// ============ ISMÉTLŐDŐ KÖLTSÉGEK (recurring) ============

function prevPeriod(): string {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() - 1);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

async function readRecurringFields(fd: FormData, hh: string) {
  const amount = parseAmount(String(fd.get("amount") ?? ""));
  const merchant = String(fd.get("merchant") ?? "").trim();
  let categoryId = String(fd.get("categoryId") ?? "").trim() || null;
  if (!categoryId && merchant) {
    const map = await getMerchantMap(hh);
    categoryId = map[slug(merchant)] ?? null;
  }
  const paymentMethodId = String(fd.get("paymentMethodId") ?? "").trim() || null;
  const personId = String(fd.get("personId") ?? "").trim() || null;
  const projectId = String(fd.get("projectId") ?? "").trim() || null;
  const note = String(fd.get("note") ?? "").trim();
  const dayOfMonth = parseInt(String(fd.get("dayOfMonth") ?? "1"), 10) || 1;
  return {
    amount,
    merchant,
    categoryId,
    paymentMethodId,
    personId,
    projectId,
    note,
    dayOfMonth,
  };
}

export async function createRecurringAction(fd: FormData) {
  const me = await requireUser();
  const f = await readRecurringFields(fd, me.householdId);
  if (f.amount <= 0 || !f.merchant) return;
  await createRecurring(me.householdId, {
    ...f,
    active: true,
    lastRunPeriod: prevPeriod(), // az e havit is generálja, ha az esedékesség napja már elmúlt
  });
  revalidatePath("/koltsegek/ismetlodo");
  revalidatePath("/koltsegek");
  redirect("/koltsegek/ismetlodo");
}

export async function updateRecurringAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const f = await readRecurringFields(fd, me.householdId);
  if (f.amount <= 0 || !f.merchant) return;
  await updateRecurring(me.householdId, id, f);
  revalidatePath("/koltsegek/ismetlodo");
  revalidatePath("/koltsegek");
  redirect("/koltsegek/ismetlodo");
}

export async function toggleRecurringAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const active = String(fd.get("active") ?? "") === "on";
  await updateRecurring(me.householdId, id, { active });
  revalidatePath("/koltsegek/ismetlodo");
}

export async function deleteRecurringAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteRecurring(me.householdId, id);
  revalidatePath("/koltsegek/ismetlodo");
}

// ============ TÖMEGES RÖGZÍTÉS (táblázat) ============

type BatchRow = {
  kind: unknown;
  amount: unknown;
  merchant: unknown;
  categoryId: unknown;
  paymentMethodId: unknown;
  personId: unknown;
  projectId: unknown;
  groupId: unknown;
  nature: unknown;
  review: unknown;
  recurring: unknown;
  spentAt: unknown;
  note: unknown;
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
    const kind: ExpenseKind =
      String(r.kind ?? "expense") === "income" ? "income" : "expense";
    const amount = parseAmount(String(r.amount ?? ""));
    const merchant = String(r.merchant ?? "").trim();
    if (amount <= 0 || !merchant) continue;

    let categoryId = String(r.categoryId ?? "").trim() || null;
    if (kind === "expense" && !categoryId) categoryId = map[slug(merchant)] ?? null;
    const paymentMethodId = String(r.paymentMethodId ?? "").trim() || null;
    const personId = String(r.personId ?? "").trim() || null;
    const projectId = String(r.projectId ?? "").trim() || null;
    const groupId = String(r.groupId ?? "").trim() || null;
    const nature: ExpenseNature =
      kind === "income"
        ? "avg"
        : String(r.nature ?? "avg") === "project"
          ? "project"
          : "avg";
    const spentAt = parseDate(String(r.spentAt ?? ""));
    const note = String(r.note ?? "").trim();
    const review = r.review === true;

    await saveExpense(me.householdId, {
      kind,
      amount,
      merchant,
      categoryId,
      paymentMethodId,
      personId,
      projectId,
      groupId,
      nature,
      review,
      note,
      spentAt,
    });
    saved++;

    // Ismétlődő jelölés → havi szabály (a rögzített hónapot a mostani tétel fedi le).
    if (r.recurring === true) {
      const d = new Date(spentAt);
      const period = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      await createRecurring(me.householdId, {
        kind,
        amount,
        merchant,
        categoryId,
        paymentMethodId,
        personId,
        projectId,
        groupId,
        nature,
        note,
        dayOfMonth: d.getDate(),
        active: true,
        lastRunPeriod: period,
      });
    }
  }

  if (saved > 0) {
    revalidatePath("/koltsegek");
    revalidatePath("/koltsegek/attekintes");
    revalidatePath("/koltsegek/ismetlodo");
    revalidatePath("/");
  }
  redirect("/koltsegek");
}

// ============ MEGLÉVŐK SZERKESZTÉSE (táblázat) ============

type EditRow = {
  id: unknown;
  kind: unknown;
  amount: unknown;
  merchant: unknown;
  categoryId: unknown;
  paymentMethodId: unknown;
  personId: unknown;
  projectId: unknown;
  groupId: unknown;
  nature: unknown;
  review: unknown;
  spentAt: unknown;
  note: unknown;
};

export async function updateExpensesBatchAction(fd: FormData) {
  const me = await requireUser();
  let rows: EditRow[] = [];
  let deletedIds: string[] = [];
  try {
    const parsed = JSON.parse(String(fd.get("rows") ?? "[]"));
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
    rows = [];
  }
  try {
    const parsed = JSON.parse(String(fd.get("deletedIds") ?? "[]"));
    if (Array.isArray(parsed)) deletedIds = parsed.map((x) => String(x)).filter(Boolean);
  } catch {
    deletedIds = [];
  }

  for (const id of deletedIds) {
    await deleteExpense(me.householdId, id);
  }

  const map = await getMerchantMap(me.householdId);
  for (const r of rows) {
    const id = String(r.id ?? "").trim();
    if (!id) continue; // csak meglévőket frissítünk itt
    const kind: ExpenseKind =
      String(r.kind ?? "expense") === "income" ? "income" : "expense";
    const amount = parseAmount(String(r.amount ?? ""));
    const merchant = String(r.merchant ?? "").trim();
    if (amount <= 0 || !merchant) continue;

    let categoryId = String(r.categoryId ?? "").trim() || null;
    if (kind === "expense" && !categoryId) categoryId = map[slug(merchant)] ?? null;
    const paymentMethodId = String(r.paymentMethodId ?? "").trim() || null;
    const personId = String(r.personId ?? "").trim() || null;
    const projectId = String(r.projectId ?? "").trim() || null;
    const groupId = String(r.groupId ?? "").trim() || null;
    const nature: ExpenseNature =
      kind === "income"
        ? "avg"
        : String(r.nature ?? "avg") === "project"
          ? "project"
          : "avg";
    const review = r.review === true;
    const spentAt = parseDate(String(r.spentAt ?? ""));
    const note = String(r.note ?? "");

    await saveExpense(me.householdId, {
      id,
      kind,
      amount,
      merchant,
      categoryId,
      paymentMethodId,
      personId,
      projectId,
      groupId,
      nature,
      review,
      note,
      spentAt,
    });
  }

  revalidatePath("/koltsegek");
  revalidatePath("/koltsegek/tabla");
  revalidatePath("/");
  redirect("/koltsegek/tabla");
}
