// Story 10.1 – kép-előfeldolgozás OCR előtt, tiszta függvényekkel.
// A böngészőben canvas getImageData()-ból, a mérésnél (scripts/ocr) sharp raw
// pufferből kapja a pixeleket – így ugyanaz a kód fut mindkét helyen.

export type PixelImage = { data: Uint8ClampedArray; width: number; height: number };
/** A kép forrása: képernyőkép (lapos színek, éles betű) vagy fotó (zaj, árnyék, dőlés). */
export type OcrSource = "screenshot" | "photo";
/** Szerkezet: tétel-lista (bank, blokk) vagy szabad szöveg (poszt, jegyzet). */
export type OcrLayout = "list" | "free";

/** Ennél hosszabb oldalt nem küldünk a tesseractnak (memória + idő). */
export const MAX_SIDE = 3200;
/** Képernyőkép rövidebb oldalának célmérete felskálázáskor. */
export const SCREENSHOT_TARGET = 800;

/**
 * Mekkora nagyítás kell. A tesseract kb. 25–35 px-es betűmagasságnál a legjobb;
 * egy 390–800 px széles (lekicsinyített, továbbküldött) képernyőképen a betű
 * 8–15 px, ezért ott 2–3x-os felskálázás sokat számít.
 */
export function planScale(width: number, height: number, source: OcrSource): number {
  if (!width || !height) return 1;
  const longSide = Math.max(width, height);
  const shortSide = Math.min(width, height);
  let scale = 1;
  if (source === "screenshot") {
    // Telefonos képernyőkép: a kisebb képeket ~800 px rövidebb oldalra hozzuk
    // (mérés: 700 kevés, 900–1500 már romlik – túl nagyok lesznek a betűk).
    // A szélességhez igazítunk (álló telefonképen ez a rövidebb oldal; fekvő, kis
    // képen – pl. jegyzet-kivágás – így nem nagyítunk túl).
    if (width < SCREENSHOT_TARGET) scale = Math.min(3, SCREENSHOT_TARGET / width);
  } else {
    if (longSide < 900) scale = 2.5;
    else if (longSide < 1400) scale = 2;
    else if (longSide < 1800) scale = 1.5;
  }
  if (longSide * scale > MAX_SIDE) scale = MAX_SIDE / longSide;
  return Math.max(0.25, Math.round(scale * 100) / 100);
}

/** Luminancia (0–255) pixelenként. */
export function toGray(img: PixelImage): Uint8ClampedArray {
  const { data, width, height } = img;
  const out = new Uint8ClampedArray(width * height);
  for (let i = 0, p = 0; p < out.length; i += 4, p++) {
    // Rec. 601 súlyok; az átlátszó pixelt fehérnek vesszük.
    const a = data[i + 3] / 255;
    const y = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    out[p] = y * a + 255 * (1 - a);
  }
  return out;
}

function histogram(gray: Uint8ClampedArray): Uint32Array {
  const h = new Uint32Array(256);
  for (let i = 0; i < gray.length; i++) h[gray[i]]++;
  return h;
}

function percentile(h: Uint32Array, total: number, p: number): number {
  const target = total * p;
  let acc = 0;
  for (let v = 0; v < 256; v++) {
    acc += h[v];
    if (acc >= target) return v;
  }
  return 255;
}

/**
 * Sötét módú-e a kép: a pixelek többsége (medián) sötét. Ilyenkor invertálunk,
 * mert a tesseract fekete betűt vár világos alapon.
 */
export function isDarkBackground(gray: Uint8ClampedArray): boolean {
  const h = histogram(gray);
  return percentile(h, gray.length, 0.5) < 100;
}

/**
 * Képernyőkép vagy fotó? A képernyőképen nagy, egyszínű felületek vannak
 * (háttér, kártyák), ezért néhány szürkeségi sáv viszi a pixelek nagy részét.
 */
export function guessSource(gray: Uint8ClampedArray): OcrSource {
  const bins = new Uint32Array(64);
  for (let i = 0; i < gray.length; i++) bins[gray[i] >> 2]++;
  const sorted = Array.from(bins).sort((a, b) => b - a);
  const top2 = (sorted[0] + sorted[1]) / gray.length;
  return top2 > 0.45 ? "screenshot" : "photo";
}

/**
 * Kontraszt-széthúzás: az alsó/felső 1% levágása után 0–255-re skálázunk.
 * `flattenBelowBg` > 0 esetén a felső pont a háttér (medián) alatt ennyivel van:
 * így a halvány felületek (ikon-körök, kártyák) fehérbe olvadnak, és nem zavarják
 * a tesseract sor-felismerését (mérés: a sötét bank-képen ez hozta vissza a neveket).
 */
