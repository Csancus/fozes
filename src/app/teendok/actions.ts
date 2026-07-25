"use server";

import { requireUser } from "@/lib/auth";
import {
  getTask,
  saveTask,
  deleteTask,
  setTaskFile,
  deleteTaskFile,
  createGoal,
  updateGoal,
  deleteGoal,
} from "@/lib/data";
import { offloadImage } from "@/lib/r2";
import { newId } from "@/lib/redis";
import type { Task, Subtask, TaskFileMeta } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

type IncomingFile = TaskFileMeta & { dataUrl?: string };

function parseSubtasks(raw: string): Subtask[] {
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr
      .map((s) => ({
        id: String(s?.id ?? "") || newId(),
        title: String(s?.title ?? "").trim(),
        done: Boolean(s?.done),
      }))
      .filter((s) => s.title);
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

export async function saveTaskAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;

  const inputId = String(fd.get("id") ?? "").trim() || undefined;
  const title = String(fd.get("title") ?? "").trim();
  if (!title) return;

  const description = String(fd.get("description") ?? "").trim();
  const ownerId = String(fd.get("ownerId") ?? "").trim() || null;
  const dueDate = String(fd.get("dueDate") ?? "").trim() || null;
  const projectId = String(fd.get("projectId") ?? "").trim() || null;
  const subtasks = parseSubtasks(String(fd.get("subtasks") ?? "[]"));
  const incoming = parseFiles(String(fd.get("files") ?? "[]"));

  const id = inputId ?? newId();
  const existing = inputId ? await getTask(hh, inputId) : null;

  const imageUrl = await offloadImage(
    String(fd.get("imageUrl") ?? ""),
    `teendok/${hh}`
  );

  // Fájl-blobok: újakat kiírjuk, a törölteket kitakarítjuk.
  const keptMeta: TaskFileMeta[] = [];
  for (const f of incoming) {
    if (f.dataUrl) await setTaskFile(hh, id, f.id, f.dataUrl);
    keptMeta.push({ id: f.id, name: f.name, mime: f.mime, size: f.size });
  }
  if (existing) {
    const keptIds = new Set(keptMeta.map((f) => f.id));
    for (const old of existing.files) {
      if (!keptIds.has(old.id)) await deleteTaskFile(hh, id, old.id);
    }
  }

  const now = Date.now();
  const task: Task = {
    id,
    title,
    description,
    ownerId,
    dueDate,
    projectId,
    imageUrl,
    files: keptMeta,
    subtasks,
    done: existing?.done ?? false,
    doneAt: existing?.doneAt ?? null,
    createdAt: existing?.createdAt ?? now,
    updatedAt: now,
  };
  await saveTask(hh, task);
  revalidatePath("/teendok");
  revalidatePath("/");
  redirect(`/teendok/${id}`);
}

export async function toggleTaskDoneAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const task = await getTask(me.householdId, id);
  if (!task) return;
  const done = !task.done;
  await saveTask(me.householdId, {
    ...task,
    done,
    doneAt: done ? Date.now() : null,
    updatedAt: Date.now(),
  });
  revalidatePath("/teendok");
  revalidatePath(`/teendok/${id}`);
  revalidatePath("/");
}

// Egy alteendő pipálása/visszavonása (detail oldalról).
export async function toggleSubtaskAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const subId = String(fd.get("subId") ?? "");
  if (!id || !subId) return;
  const task = await getTask(me.householdId, id);
  if (!task) return;
  const subtasks = task.subtasks.map((s) =>
    s.id === subId ? { ...s, done: !s.done } : s
  );
  await saveTask(me.householdId, { ...task, subtasks, updatedAt: Date.now() });
  revalidatePath(`/teendok/${id}`);
  revalidatePath("/teendok");
}

export async function deleteTaskAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteTask(me.householdId, id);
  revalidatePath("/teendok");
  revalidatePath("/");
  redirect("/teendok");
}

// Törlés a listáról (nincs redirect — a lista maga marad az aktuális oldalon).
export async function deleteTaskFromListAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteTask(me.householdId, id);
  revalidatePath("/teendok");
  revalidatePath("/");
}

type BatchTaskRow = {
  title: unknown;
  description: unknown;
  ownerId: unknown;
  dueDate: unknown;
  projectId: unknown;
};

// Több teendő egyszerre (táblázatos gyors felvitel).
export async function saveTasksBatchAction(fd: FormData) {
  const me = await requireUser();
  let rows: BatchTaskRow[] = [];
  try {
    const parsed = JSON.parse(String(fd.get("rows") ?? "[]"));
    if (Array.isArray(parsed)) rows = parsed;
  } catch {
    rows = [];
  }

  const now = Date.now();
  for (const r of rows) {
    const title = String(r.title ?? "").trim();
    if (!title) continue;
    const task: Task = {
      id: newId(),
      title,
      description: String(r.description ?? "").trim(),
      ownerId: String(r.ownerId ?? "").trim() || null,
      dueDate: String(r.dueDate ?? "").trim() || null,
      projectId: String(r.projectId ?? "").trim() || null,
      imageUrl: null,
      files: [],
      subtasks: [],
      done: false,
      doneAt: null,
      createdAt: now,
      updatedAt: now,
    };
    await saveTask(me.householdId, task);
  }
  revalidatePath("/teendok");
  revalidatePath("/");
  redirect("/teendok");
}

// ============ CÉLOK ============

export async function createGoalAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "amber").trim();
  if (!name) return;
  await createGoal(me.householdId, { name, color });
  revalidatePath("/teendok/beallitasok");
  revalidatePath("/koltsegek/beallitasok");
}

export async function updateGoalAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  const name = String(fd.get("name") ?? "").trim();
  const color = String(fd.get("color") ?? "amber").trim();
  if (!id || !name) return;
  await updateGoal(me.householdId, id, { name, color });
  revalidatePath("/teendok/beallitasok");
  revalidatePath("/koltsegek/beallitasok");
}

export async function deleteGoalAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteGoal(me.householdId, id);
  revalidatePath("/teendok/beallitasok");
  revalidatePath("/koltsegek/beallitasok");
}
