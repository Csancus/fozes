"use server";

import { requireUser } from "@/lib/auth";
import {
  listPaymentMethods,
  createPaymentMethod,
  updatePaymentMethod,
  deletePaymentMethod,
  listPersons,
  createPerson,
  deletePerson,
  listExpenseCategories,
  createExpenseCategory,
  deleteExpenseCategory,
  listIncomeCategories,
  createIncomeCategory,
  deleteIncomeCategory,
  listExpenses,
  setCostSetup,
} from "@/lib/data";
import type { PaymentKind } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const PAY_KINDS: PaymentKind[] = ["card", "transfer", "cash"];

type AccountInput = {
  id?: string;
  name?: string;
  kind?: string;
  last4?: string;
  color?: string;
  openingBalance?: number | string;
  forIncome?: boolean;
};
type NamedInput = { id?: string; name?: string; color?: string; icon?: string };

type SetupPayload = {
  accounts?: AccountInput[];
  persons?: NamedInput[];
  categories?: { keepIds?: string[]; added?: NamedInput[] };
  incomeCategories?: { keepIds?: string[]; added?: NamedInput[] };
};

function parsePayload(raw: string): SetupPayload {
  try {
    const p = JSON.parse(raw);
    return p && typeof p === "object" ? (p as SetupPayload) : {};
  } catch {
    return {};
  }
}

// A tételek `spentAt`-je a nap DELE (parseDate: "YYYY-MM-DDT12:00"), ezért a
// kezdő egyenleg érvényessége a nap ELEJE — különben a megadás napján rögzített
// tételek kimaradnának az egyenlegből.
function startOfToday(): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.getTime();
}

function toAmount(v: number | string | undefined): number {
  if (typeof v === "number") return Number.isFinite(v) ? Math.round(v) : 0;
  const n = Number(String(v ?? "").replace(/\s/g, "").replace(",", "."));
  return Number.isFinite(n) ? Math.round(n) : 0;
}

