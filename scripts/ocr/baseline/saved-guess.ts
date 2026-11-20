// Story 10.1 – a régi (10.1 előtti) bakancslista-heurisztika, csak a méréshez (baseline).
import type { SavedType } from "@/lib/types";
const URL_RE = /\bhttps?:\/\/[^\s()<>"']+/gi;
function detectLinkKind(url: string): string | null {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "video";
  if (u.includes("/maps") || u.includes("maps.app") || u.includes("goo.gl/maps"))
    return "helyszin";
  if (u.includes("imdb.com") || u.includes("netflix.com")) return "film";
  if (u.includes("moly.hu") || u.includes("goodreads.com")) return "konyv";
  if (u.includes("booking.com") || u.includes("airbnb.") || u.includes("tripadvisor."))
    return "utazas";
  return "cikk";
}

const KEYWORDS: { kind: string; words: string[] }[] = [
  { kind: "etterem", words: ["étterem", "etterem", "restaurant", "bisztró", "bistro", "kávézó", "kavezo", "cukrászda", "vendéglő", "pizzéria", "pizza", "menü", "foglalás"] },
  { kind: "utazas", words: ["hotel", "szálloda", "apartman", "repülő", "repjegy", "flight", "járat", "booking", "airbnb", "nyaralás", "utazás", "túra", "szállás"] },
  { kind: "film", words: ["film", "sorozat", "évad", "epizód", "imdb", "netflix", "mozi"] },
  { kind: "konyv", words: ["könyv", "regény", "szerző", "kiadó", "goodreads"] },
  { kind: "helyszin", words: ["látnivaló", "kilátó", "múzeum", "kiállítás", "park", "vízesés", "templom"] },
];

const ADDRESS_RE =
  /(\b\d{4}\b|\butca\b|\bútja?\b|\bköru?t\b|\bkrt\.?\b|\btér\b|\bstreet\b|\bstr\.\b|\bavenue\b|\broad\b)/i;

export function guessFromText(raw: string, types: SavedType[]) {
  const text = raw.replace(/\r/g, "");
  const lower = text.toLowerCase();
  const urls = Array.from(new Set(text.match(URL_RE) ?? [])).slice(0, 5);
  const links = urls.map((url) => ({ url, label: "" }));

  const known = (id: string) => types.some((t) => t.id === id);
  let kind = "egyeb";
  if (urls.length > 0) {
    const k = detectLinkKind(urls[0]);
    if (k && known(k)) kind = k;
  }
  if (kind === "egyeb" || kind === "cikk") {
    let best: { kind: string; hits: number } | null = null;
    for (const g of KEYWORDS) {
      const hits = g.words.reduce((n, w) => (lower.includes(w) ? n + 1 : n), 0);
      if (hits > 0 && (!best || hits > best.hits)) best = { kind: g.kind, hits };
    }
    if (best && known(best.kind)) kind = best.kind;
  }
  if (!known(kind)) kind = types[0]?.id ?? "egyeb";

  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !URL_RE.test(l));
  const titleCandidates = lines
    .slice(0, 5)
    .filter((l) => /[a-zà-ú]/i.test(l) && l.length >= 3 && l.length <= 90);
  const title =
    titleCandidates.sort((a, b) => b.length - a.length)[0] ?? lines[0] ?? "";
  const location =
    lines.find((l) => l !== title && ADDRESS_RE.test(l))?.slice(0, 120) ?? "";

  return { title, kind, location, links, note: text.trim().slice(0, 2000) };
}

