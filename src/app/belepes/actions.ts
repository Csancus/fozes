"use server";

import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import {
  authenticate,
  createUser,
  getUserByEmail,
  MIN_PASSWORD_LENGTH,
  normalizeEmail,
} from "@/lib/auth";
import { consumeInvite, getInvite } from "@/lib/invites";
import { dailyRegistrationCap, hit, isLimited, LIMITS, resetLimit } from "@/lib/rate-limit";
import { createResetToken } from "@/lib/password-reset";
import { isMailConfigured, passwordResetEmail, sendMail } from "@/lib/mail";
import { baseUrl, clientIp } from "@/lib/request";
import type { User } from "@/lib/types";

const GENERIC_LOGIN_ERROR = "Hibás email vagy jelszó.";
const TOO_MANY = "Túl sok próbálkozás. Próbáld újra kb. 15 perc múlva.";

function fail(msg: string): never {
  redirect(`/belepes?err=${encodeURIComponent(msg)}`);
}
function failReg(msg: string, inv?: string): never {
  const q = inv ? `&inv=${encodeURIComponent(inv)}` : "";
  redirect(`/belepes?mode=reg&err=${encodeURIComponent(msg)}${q}`);
}

async function startSession(user: User) {
  const session = await getSession();
  session.userId = user.id;
  session.householdId = user.householdId;
  session.email = user.email;
  session.name = user.name;
  session.sv = user.sessionVersion ?? 0;
  session.surpriseUnlocked = undefined;
  await session.save();
}

// Story 2.3 – belépés próbálkozási limittel és semleges hibaüzenettel.
export async function login(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  if (!email || !password) fail("Hiányzó email vagy jelszó.");

  const ip = await clientIp();
  const ipBucket = `login:ip:${ip}`;
  const emailBucket = `login:email:${email}`;
  if (
    (await isLimited(ipBucket, LIMITS.loginIp.limit)) ||
    (await isLimited(emailBucket, LIMITS.loginEmail.limit))
  ) {
    fail(TOO_MANY);
  }

  const user = await authenticate(email, password);
  if (!user) {
    await hit(ipBucket, LIMITS.loginIp.limit, LIMITS.loginIp.windowSec);
    await hit(emailBucket, LIMITS.loginEmail.limit, LIMITS.loginEmail.windowSec);
    fail(GENERIC_LOGIN_ERROR);
  }

  await resetLimit(emailBucket);
  await startSession(user);
  redirect("/");
}

// Story 2.2 + 2.5 – regisztráció: nyitott, de limitekkel; meghívóval csatlakozás.
export async function register(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const password = String(formData.get("password") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const inv = String(formData.get("inv") ?? "").trim();
  const honeypot = String(formData.get("website") ?? "");

  // Botok kitöltik a rejtett mezőt – nekik ugyanaz a semleges hiba.
  if (honeypot) failReg("Nem sikerült a regisztráció. Próbáld újra.", inv);

  if (!email || !password || !name) failReg("Töltsd ki az összes mezőt.", inv);
  if (name.length > 60) failReg("A név legfeljebb 60 karakter lehet.", inv);
  if (password.length < MIN_PASSWORD_LENGTH)
    failReg(`A jelszó legalább ${MIN_PASSWORD_LENGTH} karakter legyen.`, inv);

  const ip = await clientIp();
  if (!(await hit(`reg:ip:${ip}`, LIMITS.registerIp.limit, LIMITS.registerIp.windowSec)).ok)
    failReg("Túl sok regisztráció erről a hálózatról. Próbáld újra később.", inv);
  const day = new Date().toISOString().slice(0, 10);
  if (!(await hit(`reg:day:${day}`, dailyRegistrationCap(), 24 * 60 * 60)).ok)
    failReg("Ma már nem lehet több fiókot létrehozni. Próbáld újra holnap.", inv);

  if (await getUserByEmail(email)) failReg("Ez az email már regisztrált.", inv);

  let joinHouseholdId: string | undefined;
  if (inv) {
    // Előbb ellenőrizzük, és csak sikeres validáció után használjuk fel.
    if (!(await getInvite(inv))) failReg("A meghívó lejárt vagy már felhasználták. Kérj újat.", inv);
    const used = await consumeInvite(inv);
    if (!used) failReg("A meghívó lejárt vagy már felhasználták. Kérj újat.", inv);
    joinHouseholdId = used.householdId;
  }

  let user: User;
  try {
    user = await createUser({ email, password, name, joinHouseholdId });
  } catch (e: unknown) {
    failReg(e instanceof Error ? e.message : "Ismeretlen hiba.");
  }

  await startSession(user);
  redirect("/");
}

// Story 2.4 – elfelejtett jelszó emailben (ha be van állítva a Resend).
// Mindig ugyanazt a választ adja, hogy ne derüljön ki, létezik-e a fiók.
export async function requestPasswordReset(formData: FormData) {
  const email = normalizeEmail(String(formData.get("email") ?? ""));
  const done = () =>
    redirect(
      `/belepes?mode=forgot&ok=${encodeURIComponent(
        "Ha létezik ilyen fiók, elküldtük a jelszó-visszaállító linket. Nézd meg a leveleidet (a spam mappát is)."
      )}`
    );
  if (!email) redirect(`/belepes?mode=forgot&err=${encodeURIComponent("Add meg az email-címed.")}`);
  if (!isMailConfigured()) done();

  const ip = await clientIp();
  const ipOk = (await hit(`forgot:ip:${ip}`, LIMITS.forgotIp.limit, LIMITS.forgotIp.windowSec)).ok;
  const emailOk = (await hit(`forgot:email:${email}`, LIMITS.forgotEmail.limit, LIMITS.forgotEmail.windowSec)).ok;
  if (!ipOk || !emailOk) done();

  const user = await getUserByEmail(email);
  if (user) {
    const token = await createResetToken(user.id, "email");
    const url = `${await baseUrl()}/jelszo-csere?t=${token}`;
    try {
      await sendMail({ to: user.email, ...passwordResetEmail(user.name, url) });
    } catch (e) {
      console.error("[password-reset] email küldés sikertelen", e);
    }
  }
  done();
}

export async function logout() {
  const session = await getSession();
  session.destroy();
  redirect("/belepes");
}
