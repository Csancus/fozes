"use server";

import { requireUser } from "@/lib/auth";
import { createLocation, deleteLocation } from "@/lib/data";
import type { LocationKind } from "@/lib/types";
import { revalidatePath } from "next/cache";

export async function createLocationAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  const kind = String(fd.get("kind") ?? "custom") as LocationKind;
  if (!name) return;
  await createLocation(me.householdId, { name, kind });
  revalidatePath("/helyek");
  revalidatePath("/spajz");
}

export async function deleteLocationAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "");
  if (!id) return;
  await deleteLocation(me.householdId, id);
  revalidatePath("/helyek");
  revalidatePath("/spajz");
}
