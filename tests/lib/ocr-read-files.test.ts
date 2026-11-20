import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/ocr/vision-action", () => ({ visionOcrAction: vi.fn() }));
const { readPickedFiles } = await import("@/lib/ocr/client");

describe("Story 10.2 – Android-fájlválasztó", () => {
  it("AC4: a fájlt memóriába másolja, a hiányzó típust a kiterjesztésből pótolja", async () => {
    const f = new File([new Uint8Array([1, 2, 3])], "1000012476.jpg", { type: "" });
    const { files, failed } = await readPickedFiles([f]);
    expect(failed).toBe(0);
    expect(files).toHaveLength(1);
    expect(files[0].type).toBe("image/jpeg");
    expect(files[0].size).toBe(3);
  });

  it("AC4: az olvashatatlan vagy üres képet kihagyja és megszámolja; a nem-képet csendben eldobja", async () => {
    const broken = new File([], "x.png", { type: "image/png" });
    const unreadable = Object.assign(new File([new Uint8Array([1])], "y.jpg", { type: "image/jpeg" }), {
      arrayBuffer: () => Promise.reject(new Error("NotReadableError")),
    });
    const pdf = new File([new Uint8Array([1])], "doc.pdf", { type: "application/pdf" });
    const ok = new File([new Uint8Array([9])], "ok.png", { type: "image/png" });
    const { files, failed } = await readPickedFiles([broken, unreadable, pdf, ok]);
    expect(failed).toBe(2);
    expect(files.map((f) => f.name)).toEqual(["ok.png"]);
  });
});
