"use server";

import { requireUser } from "@/lib/auth";
import {
  getTask,
  listTasks,
  saveTask,
  deleteTask,
  setTaskFile,
  deleteTaskFile,
  createGoal,
  updateGoal,
  deleteGoal,
  createProject,
  getTaskList,
  listTaskLists,
  createTaskList,
  updateTaskList,
  deleteTaskList,
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
  const listId = String(fd.get("listId") ?? "").trim() || null;
  // Ha listához tartozik és nincs külön projekt megadva, a listáét örökli.
  const list = listId ? await getTaskList(hh, listId) : null;
  const projectId =
    String(fd.get("projectId") ?? "").trim() || list?.projectId || null;
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
    listId,
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
  if (listId) revalidatePath(`/teendok/listak/${listId}`);
  if (existing?.listId && existing.listId !== listId) {
    revalidatePath(`/teendok/listak/${existing.listId}`);
  }
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
  if (task.listId) revalidatePath(`/teendok/listak/${task.listId}`);
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
  if (task.listId) revalidatePath(`/teendok/listak/${task.listId}`);
}

export async function deleteTaskAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const task = await getTask(me.householdId, id);
  await deleteTask(me.householdId, id);
  revalidatePath("/teendok");
  revalidatePath("/");
  if (task?.listId) {
    revalidatePath(`/teendok/listak/${task.listId}`);
    redirect(`/teendok/listak/${task.listId}`);
  }
  redirect("/teendok");
}

// Törlés a listáról (nincs redirect — a lista maga marad az aktuális oldalon).
export async function deleteTaskFromListAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  const task = await getTask(me.householdId, id);
  await deleteTask(me.householdId, id);
  revalidatePath("/teendok");
  revalidatePath("/");
  if (task?.listId) revalidatePath(`/teendok/listak/${task.listId}`);
}

