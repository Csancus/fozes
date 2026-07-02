"use server";

import { requireUser } from "@/lib/auth";
import { savePantryItem, deletePantryItem } from "@/lib/data";
import type { Unit } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseDate(v: string): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return isNaN(t) ? null : t;
}

export async function savePantryAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "") || undefined;
  const name = String(fd.get("name") ?? "").trim();
  const qty = Number(fd.get("qty") ?? 0);
  const unit = String(fd.get("unit") ?? "db") as Unit;
  const locationId = String(fd.get("locationId") ?? "");
  const expiresAt = parseDate(String(fd.get("expiresAt") ?? ""));
  const priceRaw = String(fd.get("price") ?? "").trim();
  const price = priceRaw ? Number(priceRaw) : null;
  const note = String(fd.get("note") ?? "").trim();

  if (!name || !locationId) return;

  await savePantryItem(me.householdId, {
    id,
    name,
    qty,
    unit,
    locationId,
    expiresAt,
    price,
    note,
  });
  revalidatePath("/spajz");
  redirect("/spajz");
}

export async function deletePantryAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deletePantryItem(me.householdId, id);
  revalidatePath("/spajz");
  redirect("/spajz");
}
