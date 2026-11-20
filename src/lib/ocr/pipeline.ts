// Story 10.1 – a teljes OCR-folyamat motorfüggetlenül: a böngésző (canvas +
// tesseract worker) és a mérés (sharp + node-os tesseract) ugyanezt hívja.

import { tesseractParamsFor, type TesseractParams } from "./params";
import { cleanOcrText } from "./postprocess";
import {
  guessSource,
  planScale,
  preprocessPixels,
  toGray,
  type OcrLayout,
  type OcrSource,
  type PixelImage,
  type PreprocessOptions,
} from "./preprocess";

export type OcrEngine = {
  /** Átméretezés jó minőségű interpolációval. */
  resize(img: PixelImage, width: number, height: number): Promise<PixelImage>;
  /** Felismerés: szöveg + átlagos megbízhatóság (0–100). */
  recognize(
    img: PixelImage,
    params: TesseractParams,
    opts: { rotateAuto: boolean }
  ): Promise<{ text: string; confidence: number }>;
};

export type OcrOptions = {
  source?: OcrSource | "auto";
  layout: OcrLayout;
  /** Mérés: a felskálázás szorzója (zaj-érzékenység vizsgálata). */
  scaleJitter?: number;
  /** Második menet más nagyítással, ha az első bizonytalan (alap: be). */
  multiPass?: boolean;
  /**
   * Két menet közül melyik a jobb: a hívó adhat tartalmi pontszámot (pl. hány
   * tételt talált a bank-parser). Egyenlőségnél az átlagos megbízhatóság dönt.
   */
  score?: (cleanText: string) => number;
  /** Mérés: előfeldolgozási beállítások felülírása. */
  preprocess?: PreprocessOptions;
};

export type OcrResult = {
  text: string;
  rawText: string;
  source: OcrSource;
  confidence: number;
  passes: number;
};

/** Ennél kisebb átlagos megbízhatóságnál jön a második menet. */
export const SECOND_PASS_BELOW = 85;

export async function runOcr(img: PixelImage, engine: OcrEngine, opts: OcrOptions): Promise<OcrResult> {
  const source: OcrSource =
    !opts.source || opts.source === "auto" ? guessSource(toGray(img)) : opts.source;
  const base = planScale(img.width, img.height, source) * (opts.scaleJitter ?? 1);
  const params = tesseractParamsFor(source, opts.layout);

  const pass = async (scale: number) => {
    const w = Math.max(1, Math.round(img.width * scale));
    const h = Math.max(1, Math.round(img.height * scale));
    const scaled = w === img.width && h === img.height ? img : await engine.resize(img, w, h);
    const pre = preprocessPixels(scaled, source, opts.preprocess);
    return engine.recognize(pre, params, { rotateAuto: source === "photo" });
  };

  let best = await pass(base);
  let passes = 1;
  if ((opts.multiPass ?? true) && best.confidence < SECOND_PASS_BELOW) {
    // A tesseract érzékeny a betűméretre: egy másik nagyítás gyakran
    // megbízhatóbb eredményt ad – a magasabb átlagos megbízhatóságút tartjuk meg.
    const alt = base * (base >= 1.5 ? 0.75 : 1.5);
    if (Math.max(img.width, img.height) * alt <= 4000) {
      const second = await pass(alt);
      passes = 2;
      const rank = (r: { text: string; confidence: number }) =>
        (opts.score ? opts.score(cleanOcrText(r.text)) * 1000 : 0) + r.confidence;
      if (rank(second) > rank(best)) best = second;
    }
  }
  return {
    text: cleanOcrText(best.text),
    rawText: best.text,
    source,
    confidence: best.confidence,
    passes,
  };
}
