// Story 10.1 – OCR-szöveg utófeldolgozása: tipikus tesseract-hibák javítása
// (O→0, l→1 számokban, „Ft” változatok, kötőjelek), szemétsorok kiszűrése,
// valamint közös összeg- és dátumfelismerés a parsereknek.

const MONTHS: Record<string, number> = {
  jan: 1,
  feb: 2,
  mar: 3,
  marc: 3,
  apr: 4,
  maj: 5,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sze: 9,
  szep: 9,
  sep: 9,
  okt: 10,
  oct: 10,
  nov: 11,
  dec: 12,
};

export function fold(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

const pad = (n: number) => String(n).padStart(2, "0");
export function isoDay(y: number, m: number, d: number): string {
  return `${y}-${pad(m)}-${pad(d)}`;
}
function validDate(y: number, m: number, d: number): boolean {
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 2000 || y > 2100) return false;
  const dt = new Date(y, m - 1, d);
  return dt.getMonth() === m - 1;
}

// Számjegyként félreolvasott betűk – csak szám-környezetben cseréljük.
const DIGIT_LIKE: Record<string, string> = {
  O: "0",
  o: "0",
  Q: "0",
  D: "0",
  "@": "0",
  e: "0",
  l: "1",
  I: "1",
  i: "1",
  "|": "1",
  "!": "1",
  S: "5",
  s: "5",
  B: "8",
  Z: "2",
  z: "2",
  g: "9",
};
const DL = "OoQD@elIi|!SsBZzg";

/**
 * Pénznem előtti „szám-szerű” tokenekben a betűket számjegyre cseréli:
 * „3 e55 Ft” → „3 055 Ft”, „1 2O0 Ft” → „1 200 Ft”, „l 299 Ft” → „1 299 Ft”.
 * Csak akkor nyúl hozzá, ha a tokenben van legalább egy valódi számjegy.
 */
function fixDigitsBeforeCurrency(line: string): string {
  const re = new RegExp(`([0-9${DL}][0-9${DL} .,]*[0-9${DL}])(\\s*(?:Ft|HUF|forint)\\b)`, "g");
  return line.replace(re, (all: string, num: string, cur: string, offset: number) => {
    // A szám elejéről a hosszabb betűsorokat (pl. „Lidl”) leválasztjuk.
    const m = num.match(new RegExp(`^(.*?)([0-9${DL}]{0,3}(?:[ .][0-9${DL}]{3})*(?:,[0-9${DL}]{2})?)$`));
    let head = m ? m[1] : "";
    let tail = m ? m[2] : num;
    // Ha a token eleje egy szó vége (pl. „kg 718”), az a szóhoz tartozik.
    const full = line.slice(0, offset) + head;
    let prev = full.slice(-1);
    while (tail && /\p{L}/u.test(tail[0]) && /\p{L}/u.test(prev)) {
      prev = tail[0];
      head += tail[0];
      tail = tail.slice(1);
    }
    if (!/\d/.test(tail)) return all;
    // Csak akkor cserélünk, ha a token nagy része már szám, vagy szabályos
    // ezres tagolású és számjeggyel kezdődik („2 ess” → „2 055”).
    const digits = (tail.match(/\d/g) ?? []).length;
    const letters = (tail.match(new RegExp(`[${DL}]`, "g")) ?? []).length;
    const grouped = /^\d\S{0,2}(?: \S{3})+$/.test(tail.trim());
    if (letters > digits && !grouped) return all;
    const fixed = tail.replace(new RegExp(`[${DL}]`, "g"), (c) => DIGIT_LIKE[c] ?? c);
    return head + fixed + cur;
  });
}

/** Egy sor „szemét”, ha alig van benne betű/szám (zajból kiolvasott jelek). */
export function isJunkLine(line: string): boolean {
  const t = line.trim();
  if (!t) return true;
  const alnum = (t.match(/[\p{L}\p{N}]/gu) ?? []).length;
  if (alnum < 2) return true;
  // Csupa 1–2 betűs „szavak” (pl. „r Ty”, „a  4”, „y / 4”) → zaj.
  const words = t.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w));
  const longWords = words.filter((w) => (w.match(/[\p{L}\p{N}]/gu) ?? []).length >= 3);
  if (longWords.length === 0 && words.length >= 2 && !/\d{1,2}[:.]\d{2}/.test(t) && !/\d+\s*(Ft|HUF)/.test(t)) {
    return true;
  }
  return alnum / t.replace(/\s/g, "").length < 0.4;
}

