"use server";

import { requireUser } from "@/lib/auth";
import {
  getSavedItem,
  saveSavedItem,
  deleteSavedItem,
  setSavedFile,
  deleteSavedFile,
  setSurprisePassword,
  verifySurprisePassword,
  setSurpriseForItems,
  createSavedType,
} from "@/lib/data";
import { getSession } from "@/lib/session";
import { newId } from "@/lib/redis";
import type {
  SavedItem,
  SavedLink,
  SavedFileMeta,
} from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type IncomingFile = SavedFileMeta & { dataUrl?: string };

function parseLinks(raw: string): SavedLink[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((l) => ({
        url: String(l?.url ?? "").trim(),
        label: String(l?.label ?? "").trim(),
      }))
      .filter((l) => l.url);
  } catch {
    return [];
  }
}

function parseFiles(raw: string): IncomingFile[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((f) => ({
        id: String(f?.id ?? "") || newId(),
        name: String(f?.name ?? "fájl"),
        mime: String(f?.mime ?? "application/octet-stream"),
        size: Number(f?.size ?? 0) || 0,
        dataUrl: typeof f?.dataUrl === "string" ? f.dataUrl : undefined,
      }))
      .filter((f) => f.id);
  } catch {
    return [];
  }
}

export async function saveSavedAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;

  const inputId = String(fd.get("id") ?? "").trim() || undefined;
  const title = String(fd.get("title") ?? "").trim();
  // A kind mostantól típus-id (beépített vagy egyedi) — szabad szöveg, fallback "egyeb".
  const kind = String(fd.get("kind") ?? "").trim() || "egyeb";
  const note = String(fd.get("note") ?? "").trim();
  const location = String(fd.get("location") ?? "").trim();
  const imageUrl = String(fd.get("imageUrl") ?? "").trim() || null;
  const tags = String(fd.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const links = parseLinks(String(fd.get("links") ?? "[]"));
  const incoming = parseFiles(String(fd.get("files") ?? "[]"));
  const surpriseFor = String(fd.get("surpriseFor") ?? "").trim() || null;

  if (!title) return;

  const id = inputId ?? newId();
  const existing = inputId ? await getSavedItem(hh, inputId) : null;

  // Fájl-blobok: újakat kiírjuk, a törölteket kitakarítjuk.
  const keptMeta: SavedFileMeta[] = [];
  for (const f of incoming) {
    if (f.dataUrl) {
      await setSavedFile(hh, id, f.id, f.dataUrl);
    }
    keptMeta.push({ id: f.id, name: f.name, mime: f.mime, size: f.size });
  }
  if (existing) {
    const keptIds = new Set(keptMeta.map((f) => f.id));
    for (const old of existing.files) {
      if (!keptIds.has(old.id)) await deleteSavedFile(hh, id, old.id);
    }
  }

  const now = Date.now();
  const item: SavedItem = {
    id,
    title,
    kind,
    note,
    location,
    imageUrl,
    links,
    files: keptMeta,
    tags,
    done: existing?.done ?? false,
    doneAt: existing?.doneAt ?? null,
    surpriseFor,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await saveSavedItem(hh, item);
  revalidatePath("/bakancslista");
  revalidatePath("/");
  redirect(`/bakancslista/${id}`);
}

type BatchRow = {
  title?: string;
  kind?: string;
  location?: string;
  tags?: string;
  note?: string;
};

export async function saveSavedBatchAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;

  let rows: BatchRow[] = [];
  try {
    const parsed = JSON.parse(String(fd.get("rows") ?? "[]"));
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
    rows = [];
  }

  const now = Date.now();
  let saved = 0;

  for (const r of rows) {
    const title = String(r.title ?? "").trim();
    if (!title) continue;

    const kind = String(r.kind ?? "").trim() || "egyeb";
    const location = String(r.location ?? "").trim();
    const note = String(r.note ?? "").trim();
    const tags = String(r.tags ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    const item: SavedItem = {
      id: newId(),
      title,
      kind,
      note,
      location,
      imageUrl: null,
      links: [],
      files: [],
      tags,
      done: false,
      doneAt: null,
      surpriseFor: null,
      createdAt: now,
      updatedAt: now,
    };
    await saveSavedItem(hh, item);
    saved++;
  }

  if (saved > 0) {
    revalidatePath("/bakancslista");
    revalidatePath("/");
  }
  redirect("/bakancslista");
}

export async function toggleDoneAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const item = await getSavedItem(me.householdId, id);
  if (!item) return;
  const done = !item.done;
  await saveSavedItem(me.householdId, {
    ...item,
    done,
    doneAt: done ? Date.now() : null,
    updatedAt: Date.now(),
  });
  revalidatePath("/bakancslista");
  revalidatePath(`/bakancslista/${id}`);
  revalidatePath("/");
}

export async function deleteSavedAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteSavedItem(me.householdId, id);
  revalidatePath("/bakancslista");
  revalidatePath("/");
  redirect("/bakancslista");
}

// Új bakancslista-típus létrehozása a dropdownból (név + ikon + szín).
export async function createSavedTypeInline(input: {
  name: string;
  icon: string;
  color: string;
}) {
  const me = await requireUser();
  const name = input.name.trim();
  if (!name) return null;
  const type = await createSavedType(me.householdId, {
    name,
    icon: input.icon,
    color: input.color,
  });
  revalidatePath("/bakancslista");
  return type;
}

// ---- Meglepetés ----

// Közös háztartás-szintű Meglepetés-jelszó beállítása (Család oldal).
export async function setSurprisePasswordAction(fd: FormData) {
  const me = await requireUser();
  const pw = String(fd.get("password") ?? "");
  await setSurprisePassword(me.householdId, pw);
  revalidatePath("/csalad");
  revalidatePath("/bakancslista");
}

// A rejtett tételek feloldása erre a munkamenetre (helyes jelszó esetén).
export async function unlockSurpriseAction(
  _prev: { ok: boolean; error?: string } | undefined,
  fd: FormData
): Promise<{ ok: boolean; error?: string }> {
  const me = await requireUser();
  const pw = String(fd.get("password") ?? "");
  const ok = await verifySurprisePassword(me.householdId, pw);
  if (!ok) return { ok: false, error: "Hibás jelszó." };
  const session = await getSession();
  session.surpriseUnlocked = true;
  await session.save();
  revalidatePath("/bakancslista");
  revalidatePath("/", "layout");
  return { ok: true };
}

// Több tétel egyszerre elrejtése / láthatóvá tétele egy tag elől.
export async function setSurpriseBatchAction(fd: FormData) {
  const me = await requireUser();
  let ids: string[] = [];
  try {
    const parsed = JSON.parse(String(fd.get("ids") ?? "[]"));
    if (Array.isArray(parsed)) ids = parsed.map((x) => String(x)).filter(Boolean);
  } catch {
    ids = [];
  }
  const forRaw = String(fd.get("surpriseFor") ?? "").trim();
  const userId = forRaw || null;
  if (ids.length > 0) {
    await setSurpriseForItems(me.householdId, ids, userId);
    revalidatePath("/bakancslista");
    revalidatePath("/");
  }
}
