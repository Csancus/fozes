"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { createUser, getUserByEmail, verifyPassword } from "@/lib/auth";

function fail(msg: string): never {
  redirect(`/belepes?err=${encodeURIComponent(msg)}`);
}
function failReg(msg: string, hh?: string): never {
  const hhq = hh ? `&hh=${encodeURIComponent(hh)}` : "";
  redirect(`/belepes?mode=reg&err=${encodeURIComponent(msg)}${hhq}`);
}

export async function login(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");

  if (!email || !password) fail("Hiányzó email vagy jelszó.");

  const user = await getUserByEmail(email);
  if (!user) fail("Nincs ilyen email.");
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) fail("Hibás jelszó.");

  const session = await getSession();
  session.userId = user.id;
  session.householdId = user.householdId;
  session.email = user.email;
  session.name = user.name;
  await session.save();

  redirect("/");
}

export async function register(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const hh = String(formData.get("hh") ?? "").trim();

  if (!email || !password || !name) failReg("Töltsd ki az összes mezőt.", hh);
  if (password.length < 6) failReg("A jelszó min. 6 karakter.", hh);

  let user;
  try {
    user = await createUser({
      email,
      password,
      name,
      joinHouseholdId: hh || undefined,
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Ismeretlen hiba.";
    failReg(msg, hh);
  }

  const session = await getSession();
  session.userId = user.id;
  session.householdId = user.householdId;
  session.email = user.email;
  session.name = user.name;
  await session.save();

  redirect("/");
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/belepes");
}
