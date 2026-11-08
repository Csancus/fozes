import { afterEach, describe, expect, it } from "vitest";
import { fakeRedis } from "../support/fake-redis";
import { dailyRegistrationCap, hit, isLimited, resetLimit } from "@/lib/rate-limit";

// Story 2.3 / 2.5 – fix ablakos számláló.
describe("Story 2.3 – rate limit", () => {
  afterEach(() => {
    delete process.env.REGISTRATION_DAILY_CAP;
  });

  it("AC1: a limitig enged, utána tilt", async () => {
    for (let i = 1; i <= 3; i++) expect((await hit("t", 3, 60)).ok).toBe(true);
    expect(await isLimited("t", 3)).toBe(true);
    expect((await hit("t", 3, 60)).ok).toBe(false);
  });

  it("AC1: az ablak lejárta után újra enged", async () => {
    const t0 = Date.now();
    fakeRedis.now = () => t0;
    await hit("t", 1, 60);
    expect(await isLimited("t", 1)).toBe(true);
    fakeRedis.now = () => t0 + 61_000;
    expect(await isLimited("t", 1)).toBe(false);
  });

  it("AC3: sikeres belépés után az email-számláló nullázható", async () => {
    await hit("t", 1, 60);
    await resetLimit("t");
    expect(await isLimited("t", 1)).toBe(false);
  });

  it("Story 2.5 AC3: napi regisztrációs plafon env-ből, alapból 30", () => {
    expect(dailyRegistrationCap()).toBe(30);
    process.env.REGISTRATION_DAILY_CAP = "5";
    expect(dailyRegistrationCap()).toBe(5);
    process.env.REGISTRATION_DAILY_CAP = "nem-szam";
    expect(dailyRegistrationCap()).toBe(30);
  });
});
