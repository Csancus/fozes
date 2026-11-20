import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type Anthropic from "@anthropic-ai/sdk";
import { LIMITS } from "@/lib/rate-limit";

// Story 10.1 – opcionális Claude-os képfelismerés: kulcs nélkül kikapcsol, belépéshez
// kötött, méret-/típus-/rate-limit, és a modell válaszát megtisztítjuk.

class Redirect extends Error {}
vi.mock("next/navigation", () => ({
  redirect: () => {
    throw new Redirect("redirect");
  },
}));
let loggedIn = true;
vi.mock("@/lib/auth", () => ({
  requireUser: async () => {
    if (!loggedIn) throw new Redirect("redirect");
    return { userId: "u1", householdId: "h1", email: "a@b.hu", name: "A" };
  },
}));

const extract = vi.fn();
vi.mock("@/lib/ocr/vision", async (orig) => {
  const actual = await orig<typeof import("@/lib/ocr/vision")>();
  return { ...actual, extractWithVision: (...a: unknown[]) => extract(...a) };
});

const { visionOcrAction } = await import("@/lib/ocr/vision-action");
const vision = await vi.importActual<typeof import("@/lib/ocr/vision")>("@/lib/ocr/vision");

function form(kind: string, blob: Blob | null) {
  const fd = new FormData();
  fd.set("kind", kind);
  if (blob) fd.set("image", blob, "kep.jpg");
  return fd;
}
const jpeg = (size = 1000) => new Blob([new Uint8Array(size)], { type: "image/jpeg" });

beforeEach(() => {
  loggedIn = true;
  extract.mockReset();
  vi.stubEnv("ANTHROPIC_API_KEY", "teszt-kulcs");
});
afterEach(() => vi.unstubAllEnvs());

describe("Story 10.1 – Claude-os képfelismerés (server action)", () => {
  it("AC7: kulcs nélkül „disabled” – a kliens a böngészős felismerésre vált", async () => {
    vi.stubEnv("ANTHROPIC_API_KEY", "");
    expect(await visionOcrAction(form("expenses", jpeg()))).toEqual({ ok: false, reason: "disabled" });
    expect(extract).not.toHaveBeenCalled();
  });

  it("AC7: belépés nélkül nem fut (requireUser → átirányítás)", async () => {
    loggedIn = false;
    await expect(visionOcrAction(form("expenses", jpeg()))).rejects.toBeInstanceOf(Redirect);
  });

  it("AC7: rossz típus / hiányzó kép / túl nagy kép elutasítva", async () => {
    expect(await visionOcrAction(form("valami", jpeg()))).toEqual({ ok: false, reason: "bad_input" });
    expect(await visionOcrAction(form("note", null))).toEqual({ ok: false, reason: "bad_input" });
    expect(await visionOcrAction(form("note", new Blob(["x"], { type: "application/pdf" })))).toEqual({ ok: false, reason: "bad_input" });
    expect(await visionOcrAction(form("note", jpeg(vision.MAX_VISION_BYTES + 1)))).toEqual({ ok: false, reason: "too_large" });
    expect(extract).not.toHaveBeenCalled();
  });

  it("AC7: rate-limit felhasználónként (Redis-számláló)", async () => {
    extract.mockResolvedValue({ kind: "note", text: "szia" });
    for (let i = 0; i < LIMITS.ocrVisionUser.limit; i++) {
      expect((await visionOcrAction(form("note", jpeg()))).ok).toBe(true);
    }
    expect(await visionOcrAction(form("note", jpeg()))).toEqual({ ok: false, reason: "rate_limited" });
  });

  it("AC7: sikeres hívás továbbadja az eredményt; API-hiba esetén „error” (tartalék út)", async () => {
    extract.mockResolvedValueOnce({ kind: "note", text: "Bevásárlás: tej" });
    expect(await visionOcrAction(form("note", jpeg()))).toEqual({ ok: true, kind: "note", text: "Bevásárlás: tej" });
    extract.mockRejectedValueOnce(new Error("529 overloaded"));
    vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await visionOcrAction(form("note", jpeg()))).toEqual({ ok: false, reason: "error" });
  });
});

describe("Story 10.1 – Claude-válasz feldolgozása", () => {
  const NOW = new Date("2026-11-20T12:00:00");

  it("AC7: tételek megtisztítása – kerekítés, előjel le, rossz dátum → ma, üres sor ki", () => {
    expect(
      vision.sanitizeTransactions(
        {
          transactions: [
            { kind: "expense", amount: -4990.4, merchant: " Netflix.com ", day: "2026-11-20", note: "" },
            { kind: "income", amount: 5000, merchant: "Anna", day: "tegnap", note: "" },
            { kind: "expense", amount: 0, merchant: "Egyenleg", day: "2026-11-20", note: "" },
            { kind: "expense", amount: 100, merchant: "  ", day: "2026-11-20", note: "" },
          ],
        },
        NOW
      )
    ).toEqual([
      { kind: "expense", amount: 4990, merchant: "Netflix.com", day: "2026-11-20", note: "" },
      { kind: "income", amount: 5000, merchant: "Anna", day: "2026-11-20", note: "" },
    ]);
  });

  it("AC7: bakancslista-mezők – ismeretlen típus → egyéb, domain → https link", () => {
    expect(
      vision.sanitizeSaved(
        { title: " Bisztró Frank ", kind: "kocsma", location: "Budapest", links: ["bistrofrank.hu/foglalas", "nem link"], note: "Brunch" },
        ["etterem", "egyeb"]
      )
    ).toEqual({
      title: "Bisztró Frank",
      kind: "egyeb",
      location: "Budapest",
      links: [{ url: "https://bistrofrank.hu/foglalas", label: "" }],
      note: "Brunch",
    });
  });

  it("AC7: extractWithVision – képet + utasítást küld strukturált kimenettel; elutasításnál null", async () => {
    const parse = vi.fn().mockResolvedValueOnce({
      stop_reason: "end_turn",
      parsed_output: { transactions: [{ kind: "expense", amount: 3055, merchant: "SPAR", day: "2026-11-18", note: "" }] },
    });
    const client = { messages: { parse } } as unknown as Anthropic;
    const out = await vision.extractWithVision(
      "expenses",
      { data: Buffer.from([1, 2, 3]), mediaType: "image/jpeg" },
      { now: NOW, client }
    );
    expect(out).toEqual({ kind: "expenses", transactions: [{ kind: "expense", amount: 3055, merchant: "SPAR", day: "2026-11-18", note: "" }] });
    const req = parse.mock.calls[0][0];
    expect(req.model).toBe(vision.DEFAULT_VISION_MODEL);
    expect(req.messages[0].content[0]).toMatchObject({ type: "image", source: { type: "base64", media_type: "image/jpeg", data: "AQID" } });
    expect(req.messages[0].content[1].text).toContain("Today is 2026-11-20");
    expect(req.output_config.format).toBeTruthy();

    parse.mockResolvedValueOnce({ stop_reason: "refusal", parsed_output: null });
    expect(await vision.extractWithVision("note", { data: Buffer.from([1]), mediaType: "image/png" }, { client })).toBeNull();
  });

  it("AC7: a modell env-ből felülírható", () => {
    vi.stubEnv("OCR_VISION_MODEL", "claude-sonnet-5-5");
    expect(vision.visionModel()).toBe("claude-sonnet-5-5");
  });
});
