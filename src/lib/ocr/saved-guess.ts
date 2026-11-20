// Story 10.1 – képből (OCR-szövegből) bakancslista-tétel mezőinek kitalálása:
// cím, típus, hely, linkek, jegyzet. A régi heurisztika a leghosszabb sort vette
// címnek (gyakran a leírás-mondatot), és csak http(s)-es linket ismert fel.

import type { SavedType } from "../types";
import { cleanOcrText, fold } from "./postprocess";

export type SavedGuess = {
  title: string;
  kind: string;
  location: string;
  links: { url: string; label: string }[];
  note: string;
};

const TLDS =
  "hu|com|net|org|eu|io|co|me|ee|be|tv|ly|gl|to|fm|ai|dev|at|de|ro|sk|hr|rs|si|cz|pl|it|es|fr|uk|info|app|page|link|travel|shop|bar|cafe|restaurant";
// http(s)-es link VAGY csupasz domain (bistrofrank.hu/foglalas, linktr.ee/x).
const LINK_RE = new RegExp(
  String.raw`(?<![@\w.])(?:https?:\/\/)?(?:www\.)?(?:[a-z0-9-]+\.)+(?:${TLDS})\b(?:\/[^\s()<>"']*)?`,
  "gi"
);

export function extractLinks(text: string): string[] {
  const found = text.match(LINK_RE) ?? [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of found) {
    const u = raw.replace(/[.,;:!?)]+$/, "");
    // hashtag/fájlnév-szerű álpozitívok kiszűrése (pl. „Netflix.com” egy bank-listán itt nem gond)
    if (!/^https?:\/\//i.test(u) && !/[a-z]{2,}\.[a-z]{2,}/i.test(u)) continue;
    const url = /^https?:\/\//i.test(u) ? u : `https://${u}`;
    const key = url.toLowerCase().replace(/^https?:\/\/(www\.)?/, "").replace(/\/+$/, "");
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(url);
  }
  return out.slice(0, 5);
}

export function detectLinkKind(url: string): string | null {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "video";
  if (u.includes("/maps") || u.includes("maps.app") || u.includes("goo.gl/maps")) return "helyszin";
  if (u.includes("imdb.com") || u.includes("netflix.com")) return "film";
  if (u.includes("moly.hu") || u.includes("goodreads.com")) return "konyv";
  if (u.includes("booking.com") || u.includes("airbnb.") || u.includes("tripadvisor.")) return "utazas";
  return null;
}

// Kulcsszavak ékezet nélkül (az OCR gyakran elhagyja az ékezetet).
const KEYWORDS: { kind: string; words: string[] }[] = [
  {
    kind: "etterem",
    words: ["etterem", "restaurant", "bisztro", "bistro", "kavezo", "cafe", "cukraszda", "vendeglo", "pizzeria", "pizza", "menu", "foglalas", "brunch", "reggelizo", "burger", "kave", "bar ", "borozo", "sorozo", "kifozde", "street food", "etlap"],
  },
  {
    kind: "utazas",
    words: ["hotel", "szalloda", "apartman", "repulo", "repjegy", "flight", "jarat", "booking", "airbnb", "nyaralas", "utazas", "szallas", "panzio", "wellness"],
  },
  { kind: "film", words: ["film", "sorozat", "evad", "epizod", "imdb", "netflix", "mozi", "hbo", "premier"] },
  { kind: "konyv", words: ["konyv", "regeny", "szerzo", "kiado", "goodreads", "moly"] },
  {
    kind: "helyszin",
    words: ["latnivalo", "kilato", "muzeum", "kiallitas", "park", "vizeses", "templom", "tura", "turaut", "barlang", "var ", "kastely", "strand", "to "],
  },
];

// Magyar cím: irányítószám + település, vagy utca/út/tér stb.
const POSTCODE_RE = /\b[1-9]\d{3}\s+[A-ZÁÉÍÓÖŐÚÜŰ][\p{L}-]+/u;
const STREET_RE =
  /\b(utca|u\.|út|útja|körút|krt\.?|tér|tere|sor|sétány|rakpart|köz|fasor|street|str\.|avenue|road|square|platz|strasse|straße)\b/iu;
const LABEL_RE = /^(c[ií]m|address|helysz[ií]n|hely|location|webhely|website|weboldal|telefon|phone|nyitva|bez[áa]r)\s*:\s*/i;

function lettersRatio(s: string): number {
  const t = s.replace(/\s/g, "");
  if (!t) return 0;
  return (t.match(/\p{L}/gu) ?? []).length / t.length;
}

