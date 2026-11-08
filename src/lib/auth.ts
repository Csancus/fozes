import bcrypt from "bcryptjs";
import { cache } from "react";
import { redirect } from "next/navigation";
import { redis, key, newId } from "./redis";
import { getSession, type SessionData } from "./session";
import type { User, Household } from "./types";

/** Új jelszavaknál (regisztráció, csere) a minimum hossz. A régi jelszavak maradnak. */
export const MIN_PASSWORD_LENGTH = 8;

// Ha nincs ilyen user, akkor is lefut egy bcrypt-összehasonlítás, hogy a
// válaszidőből ne derüljön ki, létezik-e az email (Story 2.3).
const DUMMY_HASH = "$2b$10$AmRYZ.0LyEaDC.UUY/1PUeRBWYgDBGM/yaB1Hn8UHQc3vsFmSRuTO";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export function normalizeEmail(email: string): string {
  return email.toLowerCase().trim();
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const id = await redis.get<string>(key.userByEmail(normalizeEmail(email)));
  if (!id) return null;
  return redis.get<User>(key.user(id));
}

export async function getUser(id: string): Promise<User | null> {
  return redis.get<User>(key.user(id));
}

/** Email + jelszó ellenőrzés. Nem árulja el, melyik volt hibás. */
export async function authenticate(email: string, password: string): Promise<User | null> {
  const user = await getUserByEmail(email);
  const ok = await verifyPassword(password, user?.passwordHash ?? DUMMY_HASH);
  return user && ok ? user : null;
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  /** Csak érvényes, már felhasznált meghívóból jöhet (Story 2.2). */
  joinHouseholdId?: string;
}) {
  const email = normalizeEmail(input.email);
  const exists = await redis.get(key.userByEmail(email));
  if (exists) throw new Error("Ez az email már regisztrált.");

  const userId = newId();
  let householdId = input.joinHouseholdId;

  if (!householdId) {
    householdId = await createHousehold(userId, input.name.trim());
  }

  const user: User = {
    id: userId,
    email,
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    householdId,
    createdAt: Date.now(),
    sessionVersion: 0,
  };

  await redis.set(key.user(userId), user);
  await redis.set(key.userByEmail(email), userId);
  await redis.sadd(key.householdMembers(householdId), userId);

  return user;
}

async function createHousehold(ownerId: string, ownerName: string): Promise<string> {
  const id = newId();
  const hh: Household = {
    id,
    name: `${ownerName} háztartása`,
    ownerId,
    createdAt: Date.now(),
  };
  await redis.set(key.household(id), hh);
  return id;
}

/** Új jelszó + minden meglévő session érvénytelenítése (Story 2.4). */
export async function setUserPassword(userId: string, password: string): Promise<User> {
  const user = await getUser(userId);
  if (!user) throw new Error("Nincs ilyen felhasználó.");
  const updated: User = {
    ...user,
    passwordHash: await hashPassword(password),
    sessionVersion: (user.sessionVersion ?? 0) + 1,
  };
  await redis.set(key.user(userId), updated);
  return updated;
}

/**
 * Tag eltávolítása a háztartásból (Story 2.2). Csak a tulajdonos teheti, saját
 * magát nem. Az eltávolított tag kap egy új, üres háztartást, és minden
 * sessionje érvénytelen lesz.
 */
export async function removeMember(
  householdId: string,
  actorId: string,
  memberId: string
): Promise<void> {
  const hh = await redis.get<Household>(key.household(householdId));
  if (!hh) throw new Error("Nincs ilyen háztartás.");
  if (hh.ownerId !== actorId) throw new Error("Csak a háztartás tulajdonosa távolíthat el tagot.");
  if (memberId === actorId) throw new Error("Saját magadat nem távolíthatod el.");
  const member = await getUser(memberId);
  if (!member || member.householdId !== householdId) throw new Error("Ez a felhasználó nem tagja a háztartásnak.");

  await redis.srem(key.householdMembers(householdId), memberId);
  const newHh = await createHousehold(memberId, member.name);
  await redis.sadd(key.householdMembers(newHh), memberId);
  await redis.set(key.user(memberId), {
    ...member,
    householdId: newHh,
    sessionVersion: (member.sessionVersion ?? 0) + 1,
  } satisfies User);
}

/** A session akkor érvényes, ha a user létezik, ugyanabban a háztartásban van, és nem cserélt azóta jelszót. */
export function isSessionValid(session: SessionData, user: User | null): user is User {
  return (
    !!user &&
    !!session.userId &&
    user.id === session.userId &&
    user.householdId === session.householdId &&
    (user.sessionVersion ?? 0) === (session.sv ?? 0)
  );
}

// Kérésenként egyszer olvassuk a usert, akárhányszor hívják a requireUser-t.
const loadUser = cache(async (id: string) => getUser(id));

export async function requireUser() {
  const session = await getSession();
  if (!session.userId || !session.householdId) {
    redirect("/belepes");
  }
  const user = await loadUser(session.userId);
  if (!isSessionValid(session, user)) {
    redirect("/belepes");
  }
  return {
    userId: session.userId!,
    householdId: session.householdId!,
    email: session.email!,
    name: session.name!,
  };
}

export async function currentUser() {
  const session = await getSession();
  if (!session.userId) return null;
  const user = await loadUser(session.userId);
  if (!isSessionValid(session, user)) return null;
  return {
    userId: session.userId,
    householdId: session.householdId!,
    email: session.email!,
    name: session.name!,
  };
}
