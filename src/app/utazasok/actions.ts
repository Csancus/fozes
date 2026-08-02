"use server";

import { requireUser } from "@/lib/auth";
import { saveTrip, saveTripDays, deleteTrip } from "@/lib/data";
import { sanitizeRichText } from "@/lib/richtext";
import type { TripDay } from "@/lib/types";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createTripAction(fd: FormData) {
  const me = await requireUser();
  const name = String(fd.get("name") ?? "").trim();
  if (!name) return;
  const now = new Date();
  const yearRaw = Number(String(fd.get("year") ?? ""));
  const year =
    Number.isFinite(yearRaw) && yearRaw > 1990 && yearRaw < 3000
      ? Math.round(yearRaw)
      : now.getFullYear();

  const trip = await saveTrip(me.householdId, {
    name,
    year,
    destination: String(fd.get("destination") ?? "").trim(),
    startDate: String(fd.get("startDate") ?? "").trim(),
    endDate: String(fd.get("endDate") ?? "").trim(),
    note: "",
    planNote: sanitizeRichText(String(fd.get("planNote") ?? "")),
    imageUrl: null,
  });
  revalidatePath("/utazasok");
  revalidatePath("/");
  redirect(`/utazasok/${trip.id}`);
}

export async function updateTripAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "").trim();
  const name = String(fd.get("name") ?? "").trim();
  if (!id || !name) return;
  const yearRaw = Number(String(fd.get("year") ?? ""));
  const year =
    Number.isFinite(yearRaw) && yearRaw > 1990 && yearRaw < 3000
      ? Math.round(yearRaw)
      : new Date().getFullYear();

  await saveTrip(me.householdId, {
    id,
    name,
    year,
    destination: String(fd.get("destination") ?? "").trim(),
    startDate: String(fd.get("startDate") ?? "").trim(),
    endDate: String(fd.get("endDate") ?? "").trim(),
    // A régi sima jegyzet beolvadt a rich-text jegyzetbe (a form már azt küldi).
    note: "",
    planNote: sanitizeRichText(String(fd.get("planNote") ?? "")),
    imageUrl: null,
  });
  revalidatePath("/utazasok");
  revalidatePath(`/utazasok/${id}`);
  revalidatePath(`/utazasok/${id}/terv`);
  redirect(`/utazasok/${id}`);
}

export async function saveTripDaysAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "").trim();
  if (!id) return;
  let days: TripDay[] = [];
  try {
    const parsed = JSON.parse(String(fd.get("days") ?? "[]"));
    if (Array.isArray(parsed)) days = parsed;
  } catch {
    days = [];
  }
  const planNote = sanitizeRichText(String(fd.get("planNote") ?? ""));
  await saveTripDays(me.householdId, id, days, planNote);
  revalidatePath(`/utazasok/${id}/terv`);
  revalidatePath(`/utazasok/${id}`);
}

export async function deleteTripAction(fd: FormData) {
  const me = await requireUser();
  const id = String(fd.get("id") ?? "").trim();
  if (!id) return;
  await deleteTrip(me.householdId, id);
  revalidatePath("/utazasok");
  revalidatePath("/");
  redirect("/utazasok");
}
