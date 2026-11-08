import { randomBytes } from "node:crypto";
import { redis } from "./redis";

// Lejáró, egyszer használatos, visszavonható meghívók (Story 2.2).
// invite:<token>              → Invite (TTL = lejárat)
// household:<id>:invites      → a háztartás aktív meghívó-tokenjei (set)

export const INVITE_TTL_DAYS = 7;

export type Invite = {
  token: string;
  householdId: string;
  createdBy: string;
  createdAt: number;
  expiresAt: number;
};

const inviteKey = (token: string) => `invite:${token}`;
const listKey = (householdId: string) => `household:${householdId}:invites`;

export function newToken(): string {
  return randomBytes(24).toString("base64url");
}

export async function createInvite(
  householdId: string,
  createdBy: string,
  now = Date.now()
): Promise<Invite> {
  const ttlSec = INVITE_TTL_DAYS * 24 * 60 * 60;
  const invite: Invite = {
    token: newToken(),
    householdId,
    createdBy,
    createdAt: now,
    expiresAt: now + ttlSec * 1000,
  };
  await redis.set(inviteKey(invite.token), invite, { ex: ttlSec });
  await redis.sadd(listKey(householdId), invite.token);
  return invite;
}

export async function getInvite(token: string): Promise<Invite | null> {
  if (!token) return null;
  return redis.get<Invite>(inviteKey(token));
}

/** A háztartás még érvényes meghívói; a lejártakat kitakarítja a listából. */
export async function listInvites(householdId: string): Promise<Invite[]> {
  const tokens = await redis.smembers(listKey(householdId));
  const out: Invite[] = [];
  for (const t of tokens) {
    const inv = await getInvite(t);
    if (inv) out.push(inv);
    else await redis.srem(listKey(householdId), t);
  }
  return out.sort((a, b) => b.createdAt - a.createdAt);
}

/** Csak a saját háztartás meghívója vonható vissza. */
export async function revokeInvite(householdId: string, token: string): Promise<boolean> {
  const inv = await getInvite(token);
  if (!inv || inv.householdId !== householdId) return false;
  await redis.del(inviteKey(token));
  await redis.srem(listKey(householdId), token);
  return true;
}

/** Felhasználja (törli) a meghívót; null, ha nem létezik / lejárt / már felhasznált. */
export async function consumeInvite(token: string): Promise<Invite | null> {
  if (!token) return null;
  const inv = await redis.getdel<Invite>(inviteKey(token));
  if (!inv) return null;
  await redis.srem(listKey(inv.householdId), token);
  return inv;
}
