"use server";

import { redirect } from "next/navigation";
import { MIN_PASSWORD_LENGTH, setUserPassword } from "@/lib/auth";
import { consumeResetToken, peekResetToken } from "@/lib/password-reset";
import { getSession } from "@/lib/session";

// Story 2.4 – új jelszó beállítása egyszer használatos tokennel.
export async function resetPassword(formData: FormData) {
  const token = String(formData.get("t") ?? "");
  const password = String(formData.get("password") ?? "");
  const password2 = String(formData.get("password2") ?? "");
  const back = (msg: string): never =>
    redirect(`/jelszo-csere?t=${encodeURIComponent(token)}&err=${encodeURIComponent(msg)}`);

  if (password.length < MIN_PASSWORD_LENGTH) back(`A jelszó legalább ${MIN_PASSWORD_LENGTH} karakter legyen.`);
  if (password !== password2) back("A két jelszó nem egyezik.");
  if (!(await peekResetToken(token))) back("A link lejárt vagy már felhasználták.");

  const t = await consumeResetToken(token);
  if (!t) return back("A link lejárt vagy már felhasználták.");
  await setUserPassword(t.userId, password);

  // Az ebben a böngészőben lévő régi session is megszűnik.
  const session = await getSession();
  session.destroy();

  redirect(`/belepes?ok=${encodeURIComponent("Az új jelszavad beállítva. Lépj be vele.")}`);
}
