// Story 10.1 – OCR tesztképek előállítása HTML-ből (Chrome headless screenshot).
// Futtatás: node scripts/ocr/render-fixtures.mjs
// A képek a tests/fixtures/ocr/ alá kerülnek; a „fotószerű” képeket utólag
// JPEG-tömörítjük (sharp), hogy a valós, átküldött képernyőképekhez hasonlítsanak.
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import sharp from "sharp";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dir = path.join(root, "tests/fixtures/ocr");

const CHROME = [
  process.env.CHROME_PATH,
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
  "C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe",
  "/usr/bin/google-chrome",
].find((p) => p && existsSync(p));
if (!CHROME) throw new Error("Nincs Chrome/Edge – állítsd be a CHROME_PATH-t.");

// név, ablak (CSS px), eszköz-szorzó, utófeldolgozás
const FIXTURES = [
  { name: "bank-light", w: 390, h: 700, dpr: 1, jpeg: null },
  { name: "bank-dark", w: 390, h: 760, dpr: 2, jpeg: 80 },
  { name: "receipt-photo", w: 520, h: 600, dpr: 1, jpeg: 55 },
  { name: "insta-place", w: 390, h: 600, dpr: 2, jpeg: 70 },
  { name: "maps-place", w: 390, h: 470, dpr: 1.5, jpeg: null },
  { name: "note-handwritten", w: 480, h: 270, dpr: 1, jpeg: 75 },
];

const profile = path.join(tmpdir(), "ocr-fixture-chrome-profile");
mkdirSync(profile, { recursive: true });

for (const f of FIXTURES) {
  const png = path.join(dir, `${f.name}.png`);
  execFileSync(CHROME, [
    "--headless=new",
    "--disable-gpu",
    "--hide-scrollbars",
    `--user-data-dir=${profile}`,
    `--window-size=${f.w},${f.h}`,
    `--force-device-scale-factor=${f.dpr}`,
    `--screenshot=${png}`,
    pathToFileURL(path.join(dir, "src", `${f.name}.html`)).href,
  ], { stdio: "ignore" });
  if (f.jpeg) {
    const jpg = path.join(dir, `${f.name}.jpg`);
    await sharp(png).jpeg({ quality: f.jpeg }).toFile(jpg);
    rmSync(png);
    console.log("kész:", path.relative(root, jpg));
  } else {
    console.log("kész:", path.relative(root, png));
  }
}

// Továbbküldött / kisebb változatok (Messenger-szerű lekicsinyítés + erősebb JPEG).
const VARIANTS = [
  { from: "bank-dark.jpg", to: "bank-dark-small.jpg", scale: 0.5, jpeg: 60 },
  { from: "receipt-photo.jpg", to: "receipt-small.jpg", scale: 0.7, jpeg: 50 },
];
for (const v of VARIANTS) {
  const src = path.join(dir, v.from);
  const meta = await sharp(src).metadata();
  await sharp(src)
    .resize(Math.round(meta.width * v.scale))
    .jpeg({ quality: v.jpeg })
    .toFile(path.join(dir, v.to));
  console.log("kész:", v.to);
}
