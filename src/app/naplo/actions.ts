"use server";

import { requireUser } from "@/lib/auth";
import {
  getJournalEntry,
  saveJournalEntryWithFiles,
  deleteJournalEntry,
  type JournalIncomingFile,
} from "@/lib/data";
import { newId } from "@/lib/redis";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseJournalPhotos(raw: string): string[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.map((p) => String(p ?? "").trim()).filter(Boolean);
  } catch {
    return [];
  }
}

function parseJournalFiles(raw: string): JournalIncomingFile[] {
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
        url: typeof f?.url === "string" ? f.url : null,
      }))
      .filter((f) => f.id);
  } catch {
    return [];
  }
}

export async function createJournalAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;

  const date = String(fd.get("date") ?? "").trim();
  if (!date) return;
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  const transcript = String(fd.get("transcript") ?? "").trim();
  const photos = parseJournalPhotos(String(fd.get("photos") ?? "[]"));
  const files = parseJournalFiles(String(fd.get("files") ?? "[]"));

  const now = Date.now();
  const entry = await saveJournalEntryWithFiles(
    hh,
    {
      id: newId(),
      date,
      title,
      body,
      transcript,
      savedItemId: null,
      createdAt: now,
      updatedAt: now,
    },
    { photos, files }
  );
  revalidatePath("/naplo");
  revalidatePath("/");
  redirect(`/naplo/${entry.id}`);
}

export async function updateJournalAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;

  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const existing = await getJournalEntry(hh, id);
  if (!existing) return;

  const date = String(fd.get("date") ?? "").trim() || existing.date;
  const title = String(fd.get("title") ?? "").trim();
  const body = String(fd.get("body") ?? "").trim();
  const transcript = String(fd.get("transcript") ?? "").trim();
  const photos = parseJournalPhotos(String(fd.get("photos") ?? "[]"));
  const files = parseJournalFiles(String(fd.get("files") ?? "[]"));

  await saveJournalEntryWithFiles(
    hh,
    {
      id,
      date,
      title,
      body,
      transcript,
      savedItemId: existing.savedItemId,
      createdAt: existing.createdAt,
      updatedAt: Date.now(),
    },
    { photos, files },
    existing
  );
  revalidatePath("/naplo");
  revalidatePath(`/naplo/${id}`);
  redirect(`/naplo/${id}`);
}

export async function deleteJournalAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteJournalEntry(me.householdId, id);
  revalidatePath("/naplo");
  revalidatePath("/");
  redirect("/naplo");
}
