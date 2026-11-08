import { beforeEach, describe, expect, it, vi } from "vitest";
import { createUser, getUserByEmail } from "@/lib/auth";
import { createInvite, getInvite } from "@/lib/invites";
import { LIMITS } from "@/lib/rate-limit";
import { createResetToken } from "@/lib/password-reset";

// A server actionök a Next redirect()-jét hívják – itt kivételként kapjuk el.
class Redirect extends Error {
  constructor(public url: string) {
    super(url);
  }
}
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Redirect(url);
  },
}));
vi.mock("next/cache", () => ({ revalidatePath: () => {} }));

const session: Record<string, unknown> & { save: () => Promise<void>; destroy: () => void } = {
  save: async () => {},
  destroy: () => {
    for (const k of Object.keys(session)) if (k !== "save" && k !== "destroy") delete session[k];
  },
};
vi.mock("@/lib/session", () => ({ getSession: async () => session }));

let ip = "1.1.1.1";
vi.mock("@/lib/request", () => ({
  clientIp: async () => ip,
  baseUrl: async () => "https://teszt.hu",
}));

const { login, register, requestPasswordReset } = await import("@/app/belepes/actions");
const { resetPassword } = await import("@/app/jelszo-csere/actions");

function fd(obj: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.set(k, v);
  return f;
}
async function redirectOf(p: Promise<unknown>): Promise<URL> {
  try {
    await p;
  } catch (e) {
    if (e instanceof Redirect) return new URL(e.url, "https://teszt.hu");
    throw e;
  }
  throw new Error("nem volt redirect");
}

const PW = "jo-jelszo-123";

beforeEach(() => {
  session.destroy();
  ip = "1.1.1.1";
  delete process.env.RESEND_API_KEY;
});

describe("Story 2.3 – belépés", () => {
  it("AC2: rossz jelszó és nem létező email ugyanazt a semleges hibát adja", async () => {
    await createUser({ email: "a@x.hu", password: PW, name: "A" });
    const r1 = await redirectOf(login(fd({ email: "a@x.hu", password: "rossz" })));
    const r2 = await redirectOf(login(fd({ email: "nincs@x.hu", password: PW })));
    expect(r1.searchParams.get("err")).toBe("Hibás email vagy jelszó.");
    expect(r2.searchParams.get("err")).toBe(r1.searchParams.get("err"));
  });

  it("AC1: túl sok hibás próbálkozás után helyes jelszóval is tilt egy ideig", async () => {
    await createUser({ email: "a@x.hu", password: PW, name: "A" });
    for (let i = 0; i < LIMITS.loginEmail.limit; i++) {
      ip = `10.0.0.${i}`; // különböző IP-kről is az email-limit fog
      await redirectOf(login(fd({ email: "a@x.hu", password: "rossz" })));
    }
    const r = await redirectOf(login(fd({ email: "a@x.hu", password: PW })));
    expect(r.searchParams.get("err")).toMatch(/Túl sok próbálkozás/);
    expect(session.userId).toBeUndefined();
  });

  it("AC3: sikeres belépés sessiont indít a sessionVersionnel", async () => {
    const u = await createUser({ email: "a@x.hu", password: PW, name: "A" });
    const r = await redirectOf(login(fd({ email: "A@x.hu", password: PW })));
    expect(r.pathname).toBe("/");
    expect(session).toMatchObject({ userId: u.id, householdId: u.householdId, sv: 0 });
  });
});

describe("Story 2.2 – regisztráció meghívóval", () => {
  it("AC3: érvényes meghívóval a háztartáshoz csatlakozik, és a meghívó elhasználódik", async () => {
    const owner = await createUser({ email: "o@x.hu", password: PW, name: "O" });
    const inv = await createInvite(owner.householdId, owner.id);
    await redirectOf(register(fd({ email: "m@x.hu", password: PW, name: "M", inv: inv.token })));
    expect((await getUserByEmail("m@x.hu"))?.householdId).toBe(owner.householdId);
    expect(await getInvite(inv.token)).toBeNull();
  });

  it("AC3: lejárt / felhasznált meghívóval nem jön létre fiók", async () => {
    const r = await redirectOf(register(fd({ email: "m@x.hu", password: PW, name: "M", inv: "rossz-token" })));
    expect(r.searchParams.get("err")).toMatch(/meghívó/);
    expect(await getUserByEmail("m@x.hu")).toBeNull();
  });

  it("AC8: a régi ?hh= háztartás-azonosítóval már nem lehet csatlakozni", async () => {
    const owner = await createUser({ email: "o@x.hu", password: PW, name: "O" });
    await redirectOf(register(fd({ email: "m@x.hu", password: PW, name: "M", hh: owner.householdId })));
    expect((await getUserByEmail("m@x.hu"))?.householdId).not.toBe(owner.householdId);
  });
});

