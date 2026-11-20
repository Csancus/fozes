import { beforeEach, describe, expect, it, vi } from "vitest";
import { createCaptcha, verifyCaptcha } from "@/lib/captcha";
import { createUser, getUserByEmail } from "@/lib/auth";

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
const session: Record<string, unknown> & { save: () => Promise<void> } = { save: async () => {} };
vi.mock("@/lib/session", () => ({ getSession: async () => session }));
vi.mock("@/lib/request", () => ({ clientIp: async () => "9.9.9.9", baseUrl: async () => "https://teszt.hu" }));

const { login, register } = await import("@/app/belepes/actions");

async function redirectOf(p: Promise<unknown>): Promise<URL> {
  try {
    await p;
  } catch (e) {
    if (e instanceof Redirect) return new URL(e.url, "https://teszt.hu");
    throw e;
  }
  throw new Error("nem volt redirect");
}
function fd(obj: Record<string, string>) {
  const f = new FormData();
  for (const [k, v] of Object.entries(obj)) f.set(k, v);
  return f;
}
const PW = "jo-jelszo-123";

beforeEach(() => {
  delete session.userId;
});

describe("Story 2.7 – biztonsági kérdés (összeadás)", () => {
  it("AC1: egy 1 jegyű és egy 2 jegyű számot ad össze", () => {
    for (let i = 0; i < 200; i++) {
      const c = createCaptcha();
      expect(c.a).toBeGreaterThanOrEqual(1);
      expect(c.a).toBeLessThanOrEqual(9);
      expect(c.b).toBeGreaterThanOrEqual(10);
      expect(c.b).toBeLessThanOrEqual(99);
    }
  });

  it("AC2: jó válaszra ok, rossz válaszra wrong", async () => {
    const c = createCaptcha();
    expect(await verifyCaptcha(c.token, String(c.a + c.b + 1))).toBe("wrong");
    expect(await verifyCaptcha(c.token, String(c.a + c.b))).toBe("ok");
  });

  it("AC2: a feladat nem hamisítható (módosított számok, rossz aláírás)", async () => {
    const c = createCaptcha();
    const [, , exp, nonce, sig] = c.token.split(".");
    expect(await verifyCaptcha(`1.10.${exp}.${nonce}.${sig}`, "11")).toBe("wrong");
    expect(await verifyCaptcha("szemet", "11")).toBe("wrong");
    expect(await verifyCaptcha("", "")).toBe("wrong");
  });

  it("AC3: egy feladat csak egyszer használható", async () => {
    const c = createCaptcha();
    const ans = String(c.a + c.b);
    expect(await verifyCaptcha(c.token, ans)).toBe("ok");
    expect(await verifyCaptcha(c.token, ans)).toBe("expired");
  });

  it("AC3: 30 perc után lejár", async () => {
    const c = createCaptcha(Date.now() - 31 * 60 * 1000);
    expect(await verifyCaptcha(c.token, String(c.a + c.b))).toBe("expired");
  });

  it("AC4: captcha nélkül jó jelszóval sem lehet belépni, az email megmarad", async () => {
    await createUser({ email: "a@x.hu", password: PW, name: "A" });
    const r = await redirectOf(login(fd({ email: "a@x.hu", password: PW })));
    expect(r.searchParams.get("err")).toMatch(/biztonsági kérdés/);
    expect(r.searchParams.get("email")).toBe("a@x.hu");
    expect(session.userId).toBeUndefined();

    const c = createCaptcha();
    await redirectOf(
      login(fd({ email: "a@x.hu", password: PW, captchaToken: c.token, captcha: String(c.a + c.b) }))
    );
    expect(session.userId).toBeDefined();
  });

  it("AC4: rossz válasszal nem jön létre fiók", async () => {
    const c = createCaptcha();
    const r = await redirectOf(
      register(fd({ email: "b@x.hu", password: PW, name: "B", captchaToken: c.token, captcha: "0" }))
    );
    expect(r.searchParams.get("err")).toMatch(/Hibás válasz/);
    expect(await getUserByEmail("b@x.hu")).toBeNull();
  });
});
