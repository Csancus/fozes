"use server";

import { revalidatePath } from "next/cache";
import { requireUser, removeMember, getUser } from "@/lib/auth";
import { redis, key } from "@/lib/redis";
import { createInvite, revokeInvite } from "@/lib/invites";
import { createResetToken } from "@/lib/password-reset";
import { baseUrl } from "@/lib/request";
import type { Household } from "@/lib/types";

async function requireOwner() {
  const me = await requireUser();
  const hh = await redis.get<Household>(key.household(me.householdId));
  if (!hh || hh.ownerId !== me.userId) {
    throw new Error("Ezt csak a háztartás tulajdonosa teheti meg.");
  }
  return me;
}

// Story 2.2 – új, 7 napig érvényes, egyszer használatos meghívó.
export async function createInviteAction(): Promise<{ url: string; expiresAt: number }> {
  const me = await requireOwner();
  const inv = await createInvite(me.householdId, me.userId);
  revalidatePath("/csalad");
  return { url: `${await baseUrl()}/belepes?mode=reg&inv=${inv.token}`, expiresAt: inv.expiresAt };
}

export async function revokeInviteAction(token: string): Promise<void> {
  const me = await requireOwner();
  await revokeInvite(me.householdId, token);
  revalidatePath("/csalad");
}

export async function removeMemberAction(memberId: string): Promise<void> {
  const me = await requireOwner();
  await removeMember(me.householdId, me.userId, memberId);
  revalidatePath("/csalad");
}

// Story 2.4 – a tulajdonos 1 órás, egyszer használatos jelszó-linket generál egy tagnak.
export async function ownerResetLinkAction(memberId: string): Promise<{ url: string }> {
  const me = await requireOwner();
  const member = await getUser(memberId);
  if (!member || member.householdId !== me.householdId) {
    throw new Error("Ez a felhasználó nem tagja a háztartásnak.");
  }
  const token = await createResetToken(member.id, "owner");
  return { url: `${await baseUrl()}/jelszo-csere?t=${token}` };
}
