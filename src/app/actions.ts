"use server";

import { requireUser } from "@/lib/auth";
import { seedExampleData } from "@/lib/seed";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function seedExampleDataAction() {
  const me = await requireUser();
  await seedExampleData(me.householdId);
  revalidatePath("/", "layout");
  redirect("/receptek");
}
