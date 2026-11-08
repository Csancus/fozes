import { describe, expect, it } from "vitest";
import { redis, key } from "@/lib/redis";
import {
  authenticate,
  createUser,
  getUser,
  isSessionValid,
  removeMember,
  setUserPassword,
} from "@/lib/auth";
import type { Household } from "@/lib/types";

const pw = "titkos-jelszo-1";

// Story 2.1 (visszamenőleges) – regisztráció, háztartás, belépés.
describe("Story 2.1 – fiók és háztartás", () => {
  it("AC1: regisztrációkor saját háztartás jön létre, a user a tulajdonos", async () => {
    const u = await createUser({ email: "Anna@Example.com ", password: pw, name: "Anna" });
    expect(u.email).toBe("anna@example.com");
    const hh = await redis.get<Household>(key.household(u.householdId));
    expect(hh?.ownerId).toBe(u.id);
    expect(await redis.smembers(key.householdMembers(u.householdId))).toEqual([u.id]);
  });

  it("AC2: a jelszó hashelve tárolódik", async () => {
    const u = await createUser({ email: "a@x.hu", password: pw, name: "A" });
    expect(u.passwordHash).not.toContain(pw);
    expect(u.passwordHash).toMatch(/^\$2[aby]\$/);
  });

  it("AC3: ugyanazzal az emaillel (kis/nagybetűtől függetlenül) nem lehet kétszer regisztrálni", async () => {
    await createUser({ email: "a@x.hu", password: pw, name: "A" });
    await expect(createUser({ email: "A@X.HU", password: pw, name: "B" })).rejects.toThrow(/már regisztrált/);
  });

  it("AC4: meghívóval meglévő háztartáshoz csatlakozik", async () => {
    const owner = await createUser({ email: "o@x.hu", password: pw, name: "O" });
    const m = await createUser({ email: "m@x.hu", password: pw, name: "M", joinHouseholdId: owner.householdId });
    expect(m.householdId).toBe(owner.householdId);
    expect((await redis.smembers(key.householdMembers(owner.householdId))).sort()).toEqual([owner.id, m.id].sort());
  });
});

// Story 2.3 – belépés semleges hibával.
describe("Story 2.3 – authenticate", () => {
  it("AC2: hibás jelszó és nem létező email ugyanúgy null", async () => {
    await createUser({ email: "a@x.hu", password: pw, name: "A" });
    expect(await authenticate("a@x.hu", "rossz")).toBeNull();
    expect(await authenticate("nincs@x.hu", pw)).toBeNull();
    expect((await authenticate(" A@x.hu", pw))?.email).toBe("a@x.hu");
  });
});

// Story 2.2 – session-érvényesség és tag eltávolítása.
describe("Story 2.2 – tag eltávolítása", () => {
  async function family() {
    const owner = await createUser({ email: "o@x.hu", password: pw, name: "Owner" });
    const m = await createUser({ email: "m@x.hu", password: pw, name: "Tag", joinHouseholdId: owner.householdId });
    return { owner, m };
  }

  it("AC6: a tulajdonos eltávolíthatja a tagot; a tag új, üres háztartást kap és a régi sessionje érvénytelen", async () => {
    const { owner, m } = await family();
    const oldSession = { userId: m.id, householdId: owner.householdId, sv: 0 };
    expect(isSessionValid(oldSession, await getUser(m.id))).toBe(true);

    await removeMember(owner.householdId, owner.id, m.id);

    const after = await getUser(m.id);
    expect(after!.householdId).not.toBe(owner.householdId);
    expect(await redis.smembers(key.householdMembers(owner.householdId))).toEqual([owner.id]);
    expect(isSessionValid(oldSession, after)).toBe(false);
    const newHh = await redis.get<Household>(key.household(after!.householdId));
    expect(newHh?.ownerId).toBe(m.id);
  });

  it("AC7: nem tulajdonos nem távolíthat el, és a tulajdonos önmagát sem", async () => {
    const { owner, m } = await family();
    await expect(removeMember(owner.householdId, m.id, owner.id)).rejects.toThrow(/tulajdonos/);
    await expect(removeMember(owner.householdId, owner.id, owner.id)).rejects.toThrow(/Saját magadat/);
  });

  it("AC7: más háztartás tagját nem lehet eltávolítani", async () => {
    const { owner } = await family();
    const stranger = await createUser({ email: "s@x.hu", password: pw, name: "S" });
    await expect(removeMember(owner.householdId, owner.id, stranger.id)).rejects.toThrow(/nem tagja/);
  });

  it("a régi (sessionVersion nélküli) userek és sessionök továbbra is érvényesek", () => {
    const legacyUser = { id: "u", email: "e", name: "n", passwordHash: "h", householdId: "hh", createdAt: 0 };
    expect(isSessionValid({ userId: "u", householdId: "hh" }, legacyUser)).toBe(true);
    expect(isSessionValid({ userId: "u", householdId: "masik" }, legacyUser)).toBe(false);
    expect(isSessionValid({ userId: "u", householdId: "hh" }, null)).toBe(false);
  });
});

// Story 2.4 – jelszócsere.
describe("Story 2.4 – setUserPassword", () => {
  it("AC5: az új jelszó működik, a régi nem, és minden régi session érvénytelen", async () => {
    const u = await createUser({ email: "a@x.hu", password: pw, name: "A" });
    const session = { userId: u.id, householdId: u.householdId, sv: 0 };
    const updated = await setUserPassword(u.id, "uj-jelszo-123");
    expect(await authenticate("a@x.hu", pw)).toBeNull();
    expect((await authenticate("a@x.hu", "uj-jelszo-123"))?.id).toBe(u.id);
    expect(isSessionValid(session, updated)).toBe(false);
    expect(isSessionValid({ ...session, sv: 1 }, updated)).toBe(true);
  });
});
