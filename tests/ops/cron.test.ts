import { afterEach, describe, expect, it } from "vitest";
import { fakeRedis } from "../support/fake-redis";
import { GET as keepalive } from "@/app/api/cron/keepalive/route";
import { GET as backup } from "@/app/api/cron/backup/route";

const req = (auth?: string) =>
  new Request("https://teszt.hu/api/cron/x", { headers: auth ? { authorization: auth } : {} });

afterEach(() => {
  delete process.env.CRON_SECRET;
  delete process.env.R2_BACKUP_BUCKET;
});

// Story 1.2 – keep-alive.
describe("Story 1.2 – keep-alive cron", () => {
  it("AC1: beír egy időbélyeget a system:keepalive kulcsba", async () => {
    const res = await keepalive(req());
    expect(res.status).toBe(200);
    expect(await fakeRedis.get("system:keepalive")).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it("AC2: ha van CRON_SECRET, titok nélkül 401", async () => {
    process.env.CRON_SECRET = "s3cret";
    expect((await keepalive(req())).status).toBe(401);
    expect((await keepalive(req("Bearer s3cret"))).status).toBe(200);
  });
});

// Story 1.3 – heti mentés.
describe("Story 1.3 – mentés cron", () => {
  it("AC3: CRON_SECRET nélkül sosem fut (401)", async () => {
    expect((await backup(req())).status).toBe(401);
    expect((await backup(req("Bearer akarmi"))).status).toBe(401);
  });

  it("AC4: helyes titokkal, de bucket nélkül érthető hibával áll le", async () => {
    process.env.CRON_SECRET = "s3cret";
    const res = await backup(req("Bearer s3cret"));
    expect(res.status).toBe(500);
    expect(await res.json()).toMatchObject({ ok: false });
  });
});
