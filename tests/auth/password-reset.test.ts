import { afterEach, describe, expect, it, vi } from "vitest";
import { fakeRedis } from "../support/fake-redis";
import { consumeResetToken, createResetToken, peekResetToken, RESET_TTL_SEC } from "@/lib/password-reset";
import { isMailConfigured, passwordResetEmail, sendMail } from "@/lib/mail";

// Story 2.4 – jelszó-visszaállító tokenek és levél.
describe("Story 2.4 – reset token", () => {
  it("AC2: 1 óráig érvényes", async () => {
    const t0 = Date.now();
    fakeRedis.now = () => t0;
    const t = await createResetToken("u1", "owner");
    expect(await peekResetToken(t)).toMatchObject({ userId: "u1", via: "owner" });
    fakeRedis.now = () => t0 + RESET_TTL_SEC * 1000 + 1;
    expect(await peekResetToken(t)).toBeNull();
  });

  it("AC3: egyszer használható", async () => {
    const t = await createResetToken("u1", "email");
    expect((await consumeResetToken(t))?.userId).toBe("u1");
    expect(await consumeResetToken(t)).toBeNull();
  });
});

describe("Story 2.4 – email (Resend)", () => {
  afterEach(() => {
    delete process.env.RESEND_API_KEY;
    vi.unstubAllGlobals();
  });

  it("AC4: kulcs nélkül nincs email-küldés", async () => {
    expect(isMailConfigured()).toBe(false);
    await expect(sendMail({ to: "a@x.hu", subject: "s", text: "t", html: "h" })).rejects.toThrow();
  });

  it("AC4: kulccsal a Resend API-t hívja a címzettel", async () => {
    process.env.RESEND_API_KEY = "re_test";
    const fetchMock = vi.fn().mockResolvedValue({ ok: true, status: 200 });
    vi.stubGlobal("fetch", fetchMock);
    await sendMail({ to: "a@x.hu", ...passwordResetEmail("Anna", "https://x/jelszo-csere?t=abc") });
    const [url, init] = fetchMock.mock.calls[0];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.headers.Authorization).toBe("Bearer re_test");
    expect(JSON.parse(init.body)).toMatchObject({ to: ["a@x.hu"] });
  });

  it("a levél HTML-je escape-eli a nevet", () => {
    const m = passwordResetEmail("<script>", "https://x");
    expect(m.html).not.toContain("<script>");
    expect(m.text).toContain("https://x");
  });
});