describe("Story 2.5 – nyitott regisztráció védelme", () => {
  it("AC1: rövid jelszót elutasít", async () => {
    const r = await redirectOf(register(fd({ email: "a@x.hu", password: "1234567", name: "A" })));
    expect(r.searchParams.get("err")).toMatch(/legalább 8/);
    expect(await getUserByEmail("a@x.hu")).toBeNull();
  });

  it("AC2: kitöltött csapda-mezővel (bot) nem jön létre fiók", async () => {
    await redirectOf(register(fd({ email: "bot@x.hu", password: PW, name: "Bot", website: "http://spam" })));
    expect(await getUserByEmail("bot@x.hu")).toBeNull();
  });

  it("AC3: egy IP-ről óránként legfeljebb 5 regisztráció", async () => {
    for (let i = 0; i < LIMITS.registerIp.limit; i++) {
      await redirectOf(register(fd({ email: `u${i}@x.hu`, password: PW, name: "U" })));
    }
    const r = await redirectOf(register(fd({ email: "sok@x.hu", password: PW, name: "U" })));
    expect(r.searchParams.get("err")).toMatch(/Túl sok regisztráció/);
    expect(await getUserByEmail("sok@x.hu")).toBeNull();
  });

  it("AC3: napi plafon az egész appra", async () => {
    process.env.REGISTRATION_DAILY_CAP = "2";
    for (let i = 0; i < 2; i++) {
      ip = `2.2.2.${i}`;
      await redirectOf(register(fd({ email: `d${i}@x.hu`, password: PW, name: "D" })));
    }
    ip = "3.3.3.3";
    const r = await redirectOf(register(fd({ email: "d9@x.hu", password: PW, name: "D" })));
    expect(r.searchParams.get("err")).toMatch(/Ma már nem lehet/);
    delete process.env.REGISTRATION_DAILY_CAP;
  });
});

describe("Story 2.4 – elfelejtett jelszó", () => {
  it("AC1: létező és nem létező emailre ugyanaz a válasz", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    await createUser({ email: "a@x.hu", password: PW, name: "A" });
    const r1 = await redirectOf(requestPasswordReset(fd({ email: "a@x.hu" })));
    const r2 = await redirectOf(requestPasswordReset(fd({ email: "nincs@x.hu" })));
    expect(r1.search).toBe(r2.search);
    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(fetchMock.mock.calls[0][1].body).text).toContain("https://teszt.hu/jelszo-csere?t=");
    vi.unstubAllGlobals();
  });

  it("AC5: tokennel új jelszó állítható be, utána a token nem használható újra", async () => {
    const u = await createUser({ email: "a@x.hu", password: PW, name: "A" });
    const t = await createResetToken(u.id, "owner");
    const r = await redirectOf(resetPassword(fd({ t, password: "uj-jelszo-99", password2: "uj-jelszo-99" })));
    expect(r.pathname).toBe("/belepes");
    expect(r.searchParams.get("ok")).toMatch(/beállítva/);
    const again = await redirectOf(resetPassword(fd({ t, password: "masik-jelszo-1", password2: "masik-jelszo-1" })));
    expect(again.searchParams.get("err")).toMatch(/lejárt/);
    await redirectOf(login(fd({ email: "a@x.hu", password: "uj-jelszo-99" })));
    expect(session.userId).toBe(u.id);
  });

  it("AC5: eltérő jelszavaknál nem ment és a token megmarad", async () => {
    const u = await createUser({ email: "a@x.hu", password: PW, name: "A" });
    const t = await createResetToken(u.id, "owner");
    const r = await redirectOf(resetPassword(fd({ t, password: "uj-jelszo-99", password2: "mas-jelszo-99" })));
    expect(r.searchParams.get("err")).toMatch(/nem egyezik/);
    const ok = await redirectOf(resetPassword(fd({ t, password: "uj-jelszo-99", password2: "uj-jelszo-99" })));
    expect(ok.searchParams.get("ok")).toBeTruthy();
  });
});
