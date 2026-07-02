import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { redis, key, newId } from "./redis";
import { getSession } from "./session";
import type { User, Household } from "./types";

export async function hashPassword(pw: string) {
  return bcrypt.hash(pw, 10);
}

export async function verifyPassword(pw: string, hash: string) {
  return bcrypt.compare(pw, hash);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const id = await redis.get<string>(key.userByEmail(email));
  if (!id) return null;
  return redis.get<User>(key.user(id));
}

export async function createUser(input: {
  email: string;
  password: string;
  name: string;
  joinHouseholdId?: string;
}) {
  const email = input.email.toLowerCase().trim();
  const exists = await redis.get(key.userByEmail(email));
  if (exists) throw new Error("Ez az email már regisztrált.");

  const userId = newId();
  let householdId = input.joinHouseholdId;

  if (!householdId) {
    householdId = newId();
    const hh: Household = {
      id: householdId,
      name: `${input.name} háztartása`,
      ownerId: userId,
      createdAt: Date.now(),
    };
    await redis.set(key.household(householdId), hh);
  }

  const user: User = {
    id: userId,
    email,
    name: input.name.trim(),
    passwordHash: await hashPassword(input.password),
    householdId,
    createdAt: Date.now(),
  };

  await redis.set(key.user(userId), user);
  await redis.set(key.userByEmail(email), userId);
  await redis.sadd(key.householdMembers(householdId), userId);

  return user;
}

export async function requireUser() {
  const session = await getSession();
  if (!session.userId || !session.householdId) {
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
  return {
    userId: session.userId,
    householdId: session.householdId!,
    email: session.email!,
    name: session.name!,
  };
}
