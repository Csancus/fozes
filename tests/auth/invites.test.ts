import { describe, expect, it } from "vitest";
import { fakeRedis } from "../support/fake-redis";
import {
  consumeInvite,
  createInvite,
  getInvite,
  INVITE_TTL_DAYS,
  listInvites,
  revokeInvite,
} from "@/lib/invites";

// Story 2.2 – lejáró, egyszer használatos, visszavonható meghívók.
describe("Story 2.2 – meghívók", () => {
  it("AC1: a meghívó token hosszú, kitalálhatatlan, és nem a háztartás azonosítója", async () => {
    const inv = await createInvite("hh-1", "owner-1");
    expect(inv.token.length).toBeGreaterThanOrEqual(32);
    expect(inv.token).not.toContain("hh-1");
    expect(await getInvite(inv.token)).toMatchObject({ householdId: "hh-1", createdBy: "owner-1" });
  });

  it(`AC2: ${INVITE_TTL_DAYS} nap után lejár`, async () => {
    const t0 = Date.now();
    fakeRedis.now = () => t0;
    const inv = await createInvite("hh-1", "owner-1", t0);
    expect(inv.expiresAt - inv.createdAt).toBe(INVITE_TTL_DAYS * 86_400_000);
    fakeRedis.now = () => t0 + INVITE_TTL_DAYS * 86_400_000 - 1000;
    expect(await getInvite(inv.token)).not.toBeNull();
    fakeRedis.now = () => t0 + INVITE_TTL_DAYS * 86_400_000 + 1000;
    expect(await getInvite(inv.token)).toBeNull();
    expect(await listInvites("hh-1")).toEqual([]);
  });

  it("AC3: egyszer használható – második felhasználás null", async () => {
    const inv = await createInvite("hh-1", "owner-1");
    expect((await consumeInvite(inv.token))?.householdId).toBe("hh-1");
    expect(await consumeInvite(inv.token)).toBeNull();
    expect(await listInvites("hh-1")).toEqual([]);
  });

  it("AC4: visszavonható, de csak a saját háztartás meghívója", async () => {
    const inv = await createInvite("hh-1", "owner-1");
    expect(await revokeInvite("hh-2", inv.token)).toBe(false);
    expect(await getInvite(inv.token)).not.toBeNull();
    expect(await revokeInvite("hh-1", inv.token)).toBe(true);
    expect(await consumeInvite(inv.token)).toBeNull();
  });

  it("AC5: az aktív meghívók listája háztartásonként külön, legújabb elöl", async () => {
    const a = await createInvite("hh-1", "o", 1000);
    const b = await createInvite("hh-1", "o", 2000);
    await createInvite("hh-2", "x", 3000);
    expect((await listInvites("hh-1")).map((i) => i.token)).toEqual([b.token, a.token]);
  });

  it("üres vagy ismeretlen token nem érvényes", async () => {
    expect(await getInvite("")).toBeNull();
    expect(await consumeInvite("nincs-ilyen")).toBeNull();
  });
});
