"use server";

import { requireUser } from "@/lib/auth";
import { saveTrip, saveTripDays, deleteTrip } from "@/lib/data";
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
    note: String(fd.get("note") ?? "").trim(),
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
    note: String(fd.get("note") ?? "").trim(),
    imageUrl: null,
  });
  revalidatePath("/utazasok");
  revalidatePath(`/utazasok/${id}`);
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
  await saveTripDays(me.householdId, id, days);
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
