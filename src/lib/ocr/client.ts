// Story 10.1 – böngészős OCR: kép betöltése (EXIF-forgatással), canvas-os
// előfeldolgozás, egyetlen újrahasznált tesseract worker, és az opcionális
// Claude-os út (server action) tesseract-tartalékkal. Csak kliens komponensből hívd.
import type { Worker } from "tesseract.js";
import { runOcr, type OcrEngine, type OcrResult } from "./pipeline";
import type { OcrLayout, PixelImage } from "./preprocess";
import { visionOcrAction, type VisionResponse } from "./vision-action";
import type { VisionKind } from "./vision";

export type OcrProgress = { status: string; pct: number };
type ProgressFn = (p: OcrProgress) => void;

/** A betöltött kép hosszabb oldala legfeljebb ennyi (memória, sebesség). */
const LOAD_MAX_SIDE = 3000;
/** A Claude-nak küldött kép hosszabb oldala. */
const UPLOAD_MAX_SIDE = 1600;

let workerPromise: Promise<Worker> | null = null;
let progressListener: ProgressFn | null = null;

const STATUS_HU: Record<string, string> = {
  "loading tesseract core": "Felismerő betöltése…",
  "initializing tesseract": "Felismerő indítása…",
  "loading language traineddata": "Magyar nyelvi adat letöltése…",
  "initializing api": "Felismerő indítása…",
  "recognizing text": "Szöveg kiolvasása…",
};

function getWorker(): Promise<Worker> {
  if (!workerPromise) {
    workerPromise = import("tesseract.js")
      .then((t) =>
        t.createWorker("hun+eng", 1, {
          logger: (m: { status: string; progress?: number }) => {
            progressListener?.({
              status: STATUS_HU[m.status] ?? "Feldolgozás…",
              pct: Math.round((m.progress ?? 0) * 100),
            });
          },
        })
      )
      .catch((err) => {
        workerPromise = null; // következő próbálkozásnál újra
        throw err;
      });
  }
  return workerPromise;
}

function makeCanvas(w: number, h: number): HTMLCanvasElement {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

function toCanvas(img: PixelImage): HTMLCanvasElement {
  const c = makeCanvas(img.width, img.height);
  c.getContext("2d")!.putImageData(new ImageData(new Uint8ClampedArray(img.data), img.width, img.height), 0, 0);
  return c;
}

async function decode(file: Blob): Promise<CanvasImageSource & { width: number; height: number }> {
  // A createImageBitmap a fotók EXIF-forgatását is alkalmazza.
  if (typeof createImageBitmap === "function") {
    try {
      return await createImageBitmap(file, { imageOrientation: "from-image" });
    } catch {
      /* régi böngésző: <img> */
    }
  }
  const url = URL.createObjectURL(file);
  try {
    const el = new Image();
    el.decoding = "async";
    el.src = url;
    await el.decode();
    return Object.assign(el, { width: el.naturalWidth, height: el.naturalHeight });
  } finally {
    URL.revokeObjectURL(url);
  }
}

async function drawScaled(file: Blob, maxSide: number): Promise<HTMLCanvasElement> {
  const src = await decode(file);
  const s = Math.min(1, maxSide / Math.max(src.width, src.height));
  const c = makeCanvas(Math.max(1, Math.round(src.width * s)), Math.max(1, Math.round(src.height * s)));
  const ctx = c.getContext("2d")!;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(src, 0, 0, c.width, c.height);
  if ("close" in src && typeof src.close === "function") src.close();
  return c;
}

export async function loadPixels(file: Blob): Promise<PixelImage> {
  const c = await drawScaled(file, LOAD_MAX_SIDE);
  const d = c.getContext("2d")!.getImageData(0, 0, c.width, c.height);
  return { data: d.data, width: d.width, height: d.height };
}

const canvasEngine: OcrEngine = {
  async resize(img, width, height) {
    const c = makeCanvas(width, height);
    const ctx = c.getContext("2d")!;
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(toCanvas(img), 0, 0, width, height);
    const d = ctx.getImageData(0, 0, width, height);
    return { data: d.data, width, height };
  },
  async recognize(img, params, opts) {
    const worker = await getWorker();
    await worker.setParameters(params as unknown as Parameters<Worker["setParameters"]>[0]);
    const r = await worker.recognize(toCanvas(img), { rotateAuto: opts.rotateAuto });
    return { text: r.data.text ?? "", confidence: r.data.confidence ?? 0 };
  },
};

/**
 * Szöveg kiolvasása egy képből a böngészőben (tesseract.js, magyar + angol).
 * A worker a több kép között újrahasznosul.
 */
export async function recognizeImage(
  file: Blob,
  opts: { layout: OcrLayout; onProgress?: ProgressFn; score?: (text: string) => number }
): Promise<OcrResult> {
  progressListener = opts.onProgress ?? null;
  try {
    opts.onProgress?.({ status: "Kép előkészítése…", pct: 0 });
    const img = await loadPixels(file);
    return await runOcr(img, canvasEngine, { layout: opts.layout, score: opts.score });
  } finally {
    progressListener = null;
  }
}

/** Kicsinyített JPEG a feltöltéshez (a Claude-nak ennyi bőven elég). */
export async function prepareUpload(file: Blob): Promise<Blob> {
  const c = await drawScaled(file, UPLOAD_MAX_SIDE);
  return await new Promise<Blob>((resolve, reject) =>
    c.toBlob((b) => (b ? resolve(b) : reject(new Error("toBlob"))), "image/jpeg", 0.88)
  );
}

// Ha a szerver egyszer jelezte, hogy nincs kulcs, többet nem próbálkozunk.
let visionDisabled = false;

/**
 * Claude-os felismerés, ha a szerveren be van állítva. null → nincs / nem sikerült,
 * ilyenkor a hívó a recognizeImage-et (tesseract) használja.
 */
export async function tryVision(kind: VisionKind, file: Blob): Promise<Extract<VisionResponse, { ok: true }> | null> {
  if (visionDisabled) return null;
  try {
    const fd = new FormData();
    fd.set("kind", kind);
    fd.set("image", await prepareUpload(file), "kep.jpg");
    const res = await visionOcrAction(fd);
    if (res.ok) return res;
    if (res.reason === "disabled") visionDisabled = true;
    return null;
  } catch {
    return null;
  }
}