// Nem cím-jelölt sorok: lájk-szám, „2 napja”, hashtagek, értékelés, állapotsor, címke-sorok.
function isNoiseLine(l: string): boolean {
  const f = fold(l);
  if (/^\d[\d\s.,]*\s*(kedveles|likes?|megtekintes|views|hozzaszolas|comments?)\b/.test(f)) return true;
  if (/^\d+\s*(perce|oraja|napja|hete|honapja|eve|h|d|w|m)\b/.test(f)) return true;
  if (/^(#\S+\s*)+$/.test(l)) return true;
  if (/^[\d.,]+\s*[★☆*k✩-]/.test(l) || /\(\d[\d\s.,]*\)\s*$/.test(l)) return true;
  if (/^\d{1,2}[:.]\d{2}\b/.test(l)) return true;
  if (LABEL_RE.test(l)) return true;
  if (/^(kovetes|follow|uzenet|message|megosztas|share|mentes|save|tovabbi|more)$/.test(f)) return true;
  return false;
}

function findUsername(lines: string[]): string | null {
  for (const l of lines.slice(0, 4)) {
    const m = l.match(/^(?:\S{1,2}\s)?([a-z0-9][a-z0-9._]{2,29})$/);
    if (m && /[._]/.test(m[1])) return m[1];
  }
  return null;
}

function pickTitle(lines: string[]): string {
  const user = findUsername(lines);
  if (user) {
    // Instagram: „felhasználónév Megjelenő Név …” a képaláírás eleje.
    const loose = user.replace(/[._]/g, "[._ ]?");
    const re = new RegExp(`^${loose}\\s+(.+)$`, "i");
    for (const l of lines) {
      const m = l.match(re);
      if (m && lettersRatio(m[1]) > 0.6) {
        const caption = m[1].split(/[.!?|•·–-]\s/)[0].trim();
        if (caption.length >= 3 && caption.length <= 60) return caption;
      }
    }
  }
  // A fejléc-sor (felhasználónév) gyakran elvész; a képaláírás eleje akkor is
  // „bistro_frank Bisztró Frank” (vagy OCR-rel „bistro. frank Bisztró Frank”).
  for (const l of lines.slice(0, 6)) {
    const m = l.match(/^([a-z0-9]+(?:[._]\s?[a-z0-9]+)+)\s+([A-ZÁÉÍÓÖŐÚÜŰ].*)$/u);
    if (m) {
      const caption = m[2].split(/[.!?|•·–-]\s/)[0].trim();
      if (caption.length >= 3 && caption.length <= 60 && lettersRatio(caption) > 0.6) return caption;
    }
  }
  const cands = lines
    .slice(0, 8)
    .map((l, i) => ({ l: l.replace(/^[^\p{L}\p{N}]+/u, "").trim(), i }))
    .filter(({ l }) => l.length >= 3 && l.length <= 70 && lettersRatio(l) >= 0.6 && !isNoiseLine(l))
    .filter(({ l }) => !(user && fold(l).replace(/[ ._]/g, "") === user.replace(/[._]/g, "")));
  let best: { l: string; score: number } | null = null;
  for (const { l, i } of cands) {
    let score = 10 - i * 1.5;
    if (/^[A-ZÁÉÍÓÖŐÚÜŰ0-9]/.test(l)) score += 2;
    if (/[.!?]$/.test(l)) score -= 4; // mondat, nem név
    const words = l.split(/\s+/);
    if (words.length > 8) score -= 4;
    const caps = words.filter((w) => /^[A-ZÁÉÍÓÖŐÚÜŰ]/.test(w)).length;
    if (caps >= Math.ceil(words.length / 2)) score += 2; // Cím Szerű Név
    if (POSTCODE_RE.test(l) || STREET_RE.test(l)) score -= 5;
    if (!best || score > best.score) best = { l, score };
  }
  return best?.l ?? lines[0] ?? "";
}

function pickLocation(lines: string[], title: string): string {
  const strip = (l: string) => l.replace(/^[^\p{L}\p{N}]+/u, "").replace(LABEL_RE, "").trim();
  const withPost = lines.find((l) => l !== title && POSTCODE_RE.test(strip(l)));
  if (withPost) return strip(withPost).slice(0, 120);
  const labelled = lines.find((l) => /^(c[ií]m|address|helysz[ií]n|location)\s*:/i.test(strip(l.replace(/^[^\p{L}]+/u, ""))) || /^(c[ií]m|address)\s*:/i.test(l));
  if (labelled) return strip(labelled).slice(0, 120);
  const street = lines.find((l) => l !== title && STREET_RE.test(l) && /\d/.test(l) && l.length <= 90);
  return street ? strip(street).slice(0, 120) : "";
}

export function guessSavedFromText(raw: string, types: SavedType[]): SavedGuess {
  const text = cleanOcrText(raw);
  const known = (id: string) => types.some((t) => t.id === id);
  const urls = extractLinks(text);
  const links = urls.map((url) => ({ url, label: "" }));
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const nonLink = lines.filter((l) => !l.match(LINK_RE));

  let kind = "";
  for (const u of urls) {
    const k = detectLinkKind(u);
    if (k && known(k)) {
      kind = k;
      break;
    }
  }
  if (!kind) {
    const hay = ` ${fold(text)} `;
    let best: { kind: string; hits: number } | null = null;
    for (const g of KEYWORDS) {
      const hits = g.words.reduce((n, w) => (hay.includes(w) ? n + 1 : n), 0);
      if (hits > 0 && (!best || hits > best.hits)) best = { kind: g.kind, hits };
    }
    if (best && known(best.kind)) kind = best.kind;
  }
  if (!kind && urls.length && known("cikk")) kind = "cikk";
  if (!kind) kind = known("egyeb") ? "egyeb" : types[0]?.id ?? "egyeb";

  const title = pickTitle(nonLink.length ? nonLink : lines);
  const location = pickLocation(lines, title);
  return { title, kind, location, links, note: text.trim().slice(0, 2000) };
}
