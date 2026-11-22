// Story 10.1 – OCR-mérés a tests/fixtures/ocr képein.
//
// OCR_STAGE=baseline → a 10.1 előtti út: nyers kép, tesseract alapbeállítás, régi parserek
// OCR_STAGE=<bármi más> (alap: new) → src/lib/ocr/pipeline (előfeldolgozás + PSM +
//   utófeldolgozás) + új parserek. Kapcsolók a lépések külön méréséhez:
//   OCR_PARSERS=old  – régi parserek az új képfeldolgozással
//   OCR_POST=0       – utófeldolgozás nélkül
//   OCR_MULTI=0      – második menet nélkül
// OCR_JITTER=0.95,1,1.05 → minden képet több méretben is lefuttat (a tesseract
//   érzékeny a betűméretre; így nem egyetlen szerencsés/szerencsétlen méretre hangolunk).
// OCR_DEBUG=1 → kiírja a felismert szöveget; OCR_OUT=<fájl> → JSON eredmény; OCR_ONLY=<névrész>.
import { describe, it, afterAll } from "vitest";
import { readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { createWorker, type Worker } from "tesseract.js";
import { DEFAULT_SAVED_TYPES, type SavedType } from "@/lib/types";
import type { PixelImage } from "@/lib/ocr/preprocess";
import type { OcrEngine } from "@/lib/ocr/pipeline";

type ExpTx = { merchant: string; amount: number; day: string; kind: string };
type Fixture = {
  file: string;
  case: string;
  mode: "screenshot" | "photo" | "text";
  use: "bank" | "saved" | "note";
  text: string;
  tx?: ExpTx[];
  saved?: { title: string; kind: string; location: string; links: string[] };
  tokens?: string[];
};

// OCR_DIR=<mappa> → más képkészlet (saját expected.json-nal), pl. a repón kívüli valódi képernyőképek.
const dir = path.resolve(process.env.OCR_DIR ?? "tests/fixtures/ocr");
const spec = JSON.parse(readFileSync(path.join(dir, "expected.json"), "utf8")) as {
  now: string;
  fixtures: Fixture[];
};
const NOW = new Date(spec.now);
const STAGE = process.env.OCR_STAGE ?? "new";
const BASE = STAGE === "baseline";
const DEBUG = !!process.env.OCR_DEBUG;
const ONLY = process.env.OCR_ONLY;
const OLD_PARSERS = BASE || process.env.OCR_PARSERS === "old";
const POST = !BASE && process.env.OCR_POST !== "0";
const JITTER = (process.env.OCR_JITTER ?? "1").split(",").map(Number);
import { parseBankText as parseNew } from "@/lib/bank-ocr";
const types: SavedType[] = DEFAULT_SAVED_TYPES.map((t) => ({ ...t, createdAt: 0 }));

function lev(a: string, b: string): number {
  const n = b.length;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[n];
}
const squash = (s: string) => s.replace(/\s+/g, " ").trim();
const fold = (s: string) => squash(s).toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
function sim(a: string, b: string): number {
  const x = fold(a);
  const y = fold(b);
  if (!x && !y) return 1;
  return 1 - lev(x, y) / Math.max(x.length, y.length);
}
function charAcc(got: string, exp: string): number {
  const e = squash(exp);
  return Math.max(0, 1 - lev(squash(got), e) / e.length);
}
const normLink = (u: string) =>
  u.toLowerCase().replace(/^https?:\/\//, "").replace(/^www\./, "").replace(/\/+$/, "");

type Row = Record<string, string | number>;
const rows: Row[] = [];
const totals = {
  charSum: 0,
  charN: 0,
  txExp: 0,
  txFull: 0,
  amounts: 0,
  dates: 0,
  merchants: 0,
  extra: 0,
  savedFields: 0,
  savedExp: 0,
  tokens: 0,
  tokensExp: 0,
  ms: 0,
};

let worker: Worker | null = null;
async function getWorker(): Promise<Worker> {
  if (!worker) {
    worker = await createWorker("hun+eng", 1, {
      cachePath: path.join(process.env.TEMP ?? process.env.TMPDIR ?? "/tmp", "tess-cache"),
    });
  }
  return worker;
}

const toBuf = (img: PixelImage) => Buffer.from(img.data.buffer, img.data.byteOffset, img.data.byteLength);
const fromSharp = (data: Buffer, width: number, height: number): PixelImage => ({
  data: new Uint8ClampedArray(data.buffer, data.byteOffset, data.byteLength),
  width,
  height,
});

// A böngészős motor (canvas + worker) node-os megfelelője.
const sharpEngine: OcrEngine = {
  async resize(img, width, height) {
    const r = await sharp(toBuf(img), { raw: { width: img.width, height: img.height, channels: 4 } })
      .resize(width, height, { kernel: "lanczos3" })
      .raw()
      .toBuffer({ resolveWithObject: true });
    return fromSharp(r.data, r.info.width, r.info.height);
  },
  async recognize(img, params, opts) {
    const png = await sharp(toBuf(img), { raw: { width: img.width, height: img.height, channels: 4 } })
      .png()
      .toBuffer();
    if (process.env.OCR_DUMP) await sharp(png).toFile(path.join(process.env.OCR_DUMP, `pre-${img.width}x${img.height}.png`));
    const w = await getWorker();
    await w.setParameters(params);
    const r = await w.recognize(png, { rotateAuto: opts.rotateAuto });
    return { text: r.data.text ?? "", confidence: r.data.confidence ?? 0 };
  },
};

async function loadPixels(file: string, jitter: number): Promise<{ img: PixelImage; png: Buffer }> {
  // EXIF-forgatás, mint a böngészőben (createImageBitmap imageOrientation: "from-image").
  let s = sharp(file).rotate();
  if (jitter !== 1) {
    const meta = await sharp(file).rotate().metadata();
    s = s.resize(Math.round((meta.width ?? 1) * jitter));
  }
  const r = await s.clone().ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const png = await s.clone().png().toBuffer();
  return { img: fromSharp(r.data, r.info.width, r.info.height), png };
}

describe(`Story 10.1 – OCR-mérés (${STAGE})`, () => {
  afterAll(async () => {
    await worker?.terminate();
    const n = (a: number, b: number) => (b ? `${a}/${b} (${Math.round((100 * a) / b)}%)` : "–");
    const summary = {
      stage: STAGE,
      karakterpontossag: `${((100 * totals.charSum) / Math.max(1, totals.charN)).toFixed(1)}%`,
      tetel_teljes: n(totals.txFull, totals.txExp),
      osszeg: n(totals.amounts, totals.txExp),
      datum: n(totals.dates, totals.txExp),
      bolt: n(totals.merchants, totals.txExp),
      hamis_tetel: totals.extra,
      bakancslista_mezo: n(totals.savedFields, totals.savedExp),
      jegyzet_kulcsszo: n(totals.tokens, totals.tokensExp),
      ms_kepenkent: Math.round(totals.ms / Math.max(1, totals.charN)),
    };
    console.table(rows);
    console.table([summary]);
    if (process.env.OCR_OUT) writeFileSync(process.env.OCR_OUT, JSON.stringify({ rows, summary }, null, 2));
  });

  for (const f of spec.fixtures) {
    if (ONLY && !f.file.includes(ONLY)) continue;
    it(f.file, async () => {
      for (const jit of JITTER) {
        const { img, png } = await loadPixels(path.join(dir, f.file), jit);
        const t0 = Date.now();
        let text: string;
        let source = "-";
        let passes = 1;
        if (BASE) {
          // Pontosan, ahogy a 10.1 előtti kód: recognize(kép, "hun+eng") alapbeállítással.
          const w = await getWorker();
          text = (await w.recognize(png)).data.text ?? "";
        } else {
          const { runOcr } = await import("@/lib/ocr/pipeline");
          const r = await runOcr(img, sharpEngine, {
            layout: f.use === "bank" ? "list" : "free",
            multiPass: process.env.OCR_MULTI !== "0",
            score: f.use === "bank" ? (t) => parseNew(t, NOW).length : undefined,
            preprocess: {
              ...(process.env.OCR_FLATTEN ? { flatten: Number(process.env.OCR_FLATTEN) } : {}),
              ...(process.env.OCR_BIN ? { binarize: process.env.OCR_BIN === "1" } : {}),
            },
          });
          text = POST ? r.text : r.rawText;
          source = r.source;
          passes = r.passes;
        }
        const ms = Date.now() - t0;
        totals.ms += ms;
        if (DEBUG) console.log(`\n----- ${f.file} @${jit} -----\n${text}\n`);
        const acc = charAcc(text, f.text);
        totals.charSum += acc;
        totals.charN += 1;
        const row: Row = { kép: f.file, x: jit, forrás: source, menet: passes, karakter: `${(acc * 100).toFixed(1)}%`, ms };

        if (f.use === "bank" && f.tx) {
          const parse = OLD_PARSERS
            ? (await import("./baseline/bank-ocr")).parseBankText
            : (await import("@/lib/bank-ocr")).parseBankText;
          const found = parse(text, NOW);
          const used = new Set<number>();
          let full = 0, am = 0, dt = 0, me = 0;
          for (const e of f.tx) {
            const idx = found.findIndex((t, i) => !used.has(i) && t.amount === e.amount);
            if (idx < 0) continue;
            used.add(idx);
            const t = found[idx];
            am++;
            const dOk = t.day === e.day;
            const mOk = sim(t.merchant, e.merchant) >= 0.75 || fold(t.merchant).includes(fold(e.merchant));
            if (dOk) dt++;
            if (mOk) me++;
            if (dOk && mOk && t.kind === e.kind) full++;
          }
          const extra = found.length - used.size;
          totals.txExp += f.tx.length;
          totals.txFull += full;
          totals.amounts += am;
          totals.dates += dt;
          totals.merchants += me;
          totals.extra += extra;
          Object.assign(row, { tétel: `${full}/${f.tx.length}`, összeg: am, dátum: dt, bolt: me, hamis: extra });
          if (DEBUG) console.log(found);
        }

        if (f.use === "saved" && f.saved) {
          const g = OLD_PARSERS
            ? (await import("./baseline/saved-guess")).guessFromText(text, types)
            : (await import("@/lib/ocr/saved-guess")).guessSavedFromText(text, types);
          const title = sim(g.title, f.saved.title) >= 0.85;
          const loc = sim(g.location.replace(/^c[ií]m:\s*/i, ""), f.saved.location) >= 0.85;
          const links = g.links.map((l) => normLink(l.url));
          const link = f.saved.links.every((l) => links.includes(normLink(l)));
          const kind = g.kind === f.saved.kind;
          totals.savedFields += [title, loc, link, kind].filter(Boolean).length;
          totals.savedExp += 4;
          Object.assign(row, {
            cím: title ? "ok" : g.title,
            hely: loc ? "ok" : g.location,
            link: link ? "ok" : links.join(" "),
            típus: kind ? "ok" : g.kind,
          });
        }

        if (f.use === "note" && f.tokens) {
          const hay = fold(text);
          const hit = f.tokens.filter((t) => hay.includes(fold(t)));
          totals.tokens += hit.length;
          totals.tokensExp += f.tokens.length;
          row.kulcsszó = `${hit.length}/${f.tokens.length}`;
          if (DEBUG) console.log("hiányzó:", f.tokens.filter((t) => !hit.includes(t)));
        }
        rows.push(row);
      }
    });
  }
});
