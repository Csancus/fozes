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
  /** a bank saját kategória-címkéje, ha látszik (Erste: „Élelmiszer”) */
  bankCategory?: string;
};

// Ismert láncok: a terminál-/bolt-azonosítós név helyett a márkanév (Story 10.2).
const CHAINS: [RegExp, string][] = [
  [/\blidl\b|igazan megeri/, "Lidl"],
  [/\baldi\b/, "Aldi"],
  [/\bspar\b/, "Spar"],
  [/\btesco\b/, "Tesco"],
  [/\bauchan\b/, "Auchan"],
  [/\bpenny\b/, "Penny"],
  [/\bcba\b/, "CBA"],
  [/\bmc ?donald'?s?\b/, "McDonald's"],
  [/\bburger ?king\b/, "Burger King"],
  [/\bkfc\b/, "KFC"],
  [/\brossmann\b/, "Rossmann"],
  [/\bdm\b.*drogerie|\bdm-drogerie/, "dm"],
  [/\bmol\b/, "MOL"],
  [/\bshell\b/, "Shell"],
  [/\bomv\b/, "OMV"],
  [/\bikea\b/, "IKEA"],
  [/\bdecathlon\b/, "Decathlon"],
  [/\bmedia ?markt\b/, "MediaMarkt"],
  [/\bwolt\b/, "Wolt"],
  [/\bfoodora\b|\bfoodpanda\b/, "Foodora"],
  [/\bbolt\.eu\b|\bbolt ride\b/, "Bolt"],
  [/\bnetflix\b/, "Netflix"],
  [/\bspotify\b/, "Spotify"],
  [/\bmuller\b/, "Müller"],
];

/** Boltnév egységesítése: láncnév, a végéről terminál-/boltszám, az elejéről beragadt számjegy le. */
export function normalizeMerchant(s: string): string {
  // „3LIDL” → „LIDL”: a nagybetűs szó elé ragadt 1–2 számjegy zaj
  const t = s.replace(/^\d{1,2}(?=\p{Lu}{2})/u, "").trim();
  const f = fold(t);
  for (const [re, name] of CHAINS) if (re.test(f)) return name;
  // a végén lévő hosszú szám (terminál-azonosító) le: „Perem Bisztro 3480006” → „Perem Bisztro”
  const stripped = t.replace(/(\s+\d{3,})+$/, "").trim();
  return letters(stripped) >= 2 ? stripped : t;
}

// Bank-kategória címkék (Erste, George, OTP stb. pirulái a tétel alatt).
const BANK_CATEGORIES = [
  "élelmiszer", "szórakozás", "éttermek és kávézók", "étterem", "közösségi közlekedés",
  "közlekedés", "üzemanyag", "vásárlás", "ruházat", "egészség", "szépségápolás",
  "rezsi", "lakás", "otthon", "utazás", "szállás", "sport", "oktatás", "előfizetések",
  "előfizetés", "egyéb", "pénzügyek", "készpénz", "ajándék", "gyerek", "háziállat",
  "autó", "telekommunikáció", "digitális szolgáltatások", "biztosítás",
].map((c) => fold(c));
function bankCategoryOf(line: string): string | null {
  const f = fold(line).replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!f || f.split(" ").length > 4) return null;
  return BANK_CATEGORIES.includes(f) ? line.replace(/^[^\p{L}]+|[^\p{L}]+$/gu, "") : null;
}