type BatchTaskRow = {
  title: unknown;
  description: unknown;
  ownerId: unknown;
  dueDate: unknown;
  projectId: unknown;
  listId?: unknown;
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
      listId: String(r.listId ?? "").trim() || null,
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

// ============ TEENDŐ-LISTÁK ============

// A lista „szülője": meglévő projekt, utazás, vagy egy most létrehozott
// teendő-projekt (scope="task"). A form egy mezőben küldi: parent =
// "" | "project:<id>" | "trip:<id>" | "new".
async function resolveParent(
  hh: string,
  fd: FormData
): Promise<{ projectId: string | null; tripId: string | null }> {
  const parent = String(fd.get("parent") ?? "").trim();
  if (parent === "new") {
    const name = String(fd.get("newProjectName") ?? "").trim();
    if (!name) return { projectId: null, tripId: null };
    const color = String(fd.get("color") ?? "sky").trim();
    const project = await createProject(hh, { name, color, scope: "task" });
    return { projectId: project.id, tripId: null };
  }
  if (parent.startsWith("project:")) {
    return { projectId: parent.slice("project:".length) || null, tripId: null };
  }
  if (parent.startsWith("trip:")) {
    return { projectId: null, tripId: parent.slice("trip:".length) || null };
  }
  return { projectId: null, tripId: null };
}

export async function createTaskListAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return;
  const color = String(fd.get("color") ?? "sky").trim();
  const description = String(fd.get("description") ?? "").trim();
  const { projectId, tripId } = await resolveParent(hh, fd);

  const list = await createTaskList(hh, {
    name,
    description,
    color,
    projectId,
    tripId,
  });

  // Kezdő tételek: soronként egy teendő.
  const titles = String(fd.get("items") ?? "")
    .split("\n")
    .map((s) => s.replace(/^[-*•\s]+/, "").trim())
    .filter(Boolean);
  const now = Date.now();
  for (const title of titles) {
    await saveTask(hh, {
      id: newId(),
      title,
      description: "",
      ownerId: null,
      dueDate: null,
      projectId,
      listId: list.id,
      imageUrl: null,
      files: [],
      subtasks: [],
      done: false,
      doneAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }

  revalidatePath("/teendok");
  revalidatePath("/");
  if (tripId) revalidatePath(`/utazasok/${tripId}`);
  redirect(`/teendok/listak/${list.id}`);
}

export async function updateTaskListAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;
  const id = String(fd.get("id") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim();
  if (!id || !name) return;
  const before = await getTaskList(hh, id);
  const { projectId, tripId } = await resolveParent(hh, fd);
  await updateTaskList(hh, id, {
    name,
    description: String(fd.get("description") ?? "").trim(),
    color: String(fd.get("color") ?? "sky").trim(),
    projectId,
    tripId,
  });
  revalidatePath("/teendok");
  revalidatePath(`/teendok/listak/${id}`);
  if (tripId) revalidatePath(`/utazasok/${tripId}`);
  if (before?.tripId && before.tripId !== tripId) {
    revalidatePath(`/utazasok/${before.tripId}`);
  }
  redirect(`/teendok/listak/${id}`);
}

export async function deleteTaskListAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;
  const id = String(fd.get("id") ?? "").trim();
  if (!id) return;
  const list = await getTaskList(hh, id);
  const withTasks = String(fd.get("withTasks") ?? "") === "1";
  await deleteTaskList(hh, id, { withTasks });
  revalidatePath("/teendok");
  revalidatePath("/");
  if (list?.tripId) revalidatePath(`/utazasok/${list.tripId}`);
  redirect("/teendok");
}

// Gyors hozzáadás a lista oldalán: egy soros teendő (több sor is beilleszthető).
export async function addTaskToListAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;
  const listId = String(fd.get("listId") ?? "").trim();
  const raw = String(fd.get("title") ?? "");
  if (!listId || !raw.trim()) return;
  const list = await getTaskList(hh, listId);
  if (!list) return;

  const titles = raw
    .split("\n")
    .map((s) => s.replace(/^[-*•\s]+/, "").trim())
    .filter(Boolean);
  const dueDate = String(fd.get("dueDate") ?? "").trim() || null;
  const ownerId = String(fd.get("ownerId") ?? "").trim() || null;
  const now = Date.now();
  for (const title of titles) {
    await saveTask(hh, {
      id: newId(),
      title,
      description: "",
      ownerId,
      dueDate,
      projectId: list.projectId,
      listId,
      imageUrl: null,
      files: [],
      subtasks: [],
      done: false,
      doneAt: null,
      createdAt: now,
      updatedAt: now,
    });
  }
  revalidatePath(`/teendok/listak/${listId}`);
  revalidatePath("/teendok");
  revalidatePath("/");
}

// Meglévő teendő beemelése egy listába / kivétele belőle.
export async function setTaskListAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;
  const id = String(fd.get("id") ?? "").trim();
  if (!id) return;
  const task = await getTask(hh, id);
  if (!task) return;
  const listId = String(fd.get("listId") ?? "").trim() || null;
  const list = listId ? await getTaskList(hh, listId) : null;
  await saveTask(hh, {
    ...task,
    listId,
    projectId: list?.projectId ?? task.projectId,
    updatedAt: Date.now(),
  });
  revalidatePath("/teendok");
  revalidatePath(`/teendok/${id}`);
  if (listId) revalidatePath(`/teendok/listak/${listId}`);
  if (task.listId) revalidatePath(`/teendok/listak/${task.listId}`);
}

// A lista összes nyitott teendője kész (vagy vissza).
export async function completeTaskListAction(fd: FormData) {
  const me = await requireUser();
  const hh = me.householdId;
  const listId = String(fd.get("listId") ?? "").trim();
  if (!listId) return;
  const undo = String(fd.get("undo") ?? "") === "1";
  const lists = await listTaskLists(hh);
  if (!lists.some((l) => l.id === listId)) return;
  const all = await listTasks(hh);
  const now = Date.now();
  await Promise.all(
    all
      .filter((t) => t.listId === listId && t.done === undo)
      .map((t) =>
        saveTask(hh, {
          ...t,
          done: !undo,
          doneAt: undo ? null : now,
          updatedAt: now,
        })
      )
  );
  revalidatePath(`/teendok/listak/${listId}`);
  revalidatePath("/teendok");
  revalidatePath("/");
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
