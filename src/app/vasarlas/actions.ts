"use server";

import { requireUser } from "@/lib/auth";
import {
  getPurchase,
  savePurchase,
  deletePurchase,
  savePantryItem,
} from "@/lib/data";
import { redis, key, newId, slug } from "@/lib/redis";
import type { Purchase, PurchaseLine, Unit } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseReceiptText } from "./parse";

function parseDate(v: string): number | null {
  if (!v) return null;
  const t = new Date(v).getTime();
  return isNaN(t) ? null : t;
}

function sumTotal(lines: PurchaseLine[]): number {
  return lines.reduce((s, l) => s + (l.total || 0), 0);
}

async function extractPdfText(file: File): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mod = await import("pdf-parse");
  const parser = new mod.PDFParse({ data: bytes });
  const result = await parser.getText();
  return result.text ?? "";
}

export async function createPurchaseAction(fd: FormData) {
  const me = await requireUser();
  const sourceRaw = String(fd.get("source") ?? "text");
  const source: "text" | "pdf" | "photo" =
    sourceRaw === "pdf" ? "pdf" : sourceRaw === "photo" ? "photo" : "text";
  const store = String(fd.get("store") ?? "").trim();
  const purchasedAtRaw = String(fd.get("purchasedAt") ?? "").trim();
  const purchasedAt = parseDate(purchasedAtRaw) ?? Date.now();

  let raw = "";
  if (source === "pdf") {
    const pdf = fd.get("pdf");
    if (pdf instanceof File && pdf.size > 0) {
      try {
        raw = await extractPdfText(pdf);
      } catch {
        raw = "";
      }
    }
  } else {
    // text and photo (photo is client-side OCR'd; raw contains the OCR text)
    raw = String(fd.get("raw") ?? "");
  }

  const lines = parseReceiptText(raw);

  const purchase: Purchase = {
    id: newId(),
    store: store || "Ismeretlen bolt",
    purchasedAt,
    total: sumTotal(lines),
    source,
    raw,
    lines,
    createdAt: Date.now(),
  };

  await savePurchase(me.householdId, purchase);
  revalidatePath("/vasarlas");
  redirect(`/vasarlas/${purchase.id}/szerkesztes`);
}

export async function updatePurchaseAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const existing = await getPurchase(me.householdId, id);
  if (!existing) return;

  const store = String(fd.get("store") ?? "").trim() || existing.store;
  const purchasedAt =
    parseDate(String(fd.get("purchasedAt") ?? "")) ?? existing.purchasedAt;

  const count = Number(fd.get("lineCount") ?? 0);
  const lines: PurchaseLine[] = [];
  const pantryOps: Array<{
    name: string;
    qty: number;
    unit: Unit;
    locationId: string;
    expiresAt: number | null;
    price: number | null;
    unitPrice: number;
  }> = [];

  for (let i = 0; i < count; i++) {
    const name = String(fd.get(`name-${i}`) ?? "").trim();
    if (!name) continue;
    const qty = Number(fd.get(`qty-${i}`) ?? 0);
    const unit = String(fd.get(`unit-${i}`) ?? "db") as Unit;
    const unitPrice = Number(fd.get(`unitPrice-${i}`) ?? 0);
    const total = Number(fd.get(`total-${i}`) ?? 0);
    const addToPantry = String(fd.get(`addToPantry-${i}`) ?? "") === "on";
    const locationRaw = String(fd.get(`locationId-${i}`) ?? "").trim();
    const locationId = locationRaw || null;
    const expiresAt = parseDate(String(fd.get(`expiresAt-${i}`) ?? ""));

    lines.push({
      name,
      qty: isNaN(qty) ? 0 : qty,
      unit,
      unitPrice: isNaN(unitPrice) ? 0 : Math.round(unitPrice),
      total: isNaN(total) ? 0 : Math.round(total),
      addToPantry,
      locationId,
      expiresAt,
    });

    if (addToPantry && locationId) {
      pantryOps.push({
        name,
        qty: isNaN(qty) || qty <= 0 ? 1 : qty,
        unit,
        locationId,
        expiresAt,
        price: isNaN(total) ? null : Math.round(total),
        unitPrice: isNaN(unitPrice) ? 0 : Math.round(unitPrice),
      });
    }
  }

  const next: Purchase = {
    ...existing,
    store,
    purchasedAt,
    total: sumTotal(lines),
    lines,
  };
  await savePurchase(me.householdId, next);

  // Push price history and save pantry items
  const now = Date.now();
  for (const op of pantryOps) {
    await savePantryItem(me.householdId, {
      name: op.name,
      qty: op.qty,
      unit: op.unit,
      locationId: op.locationId,
      expiresAt: op.expiresAt,
      price: op.price,
      note: "",
      boughtAt: purchasedAt,
    });
    const entry = {
      price: op.unitPrice || op.price || 0,
      qty: op.qty,
      unit: op.unit,
      ts: now,
    };
    const histKey = key.priceHistory(me.householdId, slug(op.name));
    await redis.lpush(histKey, JSON.stringify(entry));
    await redis.ltrim(histKey, 0, 49);
  }

  revalidatePath("/vasarlas");
  revalidatePath(`/vasarlas/${id}`);
  redirect(`/vasarlas/${id}`);
}

export async function deletePurchaseAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deletePurchase(me.householdId, id);
  revalidatePath("/vasarlas");
  redirect("/vasarlas");
}