function today(now: Date): string {
  return isoDay(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// Kihagyandó (nem bolt / nem tétel / egyenleg) sorok.
const SKIP_RE =
  /(ref\.?:|hitelkártya haszn|hitelkartya haszn|zárolt|egyenleg|számlacsomag|funkci|informáci|feltöltött pénz|elérhető|rendelkezésre|\bbalance\b|\bIBAN\b|HU\d{2}\b)/i;
// Nem kiadás/bevétel: pénzváltás saját számlák között („HUF → CZK”), Revolut aprópénz-megtakarítás / széf.
const CUR = "(?:HUF|CZK|EUR|USD|GBP|PLN|RON|CHF)";
const NON_TX_RE = new RegExp(
  String.raw`\b[A-Z]{3}\s*(?:→|->|—>|=>|>|»)\s*[A-Z]{3}\b|\b${CUR}\s*[-–—~]+\s*${CUR}\b|` +
    String.raw`apr[oó]p[eé]nz|megtakar[ií]t[aá]s|\bvault\b|\bsz[eé]f\b`,
  "i"
);
// Másodlagos deviza-összeg: „-1 463 Kč”, „+6 648,16 Kč”, „12,50 EUR”, „€12.50”.
const FOREIGN_AMOUNT_RE =
  /[+\-]?\s?(?:\d{1,3}(?:[ .]\d{3})+|\d+)(?:[,.]\d{1,2})?\s*(?:K[čcöoóeé0]|CZK|EUR|€|USD|\$|GBP|£|PLN|zł|zl|RON|lei|CHF)(?![\p{L}])|(?:€|\$|£)\s?\d+(?:[,.]\d{1,2})?/giu;
// Egyenleg-címke: a következő összeg-sor sem tétel.
const BALANCE_LABEL_RE = /^(egyenleg|aktuális egyenleg|elérhető egyenleg|számlaegyenleg|balance|total balance)\b/i;
// Hónap + év szekció-fejléc („November 2026”, „ebben a hónapban”).
const SECTION_RE =
  /^(jan|feb|mar|apr|maj|jun|jul|aug|sze|sep|okt|oct|nov|dec)[a-z]*\.?\s?20\d{2}$|ebben a hon|elozo hon|this month|last month/;
// Tétel alatti alcím: típus + idő („Kártyás vásárlás · 14:26”).
const GENERIC_RE =
  /^(kartyas vasarlas|vasarlas|atutalas|keszpenzfelvetel|keszpenz felvetel|elofizetes|jovairas|terheles|beerkezo|kimeno|card payment|transfer|pending|folyamatban|fuggo)/;
const TRAILING_TIME_RE = /(?:^|[·•\-:.,|]\s*|\s)([01]?\d|2[0-3])[:.\-]?([0-5]\d)\s*$/;

// Revolut-alsor: „19:08 · -16,48 Ft” (idő + váltási díj; az OCR a „·”-ot „-”-nak olvassa) – nem tétel.
// Elöl lehet egy rövid ikon-zaj token („KORA 14:44 - -75,24 Ft”).
const FEE_LINE_RE = /^(?:\S{1,5}\s+)?([01]?\d|2[0-3])[:.][0-5]\d\s*[-–·•.+]*\s*[-+]?\s?\d/;

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
  // elöl ikonból olvasott zaj-token: betű nélküli („<2’”, „==”), írásjeles vagy kisbetűs
  // 1–2 betűs („o Bakeshop”, „fo! GoBuda”, „sm Strahov”), vagy két nagybetű egy
  // Nagybetűs szó előtt („MW Havelska”)
  for (let i = 0; i < 2; i++) {
    t = t
      .replace(/^(?:[^\p{L}\s]+\s+)+(?=\S)/u, "")
      .replace(/^(?:\p{L}{1,2}|\S{1,2}[^\p{L}\p{N}\s])\s+(?=\p{Lu}\p{Ll}{2})/u, "")
      .replace(/^(?:\p{Ll}{1,2}[^\p{L}\s]?|\S{1,2}[^\p{L}\p{N}\s])\s+(?=\p{Lu})/u, "");
  }
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
  const merchant = normalizeMerchant(cleanMerchant(head.find((l) => COMPANY_RE.test(l)) ?? head[0] ?? "Blokk"));
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

function detectDateAfter(lines: string[], now: Date): boolean {
  for (const line of lines) {
    const amounts = findAmounts(line);
    if (amounts.length) {
      if (SKIP_RE.test(line)) continue;
      const rest = line.slice(0, amounts[amounts.length - 1].index);
      if (letters(rest) >= 2) return true; // név + összeg egy sorban, előtte nem volt dátum
      continue;
    }
    const d = findDate(line, now);
    if (d) {
      // csak-dátum sor (a „Ma”/„Tegnap” fejléc is) a tételek ELŐTT → fejléc-mód
      const rest = line.slice(0, d.index) + line.slice(d.end);
      if (letters(rest) < 3) return false;
    }
  }
  return false;
}

export function parseBankText(text: string, now: Date = new Date()): ParsedTx[] {
  const lines = cleanOcrText(text)
    .split("\n")
    // Másodlagos devizás összeg (Revolut: „-1 463 Kč” a forint alatt) – csak a forint számít (Story 10.4).
    .map((l) => l.replace(FOREIGN_AMOUNT_RE, " ").replace(/\s{2,}/g, " ").trim())
    .filter(Boolean);
  // A telefon állapotsora (óra + ikonok + akku: „21:48 … 71%”, OCR-rel gyakran „2148 … 7158”) nem tétel-név.
  if (lines.length && /^\d{1,2}[:.]?\d{2}\b/.test(lines[0]) && !findAmounts(lines[0]).length && !findDate(lines[0], now)) {
    lines.shift();
  }

  const receipt = parseReceipt(lines, now);
  if (receipt) return [receipt];

  let currentDay = today(now);
  // Elrendezés: a dátum a tétel FELETT (fejléc – K&H, OTP) vagy ALATTA (Erste: név+összeg, dátum, típus, kategória).
  // Ha az első tétel-sor előbb jön, mint az első csak-dátum sor, „alatta” módban vagyunk.
  const dateAfter = detectDateAfter(lines, now);
  let lastTx: ParsedTx | null = null;
  let lastTxHasDate = false;
  const undated = new Set<ParsedTx>();
  let candidates: string[] = []; // az utolsó összeg óta látott név-jelöltek
  let afterBalanceLabel = false;
  // Revolut: a hosszú név második sora („McCarthy's Irish -13 260,62 Ft” / „Pub”) közvetlenül a tétel-sor után.
  let canContinueName = false;
  const out: ParsedTx[] = [];

  for (const line of lines) {
    const low = fold(line);
    const amounts = findAmounts(line);
    const continuation = canContinueName;
    canContinueName = false;
    const contLine = continuation ? cleanMerchant(line) : "";
    if (
      continuation &&
      lastTx &&
      !amounts.length &&
      !/\d/.test(contLine) &&
      letters(line) >= 2 &&
      line.length <= 30 &&
      !isSubtitle(line) &&
      !bankCategoryOf(line) &&
      !SKIP_RE.test(line) &&
      !SECTION_RE.test(low.trim())
    ) {
      lastTx.merchant = normalizeMerchant(cleanMerchant(`${lastTx.merchant} ${contLine}`));
      continue;
    }

    // Dátum / szekció-kontextus (a sor lényegében csak dátum).
    if (!amounts.length) {
      const d = findDate(line, now);
      const rest = d ? line.slice(0, d.index) + line.slice(d.end) : line;
      if (d && letters(rest) < 3) {
        if (dateAfter) {
          if (lastTx && !lastTxHasDate) {
            lastTx.day = d.day;
            lastTxHasDate = true;
            undated.delete(lastTx);
          }
        } else currentDay = d.day;
        candidates = [];
        continue;
      }
      const cat = bankCategoryOf(line);
      if (cat) {
        if (dateAfter && lastTx && !lastTx.bankCategory) lastTx.bankCategory = cat;
        continue;
      }
      if (SECTION_RE.test(low.trim())) {
        candidates = [];
        continue;
      }
    }

    if (amounts.length && FEE_LINE_RE.test(line)) continue;

    if (amounts.length) {
      const balance = afterBalanceLabel || SKIP_RE.test(line) || NON_TX_RE.test(line);
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
      merchant = normalizeMerchant(cleanMerchant(merchant));
      // állapotsor-zaj („2148 SH ® & RR » =u”, „… 71%”): sok írásjel vagy akku-százalék
      const symbols = (merchant.match(/[^\p{L}\p{N}\s.'’&\-]/gu) ?? []).length;
      const statusBar = symbols > letters(merchant) * 0.3 || /\d\s?%/.test(`${residual} ${merchant}`);
      if (letters(merchant) >= 2 && !statusBar) {
        const hasInline = Boolean(inlineDate && !inlineDate.relative);
        lastTx = {
          kind: a.sign === "+" ? "income" : "expense",
          amount: a.value,
          merchant,
          day: hasInline ? inlineDate!.day : currentDay,
          note: "",
        };
        lastTxHasDate = hasInline;
        if (!hasInline) undated.add(lastTx);
        out.push(lastTx);
        // csak ha a név ugyanebben a sorban volt (nem a fölötte lévő jelöltből)
        canContinueName = !subtitle && letters(residual) >= 2;
      }
      candidates = [];
      continue;
    }

    // Nem összeg-sor: lehet-e bolt-jelölt?
    if (BALANCE_LABEL_RE.test(line)) {
      afterBalanceLabel = true;
      continue;
    }
    if (SKIP_RE.test(line) || NON_TX_RE.test(line)) continue;
    if (/^\d{1,2}[:.]\d{2}\b/.test(line) && letters(line) < 4) continue; // állapotsor / idő
    if (/\d\s*(EUR|USD|€|\$)/i.test(line)) continue; // másodlagos devizás sor
    if (isSubtitle(line)) continue;
    if (letters(line) >= 2 && line.length <= 48) candidates.push(line);
  }

  // „Alatta” módban a dátumát elvesztett tétel (OCR-hiba: „5026.08. 05.”) a következő
  // tétel napját kapja – a lista időrendben csökken, így ez a legközelebbi ismert nap.
  if (dateAfter && undated.size) {
    let next: string | null = null;
    for (let i = out.length - 1; i >= 0; i--) {
      if (undated.has(out[i])) {
        if (next) out[i].day = next;
      } else next = out[i].day;
    }
  }
  return out;
}

/**
 * A bank kategória-címkéjéhez a háztartás saját kategóriája (Story 10.2):
 * pontos vagy részleges név-egyezés ékezet nélkül, plusz néhány szinonima.
 */
const CATEGORY_SYNONYMS: Record<string, string[]> = {
  elelmiszer: ["elelmiszer", "bevasarlas", "kaja", "elelmiszerek", "elelem"],
  "ettermek es kavezok": ["etterem", "ettermek", "kavezo", "vendeglatas", "kajaldak"],
  szorakozas: ["szorakozas", "program", "mozi", "kultura", "szabadido"],
  "kozossegi kozlekedes": ["kozlekedes", "berlet", "bkv"],
  kozlekedes: ["kozlekedes", "auto", "uzemanyag"],
  uzemanyag: ["uzemanyag", "benzin", "auto", "kozlekedes"],
};
export function matchCategory(
  bankCategory: string | undefined,
  categories: { id: string; name: string }[]
): string {
  if (!bankCategory) return "";
  const b = fold(bankCategory).trim();
  const words = [b, ...(CATEGORY_SYNONYMS[b] ?? [])];
  const norm = categories.map((c) => ({ id: c.id, n: fold(c.name).trim() }));
  for (const w of words) {
    const exact = norm.find((c) => c.n === w);
    if (exact) return exact.id;
  }
  for (const w of words) {
    const part = norm.find((c) => c.n.includes(w) || w.includes(c.n));
    if (part && part.n.length >= 3) return part.id;
  }
  return "";
}
