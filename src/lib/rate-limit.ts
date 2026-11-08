import { redis } from "./redis";

// Egyszerű fix ablakos számláló Redisben (Story 2.3, 2.5).
// `rl:<bucket>` kulcs, az első találatkor indul az ablak.

const k = (bucket: string) => `rl:${bucket}`;

/** Növeli a számlálót; ok=false, ha az új érték túllépi a limitet. */
export async function hit(
  bucket: string,
  limit: number,
  windowSec: number
): Promise<{ ok: boolean; count: number }> {
  const count = await redis.incr(k(bucket));
  if (count === 1) await redis.expire(k(bucket), windowSec);
  return { ok: count <= limit, count };
}

/** Elérte-e már a limitet (növelés nélkül). */
export async function isLimited(bucket: string, limit: number): Promise<boolean> {
  const v = await redis.get<number | string>(k(bucket));
  return Number(v ?? 0) >= limit;
}

export async function resetLimit(bucket: string): Promise<void> {
  await redis.del(k(bucket));
}

// Közös szabályok, hogy a tesztek és a kód ugyanazt használja.
export const LIMITS = {
  /** Sikertelen belépés IP-nként 15 percen belül. */
  loginIp: { limit: 20, windowSec: 15 * 60 },
  /** Sikertelen belépés email-címenként 15 percen belül. */
  loginEmail: { limit: 8, windowSec: 15 * 60 },
  /** Regisztráció IP-nként óránként. */
  registerIp: { limit: 5, windowSec: 60 * 60 },
  /** Elfelejtett jelszó kérés IP-nként óránként. */
  forgotIp: { limit: 5, windowSec: 60 * 60 },
  /** Elfelejtett jelszó kérés email-címenként óránként. */
  forgotEmail: { limit: 3, windowSec: 60 * 60 },
} as const;

/** Napi regisztrációs plafon az egész appra (env-ből felülírható). */
export function dailyRegistrationCap(): number {
  const n = Number(process.env.REGISTRATION_DAILY_CAP);
  return Number.isFinite(n) && n > 0 ? n : 30;
}
