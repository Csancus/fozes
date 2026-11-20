// Story 10.1 – tesseract-paraméterek forrás és szerkezet szerint.
// A PSM-értékeket a scripts/ocr mérés alapján választottuk (lásd a story-t).
import type { OcrLayout, OcrSource } from "./preprocess";

export type TesseractParams = Record<string, string>;

export function tesseractParamsFor(source: OcrSource, layout: OcrLayout): TesseractParams {
  // Mérés (story 10.1, 3. iteráció): képernyőképen a 6 (egy szövegblokk – a
  // név + összeg egy sorban marad) a legjobb listára és szabad szövegre is;
  // fotón (blokk) a 4 (egy oszlop, változó méretű sorok) adta a legtöbbet.
  // A 3 (automatikus) a bank-listát szétszedte oszlopokra, a 11 rontott a jegyzeten.
  void layout;
  const psm = source === "photo" ? "4" : "6";
  return {
    tessedit_pageseg_mode: psm,
    preserve_interword_spaces: "1",
    user_defined_dpi: "300",
  };
}