export function stretchContrast(
  gray: Uint8ClampedArray,
  lowP = 0.01,
  highP = 0.99,
  flattenBelowBg = 0
): Uint8ClampedArray {
  const h = histogram(gray);
  const lo = percentile(h, gray.length, lowP);
  let hi = percentile(h, gray.length, highP);
  if (flattenBelowBg > 0) hi = Math.max(lo + 64, Math.min(hi, percentile(h, gray.length, 0.5) - flattenBelowBg));
  if (hi - lo < 16) return gray;
  const k = 255 / (hi - lo);
  const out = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i++) out[i] = (gray[i] - lo) * k;
  return out;
}

export function invert(gray: Uint8ClampedArray): Uint8ClampedArray {
  const out = new Uint8ClampedArray(gray.length);
  for (let i = 0; i < gray.length; i++) out[i] = 255 - gray[i];
  return out;
}

/**
 * Adaptív (Sauvola-féle) binarizálás integrálképpel: egyenetlen megvilágítású
 * fotón (árnyék a blokkon) a globális küszöb elmossa a betűket, ez nem.
 */
export function binarizeAdaptive(
  gray: Uint8ClampedArray,
  width: number,
  height: number,
  windowSize = Math.max(15, Math.round(Math.min(width, height) / 24) | 1),
  k = 0.2
): Uint8ClampedArray {
  const W = width + 1;
  const sum = new Float64Array(W * (height + 1));
  const sq = new Float64Array(W * (height + 1));
  for (let y = 0; y < height; y++) {
    let rs = 0;
    let rq = 0;
    for (let x = 0; x < width; x++) {
      const v = gray[y * width + x];
      rs += v;
      rq += v * v;
      sum[(y + 1) * W + x + 1] = sum[y * W + x + 1] + rs;
      sq[(y + 1) * W + x + 1] = sq[y * W + x + 1] + rq;
    }
  }
  const r = windowSize >> 1;
  const out = new Uint8ClampedArray(gray.length);
  for (let y = 0; y < height; y++) {
    const y0 = Math.max(0, y - r);
    const y1 = Math.min(height, y + r + 1);
    for (let x = 0; x < width; x++) {
      const x0 = Math.max(0, x - r);
      const x1 = Math.min(width, x + r + 1);
      const n = (x1 - x0) * (y1 - y0);
      const s = sum[y1 * W + x1] - sum[y0 * W + x1] - sum[y1 * W + x0] + sum[y0 * W + x0];
      const q = sq[y1 * W + x1] - sq[y0 * W + x1] - sq[y1 * W + x0] + sq[y0 * W + x0];
      const mean = s / n;
      const sd = Math.sqrt(Math.max(0, q / n - mean * mean));
      const t = mean * (1 + k * (sd / 128 - 1));
      out[y * width + x] = gray[y * width + x] > t ? 255 : 0;
    }
  }
  return out;
}

export type PreprocessOptions = {
  /** Adaptív binarizálás (fotónál alapból be). */
  binarize?: boolean;
  /** Képernyőképen a háttér alatti „fehérbe olvasztás” mértéke (0 = ki). */
  flatten?: number;
};

/** Mért alapérték a háttér-olvasztáshoz (sötét módú képernyőképen; világoson rontott). */
export const FLATTEN = 25;
/** Világos képernyőképen (vonalas jegyzetlap, kártyák) enyhébb olvasztás. */
export const FLATTEN_LIGHT = 10;

export type PreprocessResult = PixelImage & { inverted: boolean; source: OcrSource };

/**
 * A teljes előfeldolgozás a már (EXIF szerint forgatott, felskálázott) képen:
 * szürkeárnyalat → sötét mód esetén invertálás → kontraszt-széthúzás →
 * fotónál adaptív binarizálás. RGBA-t ad vissza, hogy canvasba/PNG-be tehető legyen.
 */
export function preprocessPixels(
  img: PixelImage,
  source: OcrSource | "auto" = "auto",
  opts: PreprocessOptions = {}
): PreprocessResult {
  let gray = toGray(img);
  const src: OcrSource = source === "auto" ? guessSource(gray) : source;
  const inverted = isDarkBackground(gray);
  if (inverted) gray = invert(gray);
  gray = stretchContrast(gray, 0.01, 0.99, src === "screenshot" ? (opts.flatten ?? (inverted ? FLATTEN : FLATTEN_LIGHT)) : 0);
  const binarize = opts.binarize ?? src === "photo";
  if (binarize) gray = binarizeAdaptive(gray, img.width, img.height);
  const data = new Uint8ClampedArray(img.width * img.height * 4);
  for (let p = 0, i = 0; p < gray.length; p++, i += 4) {
    data[i] = data[i + 1] = data[i + 2] = gray[p];
    data[i + 3] = 255;
  }
  return { data, width: img.width, height: img.height, inverted, source: src };
}