/**
 * A nyers OCR-szöveg tisztítása:
 * - NBSP/keskeny szóköz → szóköz, többszörös szóköz → egy (de a sor megmarad),
 * - unicode mínuszok/gondolatjelek → „-”, „_45 990” → „-45 990”,
 * - „Ft” félreolvasások (F+, Et, Fl, FT) javítása,
 * - számjegy-betű keveredés javítása pénzösszegekben,
 * - szemétsorok elhagyása.
 */
export function cleanOcrText(raw: string): string {
  return raw
    .replace(/\r/g, "")
    .split("\n")
    .map((line) => {
      let l = line.replace(/[    ]/g, " ").replace(/[ \t]+/g, " ").trim();
      l = l.replace(/[−‒–—―]/g, "-");
      // „Ft” félreolvasások egy szám után.
      l = l.replace(/(\d)\s*(?:F\+|Et|E\+|Fl|FT|Fi|Ft\.|ft)(?=\s|$|[^\p{L}])/gu, "$1 Ft");
      // „_45 990 Ft” / „~4 990 Ft”: aláhúzás/tilde a mínusz helyett.
      l = l.replace(/(^|\s)[_~](?=\s?\d)/g, "$1-");
      l = fixDigitsBeforeCurrency(l);
      return l;
    })
    .filter((l) => !isJunkLine(l))
    .join("\n");
}

export type FoundAmount = {
  /** Egész forint (a fillér levágva – Story 10.4: „1 730,20 Ft” → 1730). */
  value: number;
  sign: "+" | "-" | "";
  /** A találat kezdete és vége a sorban. */
  index: number;
  end: number;
  /** Volt-e mellette pénznem (Ft/HUF). */
  currency: boolean;
};

/**
 * Magyar formátumú összeg számmá: „12 345”, „12.345”, „-4 990,00”, „1990”, „4,990.00”.
 * Hibás csoportosításnál (pl. „33 3 299”) null.
 */
export function parseHufNumber(s: string): number | null {
  const t = s.replace(/\s+/g, " ").trim();
  let m = t.match(/^(\d{1,3}(?:[ .]\d{3})+|\d+)(?:,(\d{1,2}))?$/);
  if (m) {
    const int = parseInt(m[1].replace(/[ .]/g, ""), 10);
    // A fillért levágjuk, nem kerekítjük (a user kérése: „3 315,62 Ft” → 3315).
    return int;
  }
  // Angol formátum: 4,990.00
  m = t.match(/^(\d{1,3}(?:,\d{3})+)(?:\.(\d{2}))?$/);
  if (m) {
    const int = parseInt(m[1].replace(/,/g, ""), 10);
    return int;
  }
  return null;
}

const AMOUNT_CORE = String.raw`(\d{1,3}(?:[ .]\d{3})+|\d+)(?:,(\d{1,2}))?`;

/**
 * Pénzösszegek egy sorban. Alapból csak pénznemmel (Ft/HUF/forint) jelölt
 * összegeket ad vissza; `allowBare` esetén a sor végi csupasz számot is (blokkon
 * az „ÖSSZESEN: 3 055” pénznem nélkül is előfordul).
 */
export function findAmounts(line: string, allowBare = false): FoundAmount[] {
  const out: FoundAmount[] = [];
  const re = new RegExp(String.raw`(^|[^\d,.])([+\-])?\s?${AMOUNT_CORE}(?:\s*(Ft|HUF|forint))?(?![\p{L}\d])`, "gu");
  let m: RegExpExecArray | null;
  while ((m = re.exec(line))) {
    const currency = !!m[5];
    const index = m.index + m[1].length;
    const end = m.index + m[0].length;
    // Idő (14:26) vagy dátum része → kihagyjuk (a számjegyek előtti karakter dönt).
    const digitsAt = m.index + m[0].indexOf(m[3], m[1].length);
    const before = line.slice(Math.max(0, digitsAt - 1), digitsAt);
    const after = line.slice(end, end + 1);
    if (!currency) {
      if (!allowBare) continue;
      if (/[:./-]/.test(before) || /[:./]/.test(after)) continue;
      // csak a sor végi csupasz szám
      if (line.slice(end).trim() !== "") continue;
    }
    const value = parseHufNumber(m[3] + (m[4] ? "," + m[4] : ""));
    if (value == null || value <= 0) continue;
    out.push({ value, sign: (m[2] as "+" | "-" | undefined) ?? "", index, end, currency });
  }
  return out;
}

