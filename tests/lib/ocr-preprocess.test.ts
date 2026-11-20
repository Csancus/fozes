import { describe, expect, it } from "vitest";
import {
  binarizeAdaptive,
  guessSource,
  isDarkBackground,
  planScale,
  preprocessPixels,
  stretchContrast,
  toGray,
  type PixelImage,
} from "@/lib/ocr/preprocess";
import { tesseractParamsFor } from "@/lib/ocr/params";
import { runOcr, type OcrEngine } from "@/lib/ocr/pipeline";

// Story 10.1 – kép-előfeldolgozás (tiszta pixel-függvények) és a többmenetes folyamat.

function solid(w: number, h: number, rgb: [number, number, number], fill?: (x: number, y: number) => [number, number, number] | null): PixelImage {
  const data = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      const c = fill?.(x, y) ?? rgb;
      const i = (y * w + x) * 4;
      data[i] = c[0];
      data[i + 1] = c[1];
      data[i + 2] = c[2];
      data[i + 3] = 255;
    }
  return { data, width: w, height: h };
}

describe("Story 10.1 – kép-előfeldolgozás", () => {
  it("AC1: felskálázás – kis képernyőképet ~800 px szélesre, nagyot nem; fotónál a hosszabb oldal számít", () => {
    expect(planScale(390, 844, "screenshot")).toBeCloseTo(2.05, 2);
    expect(planScale(1170, 2532, "screenshot")).toBe(1);
    expect(planScale(200, 400, "screenshot")).toBe(3); // plafon
    expect(planScale(520, 600, "photo")).toBe(2.5);
    expect(planScale(3000, 4000, "photo")).toBe(0.8); // MAX_SIDE miatt kicsinyít
  });

  it("AC1: sötét módú képernyőkép felismerése és invertálása (fekete betű világos alapon)", () => {
    const dark = solid(40, 20, [13, 13, 16], (x) => (x % 10 < 2 ? [240, 240, 240] : null));
    expect(isDarkBackground(toGray(dark))).toBe(true);
    const out = preprocessPixels(dark, "screenshot");
    expect(out.inverted).toBe(true);
    // háttér → világos, betű → sötét
    expect(out.data[(0 * 40 + 5) * 4]).toBeGreaterThan(200);
    expect(out.data[(0 * 40 + 0) * 4]).toBeLessThan(50);
    expect(preprocessPixels(solid(10, 10, [250, 250, 250]), "screenshot").inverted).toBe(false);
  });

  it("AC1: képernyőkép vs fotó – nagy egyszínű felület = képernyőkép, zajos = fotó", () => {
    expect(guessSource(toGray(solid(50, 50, [244, 246, 248])))).toBe("screenshot");
    const noisy = solid(50, 50, [0, 0, 0], (x, y) => {
      const r = Math.sin((x * 50 + y) * 12.9898) * 43758.5453;
      const v = Math.floor((r - Math.floor(r)) * 256);
      return [v, v, v];
    });
    expect(guessSource(toGray(noisy))).toBe("photo");
  });

  it("AC1: kontraszt-széthúzás és háttér-olvasztás – a halvány felület fehér lesz", () => {
    const g = new Uint8ClampedArray([60, 60, 120, 200, 232, 232, 232, 232, 232, 232]);
    const s = stretchContrast(g);
    expect(s[0]).toBe(0);
    expect(s[4]).toBe(255);
    const f = stretchContrast(g, 0.01, 0.99, 40); // felső pont: 232 - 40 = 192
    expect(f[3]).toBe(255); // a 200-as „ikon” is fehér
    expect(f[2]).toBeLessThan(150);
  });

  it("AC1: adaptív binarizálás – árnyékos fotón is elválik a betű a háttértől", () => {
    // balról jobbra sötétedő háttér, rajta sötét „betű”-csíkok
    const w = 60;
    const h = 30;
    const gray = new Uint8ClampedArray(w * h);
    for (let y = 0; y < h; y++)
      for (let x = 0; x < w; x++) gray[y * w + x] = x % 12 < 2 ? 40 : 230 - x * 2;
    const b = binarizeAdaptive(gray, w, h, 15);
    expect(b[5 * w + 0]).toBe(0); // betű
    expect(b[5 * w + 55]).toBe(255); // sötétebb háttér is fehér
    expect(b[5 * w + 48]).toBe(0); // betű a sötét oldalon is
  });

  it("AC2: tesseract-paraméterek – képernyőképen PSM 6, fotón PSM 4, szóközök megtartása", () => {
    expect(tesseractParamsFor("screenshot", "list")).toMatchObject({ tessedit_pageseg_mode: "6", preserve_interword_spaces: "1" });
    expect(tesseractParamsFor("photo", "list").tessedit_pageseg_mode).toBe("4");
  });

  it("AC2: második menet bizonytalan eredménynél; a tartalmi pontszám (pl. talált tételek) dönt", async () => {
    const calls: number[] = [];
    const engine: OcrEngine = {
      async resize(img, w, h) {
        return { data: new Uint8ClampedArray(w * h * 4).fill(255), width: w, height: h };
      },
      async recognize(img) {
        calls.push(img.width);
        // első menet: magas megbízhatóság, de értelmetlen; második: kevésbé biztos, de 2 tétel
        return calls.length === 1
          ? { text: "kössz L aa", confidence: 80 }
          : { text: "SPAR -1 000 Ft\nLidl -2 000 Ft", confidence: 70 };
      },
    };
    const img = solid(390, 300, [250, 250, 250]);
    const r = await runOcr(img, engine, {
      layout: "list",
      source: "screenshot",
      score: (t) => (t.match(/Ft/g) ?? []).length,
    });
    expect(r.passes).toBe(2);
    expect(r.text).toContain("SPAR");
    expect(Math.abs(calls[0] - 800)).toBeLessThanOrEqual(1); // 390 * 2.05
    // biztos első menetnél nincs második
    const one = await runOcr(img, { ...engine, recognize: async () => ({ text: "ok szöveg", confidence: 95 }) }, { layout: "free", source: "screenshot" });
    expect(one.passes).toBe(1);
  });
});
