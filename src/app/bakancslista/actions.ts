"use server";

import { requireUser } from "@/lib/auth";
import {
  getSavedItem,
  saveSavedItem,
  deleteSavedItem,
  setSavedFile,
  deleteSavedFile,
} from "@/lib/data";
import { newId } from "@/lib/redis";
import type {
  SavedItem,
  SavedKind,
  SavedLink,
  SavedFileMeta,
} from "@/lib/types";
import { SAVED_KINDS } from "@/lib/types";
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
  const kindRaw = String(fd.get("kind") ?? "egyeb") as SavedKind;
  const kind = SAVED_KINDS.includes(kindRaw) ? kindRaw : "egyeb";
  const note = String(fd.get("note") ?? "").trim();
  const location = String(fd.get("location") ?? "").trim();
  const imageUrl = String(fd.get("imageUrl") ?? "").trim() || null;
  const tags = String(fd.get("tags") ?? "")
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
  const links = parseLinks(String(fd.get("links") ?? "[]"));
  const incoming = parseFiles(String(fd.get("files") ?? "[]"));

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
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await saveSavedItem(hh, item);
  revalidatePath("/bakancslista");
  revalidatePath("/");
  redirect(`/bakancslista/${id}`);
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