// A varázsló egy lépésben menti az egészet: számlák, ki költ, kategóriák.
export async function completeCostSetupAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;
  const payload = parsePayload(String(fd.get("payload") ?? "{}"));
  const now = Date.now();
  const openingFrom = startOfToday();

  // --- Számlák / kártyák ---
  const accounts = (payload.accounts ?? []).filter((a) =>
    String(a.name ?? "").trim()
  );
  const existingAccounts = await listPaymentMethods(hh);
  // Már rögzített tételek: amire hivatkoznak, azt nem töröljük ki alóluk.
  const expenses = await listExpenses(hh);
  const usedAccountIds = new Set(
    expenses.map((e) => e.paymentMethodId).filter(Boolean) as string[]
  );
  const usedPersonIds = new Set(
    expenses.map((e) => e.personId).filter(Boolean) as string[]
  );
  const usedCategoryIds = new Set(
    expenses.map((e) => e.categoryId).filter(Boolean) as string[]
  );
  let kept = 0;
  const keptAccountIds = new Set(
    accounts.map((a) => a.id).filter((id): id is string => !!id)
  );
  let usesBalances = false;

  for (const a of accounts) {
    const kindRaw = String(a.kind ?? "card") as PaymentKind;
    const patch = {
      name: String(a.name ?? "").trim(),
      kind: PAY_KINDS.includes(kindRaw) ? kindRaw : "card",
      color: String(a.color ?? "zinc").trim() || "zinc",
      last4: String(a.last4 ?? "").replace(/\D/g, "").slice(0, 4) || null,
      openingBalance: toAmount(a.openingBalance),
      forIncome: !!a.forIncome,
    };
    if (patch.openingBalance !== 0) usesBalances = true;
    if (a.id && existingAccounts.some((e) => e.id === a.id)) {
      const prev = existingAccounts.find((e) => e.id === a.id);
      await updatePaymentMethod(hh, a.id, {
        ...patch,
        // Változatlan összegnél marad a régi dátum, új összegnél a mai nap eleje.
        openingAt:
          patch.openingBalance === 0
            ? null
            : prev?.openingBalance === patch.openingBalance
              ? prev?.openingAt ?? openingFrom
              : openingFrom,
      });
    } else {
      await createPaymentMethod(hh, {
        ...patch,
        openingAt: patch.openingBalance === 0 ? null : openingFrom,
      });
    }
  }
  // Amit a varázslóban kitörölt, azt itt is töröljük — kivéve, ha már van rá
  // rögzített tétel (különben a tételekben árva hivatkozás maradna).
  for (const e of existingAccounts) {
    if (keptAccountIds.has(e.id)) continue;
    if (usedAccountIds.has(e.id)) { kept += 1; continue; }
    await deletePaymentMethod(hh, e.id);
  }

  // --- Ki költ (személyek) ---
  const persons = (payload.persons ?? []).filter((p) =>
    String(p.name ?? "").trim()
  );
  const existingPersons = await listPersons(hh);
  const keptPersonIds = new Set(
    persons.map((p) => p.id).filter((id): id is string => !!id)
  );
  for (const p of persons) {
    if (p.id && existingPersons.some((e) => e.id === p.id)) continue;
    await createPerson(hh, {
      name: String(p.name ?? "").trim(),
      color: String(p.color ?? "zinc").trim() || "zinc",
    });
  }
  for (const e of existingPersons) {
    if (keptPersonIds.has(e.id)) continue;
    if (usedPersonIds.has(e.id)) { kept += 1; continue; }
    await deletePerson(hh, e.id);
  }

  // --- Kiadás-kategóriák ---
  const cats = payload.categories ?? {};
  const keepCats = new Set(cats.keepIds ?? []);
  const existingCats = await listExpenseCategories(hh);
  for (const c of existingCats) {
    if (keepCats.has(c.id)) continue;
    if (usedCategoryIds.has(c.id)) { kept += 1; continue; }
    await deleteExpenseCategory(hh, c.id);
  }
  for (const c of cats.added ?? []) {
    const name = String(c.name ?? "").trim();
    if (!name) continue;
    await createExpenseCategory(hh, {
      name,
      color: String(c.color ?? "zinc").trim() || "zinc",
      icon: String(c.icon ?? "tag").trim() || "tag",
    });
  }

  // --- Bevétel-kategóriák ---
  const inc = payload.incomeCategories ?? {};
  const keepInc = new Set(inc.keepIds ?? []);
  const existingInc = await listIncomeCategories(hh);
  for (const c of existingInc) {
    if (keepInc.has(c.id)) continue;
    if (usedCategoryIds.has(c.id)) { kept += 1; continue; }
    await deleteIncomeCategory(hh, c.id);
  }
  for (const c of inc.added ?? []) {
    const name = String(c.name ?? "").trim();
    if (!name) continue;
    await createIncomeCategory(hh, {
      name,
      color: String(c.color ?? "zinc").trim() || "zinc",
      icon: String(c.icon ?? "tag").trim() || "tag",
    });
  }

  await setCostSetup(hh, {
    done: true,
    skipped: false,
    usesBalances,
    completedAt: now,
  });

  revalidatePath("/koltsegek", "layout");
  revalidatePath("/");
  redirect(`/koltsegek?bevezeto=kesz${kept > 0 ? `&megtartva=${kept}` : ""}`);
}

// „Kihagyom” — nem kérdezzük újra, az alapértelmezésekkel indul.
export async function skipCostSetupAction() {
  const me = await requireUser();
  await setCostSetup(me.householdId, {
    done: true,
    skipped: true,
    completedAt: Date.now(),
  });
  revalidatePath("/koltsegek", "layout");
  redirect("/koltsegek");
}

// Újraindítás a Beállításokból.
export async function restartCostSetupAction() {
  const me = await requireUser();
  await setCostSetup(me.householdId, { done: false, skipped: false });
  revalidatePath("/koltsegek", "layout");
  redirect("/koltsegek/bevezeto");
}
