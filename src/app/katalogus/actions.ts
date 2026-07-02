"use server";

import { requireUser } from "@/lib/auth";
import {
  saveCatalogItem,
  deleteCatalogItem,
  getCatalogItemByBarcode,
} from "@/lib/data";
import {
  CATALOG_CATEGORIES,
  type CatalogCategory,
  type Unit,
} from "@/lib/types";
import { UNITS } from "@/lib/units";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseCategory(v: string): CatalogCategory {
  return (CATALOG_CATEGORIES as string[]).includes(v)
    ? (v as CatalogCategory)
    : "egyeb";
}

function parseUnit(v: string): Unit {
  return (UNITS as string[]).includes(v) ? (v as Unit) : "db";
}

function parseOptionalNumber(v: string): number | null {
  const t = v.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

export async function saveCatalogAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "") || undefined;
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return;

  const barcode = String(fd.get("barcode") ?? "").replace(/\D/g, "") || null;

  await saveCatalogItem(me.householdId, {
    id,
    name,
    category: parseCategory(String(fd.get("category") ?? "")),
    defaultUnit: parseUnit(String(fd.get("defaultUnit") ?? "")),
    defaultQty: parseOptionalNumber(String(fd.get("defaultQty") ?? "")),
    barcode,
    brand: String(fd.get("brand") ?? "").trim() || null,
    kcal100: parseOptionalNumber(String(fd.get("kcal100") ?? "")),
    protein100: parseOptionalNumber(String(fd.get("protein100") ?? "")),
    fat100: parseOptionalNumber(String(fd.get("fat100") ?? "")),
    carbs100: parseOptionalNumber(String(fd.get("carbs100") ?? "")),
    imageUrl: String(fd.get("imageUrl") ?? "").trim() || null,
  });
  revalidatePath("/katalogus");
  redirect("/katalogus");
}

export async function deleteCatalogAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteCatalogItem(me.householdId, id);
  revalidatePath("/katalogus");
  redirect("/katalogus");
}

export async function lookupBarcodeAction(barcode: string) {
  const me = await requireUser();
  const clean = barcode.replace(/\D/g, "");
  if (clean.length < 6) return { found: false as const };
  const existing = await getCatalogItemByBarcode(me.householdId, clean);
  if (existing) {
    return { found: true as const, existing };
  }
  return { found: false as const };
}
