import { createHmac, randomBytes, randomInt, timingSafeEqual } from "node:crypto";
import { redis } from "./redis";

// Story 2.7 – összeadós biztonsági kérdés a belépés / regisztráció / elfelejtett jelszó űrlapon.
// A feladatot a szerver írja alá (HMAC), így nem hamisítható; egy feladat csak egyszer használható
// (Redis SET NX), tehát egy egyszer megfejtett feladat nem küldhető be újra és újra.

const TTL_SEC = 30 * 60;

export type CaptchaChallenge = {
  a: number; // 1 jegyű
  b: number; // 2 jegyű
  token: string; // "a.b.lejárat.nonce.aláírás" – rejtett mezőben megy vissza
};

function secret(): string {
  return (
    process.env.CAPTCHA_SECRET ||
    process.env.SESSION_PASSWORD ||
    "dev-only-insecure-fallback-password-change-me-32ch"
  );
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

export function createCaptcha(now = Date.now()): CaptchaChallenge {
  const a = randomInt(1, 10);
  const b = randomInt(10, 100);
  const exp = Math.floor(now / 1000) + TTL_SEC;
  const nonce = randomBytes(9).toString("base64url");
  const payload = `${a}.${b}.${exp}.${nonce}`;
  return { a, b, token: `${payload}.${sign(payload)}` };
}

export type CaptchaResult = "ok" | "wrong" | "expired";

/** Ellenőrzi a választ. Sikeres ellenőrzés után a feladat felhasználtnak számít. */
export async function verifyCaptcha(
  token: string,
  answer: string,
  now = Date.now()
): Promise<CaptchaResult> {
  const parts = token.split(".");
  if (parts.length !== 5) return "wrong";
  const [as, bs, exps, nonce, sig] = parts;
  const payload = `${as}.${bs}.${exps}.${nonce}`;
  const expected = Buffer.from(sign(payload));
  const given = Buffer.from(sig);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return "wrong";
  if (Number(exps) * 1000 < now) return "expired";

  const n = Number(String(answer).trim());
  if (!Number.isInteger(n) || n !== Number(as) + Number(bs)) return "wrong";

  // Egyszer használható: ha már beküldték, lejártként kezeljük.
  const fresh = await redis.set(`captcha:used:${nonce}`, 1, { ex: TTL_SEC, nx: true });
  if (fresh === null) return "expired";
  return "ok";
}

export function captchaError(r: Exclude<CaptchaResult, "ok">): string {
  return r === "expired"
    ? "A biztonsági kérdés lejárt. Oldd meg az újat."
    : "Hibás válasz a biztonsági kérdésre.";
}
