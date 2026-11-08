import { redis } from "./redis";
import { newToken } from "./invites";

// Egyszer használatos, 1 óráig érvényes jelszó-visszaállító tokenek (Story 2.4).
// pwreset:<token> → { userId, createdAt, via }

export const RESET_TTL_SEC = 60 * 60;

export type ResetToken = {
  userId: string;
  createdAt: number;
  via: "email" | "owner";
};

const resetKey = (token: string) => `pwreset:${token}`;

export async function createResetToken(
  userId: string,
  via: ResetToken["via"],
  now = Date.now()
): Promise<string> {
  const token = newToken();
  await redis.set(resetKey(token), { userId, createdAt: now, via }, { ex: RESET_TTL_SEC });
  return token;
}

export async function peekResetToken(token: string): Promise<ResetToken | null> {
  if (!token) return null;
  return redis.get<ResetToken>(resetKey(token));
}

export async function consumeResetToken(token: string): Promise<ResetToken | null> {
  if (!token) return null;
  return redis.getdel<ResetToken>(resetKey(token));
}