export type DateHit = { day: string; index: number; end: number; relative?: boolean };

/**
 * Dátum egy sorban. Felismert formák:
 * „2026. 11. 15.”, „2026.11.18”, „2026-11-18”, „2026/11/18”, „2026,11.18” (OCR-vessző),
 * „nov. 17.”, „november 17”, „Nov 16”, „16 Nov 2026”, „17 november”,
 * „Ma”, „Tegnap”, „Today”, „Yesterday”. Év nélkül a jövőbeli dátum az előző évre esik.
 */
export function findDate(line: string, now: Date = new Date()): DateHit | null {
  const y0 = now.getFullYear();
  // OCR-elírás a hónapnévben: „aua. 16.”, „auq. 16.” → aug. (azonos hossz, az indexek maradnak)
  const low = fold(line).replace(/\bau[aq]\./g, "aug.");

  let m = line.match(/(20\d{2})\s?[.,\-/]\s?(\d{1,2})\s?[.,\-/]\s?(\d{1,2})(?!\d)/);
  if (m) {
    const [y, mo, d] = [+m[1], +m[2], +m[3]];
    if (validDate(y, mo, d)) return { day: isoDay(y, mo, d), index: m.index!, end: m.index! + m[0].length };
  }

  const withYear = (mo: number, d: number, y?: number) => {
    let yy = y ?? y0;
    if (!y) {
      const cand = new Date(yy, mo - 1, d);
      // 2 napnál jobban a jövőben → tavalyi.
      if (cand.getTime() - now.getTime() > 2 * 86400_000) yy -= 1;
    }
    return validDate(yy, mo, d) ? isoDay(yy, mo, d) : null;
  };

  // hónapnév + nap (+ opcionális év): „nov. 17.”, „november 17”, „Nov 16, 2026”
  m = low.match(/\b(jan|feb|marc?|apr|maj|may|jun|jul|aug|szep?|sep|okt|oct|nov|dec)[a-z]*\.?\s?(\d{1,2})(?!\d)\.?(?:,?\s?(20\d{2}))?/);
  if (m && MONTHS[m[1]]) {
    const day = withYear(MONTHS[m[1]], +m[2], m[3] ? +m[3] : undefined);
    if (day) return { day, index: m.index!, end: m.index! + m[0].length };
  }
  // nap + hónapnév (+ év): „16 Nov 2026”, „17. november”
  m = low.match(/\b(\d{1,2})\.?\s(jan|feb|marc?|apr|maj|may|jun|jul|aug|szep?|sep|okt|oct|nov|dec)[a-z]*\.?(?:\s(20\d{2}))?/);
  if (m && MONTHS[m[2]]) {
    const day = withYear(MONTHS[m[2]], +m[1], m[3] ? +m[3] : undefined);
    if (day) return { day, index: m.index!, end: m.index! + m[0].length };
  }

  const rel = (offset: number, index: number, len: number): DateHit => {
    const d = new Date(now);
    d.setDate(d.getDate() + offset);
    return { day: isoDay(d.getFullYear(), d.getMonth() + 1, d.getDate()), index, end: index + len, relative: true };
  };
  const t = low.trim();
  if (/^(ma|today|mai nap)\b/.test(t) && t.length <= 12) return rel(0, 0, t.length);
  m = low.match(/\b(tegnap|yesterday)\b/);
  if (m && !/tegnapelott/.test(low)) return rel(-1, m.index!, m[0].length);
  if (/\btegnapelott\b/.test(low)) return rel(-2, 0, t.length);
  return null;
}

/** Idő (14:26, 14.26) – a bank-listában a tétel alcíme, nem összeg. */
export const TIME_RE = /\b([01]?\d|2[0-3])[:.]([0-5]\d)\b/;
