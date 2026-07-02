import type { PurchaseLine, Unit } from "@/lib/types";
import { UNITS } from "@/lib/units";

const SKIP_KEYWORDS = [
  "áfa",
  "afa",
  "összesen",
  "osszesen",
  "készpénz",
  "keszpenz",
  "visszajáró",
  "visszajaro",
  "bankkártya",
  "bankkartya",
  "kártya",
  "kartya",
  "fizetendő",
  "fizetendo",
  "fizetve",
  "nyugta",
  "számla",
  "szamla",
  "vevő",
  "vevo",
  "eladó",
  "elado",
  "adószám",
  "adoszam",
  "nyugtaszám",
  "nyugtaszam",
  "kedvezmény",
  "kedvezmeny",
  "pénztáros",
  "penztaros",
  "kassza",
  "kasszaszám",
  "kasszaszam",
  "üdvözöljük",
  "udvozoljuk",
  "köszönjük",
  "koszonjuk",
  "viszlát",
  "viszlat",
  "tel:",
  "www.",
  "http",
  "e-mail",
  "megtakarítás",
  "megtakaritas",
  "gyűjtött",
  "gyujtott",
  "pont",
  "hűségpont",
  "husegpont",
  "áfás",
  "afas",
  "netto",
  "nettó",
  "brutto",
  "bruttó",
];

const UNIT_ALIASES: Record<string, Unit> = {
  kg: "kg",
  g: "g",
  dkg: "dkg",
  dg: "dkg",
  l: "l",
  liter: "l",
  dl: "dl",
  ml: "ml",
  db: "db",
  darab: "db",
  csomag: "csomag",
  cs: "csomag",
  ek: "ek",
  kk: "kk",
  csipet: "csipet",
};

function normUnit(u: string): Unit {
  const k = u.toLowerCase().replace(/\.$/, "");
  return UNIT_ALIASES[k] ?? ("db" as Unit);
}

// Parse a Hungarian formatted number like "1 234,56" or "12,3" or "890" or "1.234"
function parseNumber(s: string): number {
  if (!s) return 0;
  const cleaned = s.replace(/\s+/g, "").trim();
  // If both . and , exist, treat . as thousands separator
  if (cleaned.includes(",") && cleaned.includes(".")) {
    return Number(cleaned.replace(/\./g, "").replace(",", "."));
  }
  // Only comma -> decimal
  if (cleaned.includes(",")) {
    return Number(cleaned.replace(",", "."));
  }
  // Only dot -> could be decimal or thousands. If digits after . are exactly 3 assume thousands
  if (cleaned.includes(".")) {
    const parts = cleaned.split(".");
    if (parts.length === 2 && parts[1].length === 3) {
      return Number(parts.join(""));
    }
  }
  return Number(cleaned);
}

const NUM = "(?:\\d{1,3}(?:[ .]\\d{3})*|\\d+)(?:[.,]\\d+)?";
const UNITS_RE = UNITS.join("|");

// Pattern A: NAME ... QTY UNIT × PRICE Ft/UNIT TOTAL Ft
// e.g. "Alma 1,2 kg x 890 Ft/kg 1 068 Ft"
const PATTERN_A = new RegExp(
  `^(.+?)\\s+(${NUM})\\s*(${UNITS_RE})\\s*[xX×*]\\s*(${NUM})\\s*Ft(?:/\\w+)?\\s+(${NUM})\\s*Ft\\s*[A-Za-z]?\\s*$`,
  "i"
);

// Pattern B: NAME QTY x PRICE TOTAL Ft  (no unit -> db)
// e.g. "Zsemle 3 x 80 Ft 240 Ft"
const PATTERN_B = new RegExp(
  `^(.+?)\\s+(${NUM})\\s*[xX×*]\\s*(${NUM})\\s*Ft\\s+(${NUM})\\s*Ft\\s*[A-Za-z]?\\s*$`,
  "i"
);

// Pattern C: NAME QTY UNIT TOTAL Ft  (unit price missing, qty > 0)
// e.g. "Banán 0,52 kg 500 Ft"
const PATTERN_C = new RegExp(
  `^(.+?)\\s+(${NUM})\\s*(${UNITS_RE})\\s+(${NUM})\\s*Ft\\s*[A-Za-z]?\\s*$`,
  "i"
);

// Pattern D: NAME TOTAL Ft  (single-line total)
// e.g. "Kenyér 450 Ft"
const PATTERN_D = new RegExp(
  `^(.+?)\\s+(${NUM})\\s*Ft\\s*[A-Za-z]?\\s*$`,
  "i"
);

function shouldSkip(line: string): boolean {
  const l = line.trim();
  if (!l) return true;
  if (l.length < 3) return true;
  const lower = l.toLowerCase();
  for (const kw of SKIP_KEYWORDS) {
    if (lower.includes(kw)) return true;
  }
  // header lines have no digits
  if (!/\d/.test(l)) return true;
  return false;
}

function cleanName(name: string): string {
  return name
    .replace(/\s+/g, " ")
    .replace(/[*#]+$/g, "")
    .replace(/^\d+\s*[.)]\s*/, "") // leading "1." or "1)"
    .trim();
}

function line(
  name: string,
  qty: number,
  unit: Unit,
  unitPrice: number,
  total: number
): PurchaseLine {
  return {
    name: cleanName(name),
    qty,
    unit,
    unitPrice: Math.round(unitPrice),
    total: Math.round(total),
    addToPantry: false,
    locationId: null,
    expiresAt: null,
  };
}

export function parseReceiptLine(raw: string): PurchaseLine | null {
  const l = raw.trim();
  if (shouldSkip(l)) return null;

  let m = l.match(PATTERN_A);
  if (m) {
    const [, name, qtyS, unitS, priceS, totalS] = m;
    const qty = parseNumber(qtyS);
    const unit = normUnit(unitS);
    const unitPrice = parseNumber(priceS);
    const total = parseNumber(totalS);
    if (qty > 0 && total > 0) return line(name, qty, unit, unitPrice, total);
  }

  m = l.match(PATTERN_B);
  if (m) {
    const [, name, qtyS, priceS, totalS] = m;
    const qty = parseNumber(qtyS);
    const unitPrice = parseNumber(priceS);
    const total = parseNumber(totalS);
    if (qty > 0 && total > 0) return line(name, qty, "db", unitPrice, total);
  }

  m = l.match(PATTERN_C);
  if (m) {
    const [, name, qtyS, unitS, totalS] = m;
    const qty = parseNumber(qtyS);
    const unit = normUnit(unitS);
    const total = parseNumber(totalS);
    if (qty > 0 && total > 0) {
      const unitPrice = qty > 0 ? total / qty : total;
      return line(name, qty, unit, unitPrice, total);
    }
  }

  m = l.match(PATTERN_D);
  if (m) {
    const [, name, totalS] = m;
    const total = parseNumber(totalS);
    if (total > 0 && cleanName(name).length >= 2) {
      return line(name, 1, "db", total, total);
    }
  }

  return null;
}

export function parseReceiptText(raw: string): PurchaseLine[] {
  if (!raw) return [];
  const lines = raw.split(/\r?\n/);
  const out: PurchaseLine[] = [];
  for (const l of lines) {
    const parsed = parseReceiptLine(l);
    if (parsed) out.push(parsed);
  }
  return out;
}
