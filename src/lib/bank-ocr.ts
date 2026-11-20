// Bank-app képernyőkép / blokk OCR-szövegéből tételek kinyerése (heurisztika).
// Támogatott minták: K&H, OTP, Revolut, Erste (Visa Wizz), bolti blokk – bank-agnosztikus.
// A felismerés best-effort; a user utólag szerkeszti a táblázatban.
// Story 10.1: közös utófeldolgozás (src/lib/ocr/postprocess), szigorúbb összeg-
// felismerés (idő ≠ összeg), alcím-sorok kezelése, blokk-mód (egy tétel a végösszeggel).

import { cleanOcrText, findAmounts, findDate, fold, isoDay, TIME_RE } from "./ocr/postprocess";

export type ParsedTx = {
  kind: "expense" | "income";
  amount: number;
  merchant: string;
  day: string; // yyyy-mm-dd
  note: string;
};

function today(now: Date): string {
  return isoDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// Kihagyandó (nem bolt / nem tétel / egyenleg) sorok.
const SKIP_RE =
  /(ref\.?:|hitelkártya haszn|zárolt|egyenleg|számlacsomag|funkci|informáci|feltöltött pénz|elérhető|rendelkezésre|\bbalance\b|\bIBAN\b|HU\d{2}\b)/i;
// Egyenleg-címke: a következő összeg-sor sem tétel.
const BALANCE_LABEL_RE = /^(egyenleg|aktuális egyenleg|elérhető egyenleg|számlaegyenleg|balance|total balance)\b/i;
// Hónap + év szekció-fejléc („November 2026”, „ebben a hónapban”).
const SECTION_RE =
  /^(jan|feb|mar|apr|maj|jun|jul|aug|sze|sep|okt|oct|nov|dec)[a-z]*\.?\s?20\d{2}$|ebben a hon|elozo hon|this month|last month/;
// Tétel alatti alcím: típus + idő („Kártyás vásárlás · 14:26”).
const GENERIC_RE =
  /^(kartyas vasarlas|vasarlas|atutalas|keszpenzfelvetel|keszpenz felvetel|elofizetes|jovairas|terheles|beerkezo|kimeno|card payment|transfer|pending|folyamatban|fuggo)/;
const TRAILING_TIME_RE = /(?:^|[·•\-:.,|]\s*|\s)([01]?\d|2[0-3])[:.\-]?([0-5]\d)\s*$/;

function letters(s: string): number {
  return (s.match(/\p{L}/gu) ?? []).length;
}

function isSubtitle(s: string): boolean {
  const t = s.trim();
  if (!t) return false;
  if (GENERIC_RE.test(fold(t))) return true;
  // „… · 14:26” vagy „… - 1426” a sor végén
  if (TIME_RE.test(t) && TRAILING_TIME_RE.test(t)) return true;
  return /[·•]\s*\d/.test(t) || /\s[-·•]\s([01]?\d|2[0-3])[:.\-]?[0-5]\d\s*$/.test(t);
}

/** Bolt-név takarítás: széli zaj (ikonból olvasott jelek, „ or”, „ .”) le. */
export function cleanMerchant(s: string): string {
  let t = s.replace(/\s{2,}/g, " ").trim();
  t = t.replace(/^[^\p{L}\p{N}]+/u, "");
  for (let i = 0; i < 3; i++) {
    const before = t;
    t = t.replace(/[\s·•\-.,:;|_~!\]\[]+$/u, "");
    // a végén 1–2 betűs kisbetűs zaj-token („Anna Kovács or”), vagy magányos I/l/|
    if (t.split(" ").length > 1) t = t.replace(/\s+(?:[a-z]{1,2}|[|Il1!])$/u, "");
    if (t === before) break;
  }
  return t.slice(0, 60);
}

/** Blokk (nyugta) felismerése: van végösszeg-sor és nyugta-jellegű jelölő vagy tétel-sorok. */
const TOTAL_RE = /\b(osszesen|vegosszeg|fizetendo|osszeg|total|summa)\b/;
const RECEIPT_MARK_RE = /\b(nyugta|blokk|adoszam|ap\s?[a-z]?\d{6,}|nav|afa|visszajaro|bankkartya|keszpenz)\b/;
const PAYMENT_RE = /\b(bankkartya|kartya|keszpenz|szep\s?kartya|cash|card|visa|mastercard)\b/;
const COMPANY_RE = /\b(kft|zrt|bt|kkt|nyrt|ev)\b\.?/i;

function parseReceipt(lines: string[], now: Date): ParsedTx | null {
  const folded = lines.map(fold);
  const totalIdx = folded.findIndex((l) => TOTAL_RE.test(l));
  if (totalIdx < 0) return null;
  const marker = folded.some((l) => RECEIPT_MARK_RE.test(l));
  const itemLines = lines.slice(0, totalIdx).filter((l) => findAmounts(l).length > 0);
  if (!marker && itemLines.length < 2) return null;

  const totalVals = findAmounts(lines[totalIdx], true).map((a) => a.value);
  // a végösszeg néha a következő sorba csúszik
  if (!totalVals.length && lines[totalIdx + 1]) {
    totalVals.push(...findAmounts(lines[totalIdx + 1], true).map((a) => a.value));
  }
  const payVals = lines
    .filter((_, i) => i > totalIdx && PAYMENT_RE.test(folded[i]))
    .flatMap((l) => findAmounts(l, true).map((a) => a.value));
  const sum = itemLines.reduce((s, l) => {
    const a = findAmounts(l);
    return s + (a.length ? a[a.length - 1].value : 0);
  }, 0);

  const cands = [...totalVals, ...payVals];
  let amount = 0;
  if (cands.includes(sum) && sum > 0) amount = sum;
  else {
    // a legtöbbször előforduló érték (végösszeg = kártyás fizetés)
    const freq = new Map<number, number>();
    for (const v of cands) freq.set(v, (freq.get(v) ?? 0) + 1);
    const best = [...freq.entries()].sort((a, b) => b[1] - a[1])[0];
    if (best && best[1] > 1) amount = best[0];
    else amount = totalVals[0] ?? payVals[0] ?? sum;
  }
  if (!amount) return null;

  const head = lines.slice(0, 4).filter((l) => letters(l) >= 3 && findAmounts(l).length === 0);
  const merchant = cleanMerchant(head.find((l) => COMPANY_RE.test(l)) ?? head[0] ?? "Blokk");
  let day = today(now);
  for (const l of lines) {
    const d = findDate(l, now);
    if (d && !d.relative) {
      day = d.day;
      break;
    }
  }
  return { kind: "expense", amount, merchant, day, note: itemLines.length ? `${itemLines.length} tétel a blokkon` : "" };
}

export function parseBankText(text: string, now: Date = new Date()): ParsedTx[] {
  const lines = cleanOcrText(text)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const receipt = parseReceipt(lines, now);
  if (receipt) return [receipt];

  let currentDay = today(now);
  let candidates: string[] = []; // az utolsó összeg óta látott név-jelöltek
  let afterBalanceLabel = false;
  const out: ParsedTx[] = [];

  for (const line of lines) {
    const low = fold(line);
    const amounts = findAmounts(line);

    // Dátum / szekció-kontextus (a sor lényegében csak dátum).
    if (!amounts.length) {
      const d = findDate(line, now);
      const rest = d ? line.slice(0, d.index) + line.slice(d.end) : line;
      if (d && letters(rest) < 3) {
        currentDay = d.day;
        candidates = [];
        continue;
      }
      if (SECTION_RE.test(low.trim())) {
        candidates = [];
        continue;
      }
    }

    if (amounts.length) {
      const balance = afterBalanceLabel || SKIP_RE.test(line);
      afterBalanceLabel = false;
      if (balance) {
        candidates = [];
        continue;
      }
      // A sor jobb szélén lévő (utolsó) összeg a tétel összege.
      const a = amounts[amounts.length - 1];
      const inlineDate = findDate(line, now);
      let residual = (line.slice(0, a.index) + " " + line.slice(a.end))
        .replace(/[+\-]?\s?\d[\d .,]*\s*(Ft|HUF|EUR|forint)\b/g, "")
        .replace(/\s{2,}/g, " ")
        .replace(/[\s+\-]+$/, "")
        .trim();
      if (inlineDate && !inlineDate.relative) {
        residual = residual.replace(line.slice(inlineDate.index, inlineDate.end), " ").replace(/\s{2,}/g, " ").trim();
      }
      const subtitle = isSubtitle(residual);
      const nearest = candidates[candidates.length - 1];
      let merchant = "";
      if (!subtitle && letters(residual) >= 2) merchant = residual;
      else if (nearest) merchant = nearest;
      else merchant = residual.replace(TRAILING_TIME_RE, "");
      merchant = cleanMerchant(merchant);
      if (letters(merchant) >= 2) {
        out.push({
          kind: a.sign === "+" ? "income" : "expense",
          amount: a.value,
          merchant,
          day: inlineDate && !inlineDate.relative ? inlineDate.day : currentDay,
          note: "",
        });
      }
      candidates = [];
      continue;
    }

    // Nem összeg-sor: lehet-e bolt-jelölt?
    if (BALANCE_LABEL_RE.test(line)) {
      afterBalanceLabel = true;
      continue;
    }
    if (SKIP_RE.test(line)) continue;
    if (/^\d{1,2}[:.]\d{2}\b/.test(line) && letters(line) < 4) continue; // állapotsor / idő
    if (/\d\s*(EUR|USD|€|\$)/i.test(line)) continue; // másodlagos devizás sor
    if (isSubtitle(line)) continue;
    if (letters(line) >= 2 && line.length <= 48) candidates.push(line);
  }

  return out;
}
