"use server";

import { requireUser } from "@/lib/auth";
import {
  getNote,
  saveNote,
  deleteNote,
  verifySurprisePassword,
} from "@/lib/data";
import { getSession } from "@/lib/session";
import { newId } from "@/lib/redis";
import { sanitizeRichText, toggleChecklistItem } from "@/lib/richtext";
import type { Note } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseTags(raw: string): string[] {
  return raw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);
}

export async function saveNoteAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;

  const inputId = String(fd.get("id") ?? "").trim() || undefined;
  const title = String(fd.get("title") ?? "").trim();
  const body = sanitizeRichText(String(fd.get("body") ?? ""));
  // Teljesen üres jegyzetet nem mentünk (mint a Keep).
  if (!title && !body) {
    if (inputId) redirect(`/jegyzetek/${inputId}`);
    redirect("/jegyzetek");
  }

  const id = inputId ?? newId();
  const existing = inputId ? await getNote(hh, inputId) : null;

  const reminderRaw = Number(fd.get("reminderAt") ?? 0);
  const reminderAt =
    Number.isFinite(reminderRaw) && reminderRaw > 0 ? Math.round(reminderRaw) : null;
  // Új időpont → az emlékeztető megint aktív.
  const reminderDone =
    reminderAt !== null && existing?.reminderAt === reminderAt
      ? existing.reminderDone
      : false;

  const now = Date.now();
  const note: Note = {
    id,
    title,
    body,
    color: String(fd.get("color") ?? "").trim() || "amber",
    tags: parseTags(String(fd.get("tags") ?? "")),
    pinned: String(fd.get("pinned") ?? "") === "1",
    reminderAt,
    reminderDone,
    ownerId: String(fd.get("ownerId") ?? "").trim() || null,
    surpriseFor: String(fd.get("surpriseFor") ?? "").trim() || null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };

  await saveNote(hh, note);
  revalidatePath("/jegyzetek");
  revalidatePath(`/jegyzetek/${id}`);
  revalidatePath("/");
  redirect("/jegyzetek");
}

// Egy pipálható sor átbillentése a kártyán / olvasó nézetben.
export async function toggleNoteCheckAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const index = Number(fd.get("index") ?? -1);
  if (!id || !Number.isInteger(index) || index < 0) return;

  const note = await getNote(me.householdId, id);
  if (!note) return;
  // Ami elrejtve van előlem, azon nem pipálok.
  if (note.surpriseFor === me.userId) {
    const session = await getSession();
    if (!session.surpriseUnlocked) return;
  }

  const body = toggleChecklistItem(note.body, index);
  if (body === note.body) return;
  await saveNote(me.householdId, { ...note, body, updatedAt: Date.now() });
  revalidatePath("/jegyzetek");
  revalidatePath(`/jegyzetek/${id}`);
}

export async function toggleNotePinAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const note = await getNote(me.householdId, id);
  if (!note) return;
  await saveNote(me.householdId, {
    ...note,
    pinned: !note.pinned,
    updatedAt: Date.now(),
  });
  revalidatePath("/jegyzetek");
}

// Emlékeztető elintézve / újra aktív.
export async function setReminderDoneAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const note = await getNote(me.householdId, id);
  if (!note) return;
  const done = String(fd.get("done") ?? "1") === "1";
  await saveNote(me.householdId, { ...note, reminderDone: done });
  revalidatePath("/jegyzetek");
  revalidatePath("/");
}

// Emlékeztető halasztása (perc alapon: 60 = 1 óra, 1440 = holnap ilyenkor).
export async function snoozeReminderAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const minutes = Number(fd.get("minutes") ?? 0);
  if (!id || !Number.isFinite(minutes) || minutes <= 0) return;
  const note = await getNote(me.householdId, id);
  if (!note) return;
  await saveNote(me.householdId, {
    ...note,
    reminderAt: Date.now() + minutes * 60_000,
    reminderDone: false,
  });
  revalidatePath("/jegyzetek");
  revalidatePath("/");
}

export async function deleteNoteAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteNote(me.householdId, id);
  revalidatePath("/jegyzetek");
  revalidatePath("/");
  redirect("/jegyzetek");
}

// Törlés a listáról (nincs redirect).
export async function deleteNoteFromListAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteNote(me.householdId, id);
  revalidatePath("/jegyzetek");
  revalidatePath("/");
}

// Meglepetés feloldása a közös háztartás-jelszóval (munkamenetre szól).
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
  revalidatePath("/jegyzetek");
  revalidatePath("/", "layout");
  return { ok: true };
}
