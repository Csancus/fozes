"use server";

import { requireUser } from "@/lib/auth";
import {
  getShoppingList,
  getPurchase,
  savePurchase,
  saveShoppingList,
  savePantryItem,
} from "@/lib/data";
import { redis, key, newId, slug } from "@/lib/redis";
import type {
  Purchase,
  PurchaseLine,
  ShoppingList,
  ShoppingListItem,
  Unit,
} from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { parseReceiptText } from "@/app/vasarlas/parse";

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

/**
 * Parse the incoming receipt (text / pdf / photo-OCR text) and save it as a
 * Purchase. Then redirect to the matching UI where the user can pair parsed
 * lines with shopping-list items.
 */
export async function parseAndMatchAction(fd: FormData) {
  const me = await requireUser();
  const listId = String(fd.get("listId") ?? "").trim();
  if (!listId) return;

  const list = await getShoppingList(me.householdId, listId);
  if (!list) return;

  const modeRaw = String(fd.get("mode") ?? "text");
  const mode: "text" | "pdf" | "photo" =
    modeRaw === "pdf" ? "pdf" : modeRaw === "photo" ? "photo" : "text";

  const store = String(fd.get("store") ?? "").trim();
  const purchasedAt = parseDate(String(fd.get("purchasedAt") ?? "")) ?? Date.now();

  let raw = "";
  if (mode === "pdf") {
    const pdf = fd.get("pdf");
    if (pdf instanceof File && pdf.size > 0) {
      try {
        raw = await extractPdfText(pdf);
      } catch {
        raw = "";
      }
    }
  } else {
    raw = String(fd.get("raw") ?? "");
  }

  const lines = parseReceiptText(raw);

  const purchase: Purchase = {
    id: newId(),
    store: store || "Ismeretlen bolt",
    purchasedAt,
    total: sumTotal(lines),
    source: mode,
    raw,
    lines,
    createdAt: Date.now(),
  };

  await savePurchase(me.householdId, purchase);
  revalidatePath("/vasarlas");
  revalidatePath(`/bevasarlas/${listId}`);
  redirect(`/bevasarlas/${listId}/parosit/${purchase.id}`);
}

/**
 * Finalize matching. Reads per-line mapping and per-line spájz settings, then:
 *   - marks list items as checked when matched
 *   - adds pantry items (with price history) for lines that go to spájz
 *   - saves the updated shopping list
 */
export async function finalizeMatchAction(fd: FormData) {
  const me = await requireUser();
  const listId = String(fd.get("listId") ?? "").trim();
  const purchaseId = String(fd.get("purchaseId") ?? "").trim();
  if (!listId || !purchaseId) return;

  const [list, purchase] = await Promise.all([
    getShoppingList(me.householdId, listId),
    getPurchase(me.householdId, purchaseId),
  ]);
  if (!list || !purchase) return;

  const count = purchase.lines.length;
  const updatedItems: ShoppingListItem[] = list.items.map((it) => ({ ...it }));
  const now = Date.now();

  for (let i = 0; i < count; i++) {
    const line = purchase.lines[i];
    const mapping = String(fd.get(`match-${i}`) ?? "skip");
    if (mapping === "skip") continue;

    const addToPantry = String(fd.get(`addToPantry-${i}`) ?? "") === "on";
    const locationRaw = String(fd.get(`locationId-${i}`) ?? "").trim();
    const locationId = locationRaw || null;
    const expiresAt = parseDate(String(fd.get(`expiresAt-${i}`) ?? ""));

    if (mapping !== "none") {
      const idx = Number(mapping);
      if (Number.isFinite(idx) && idx >= 0 && idx < updatedItems.length) {
        updatedItems[idx] = { ...updatedItems[idx], checked: true };
      }
    }

    if (addToPantry && locationId) {
      const qty = Number.isFinite(line.qty) && line.qty > 0 ? line.qty : 1;
      const unit: Unit = line.unit;
      await savePantryItem(me.householdId, {
        name: line.name,
        qty,
        unit,
        locationId,
        expiresAt,
        price: Number.isFinite(line.total) ? Math.round(line.total) : null,
        note: "",
        boughtAt: purchase.purchasedAt,
      });
      const entry = {
        price: Math.round(line.unitPrice || line.total || 0),
        qty,
        unit,
        ts: now,
      };
      const histKey = key.priceHistory(me.householdId, slug(line.name));
      await redis.lpush(histKey, JSON.stringify(entry));
      await redis.ltrim(histKey, 0, 49);
    }
  }

  const allChecked =
    updatedItems.length > 0 &&
    updatedItems.every((it) => it.checked || it.need === 0);
  const next: ShoppingList = {
    ...list,
    items: updatedItems,
    completedAt: allChecked ? list.completedAt ?? now : list.completedAt,
  };
  await saveShoppingList(me.householdId, next);

  revalidatePath(`/bevasarlas/${listId}`);
  revalidatePath("/bevasarlas");
  revalidatePath("/spajz");
  redirect(`/bevasarlas/${listId}`);
}
