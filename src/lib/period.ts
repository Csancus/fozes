// Story 9.1 – „Aktuális” oldal időszak-választója: nap / hét / hónap.
// Tiszta függvények, YYYY-MM-DD szövegekkel (helyi idő, mint a todayStr()).

export type PeriodKind = "day" | "week" | "month";

export type Period = {
  kind: PeriodKind;
  /** az időszak első napja (YYYY-MM-DD) */
  start: string;
  /** az időszak utolsó napja (YYYY-MM-DD, zárt) */
  end: string;
  /** a kiválasztás horgonya: nap → az a nap, hét → hétfő, hónap → 1-je */
  anchor: string;
  /** a mai napot tartalmazza-e */
  isCurrent: boolean;
};

const MONTHS = [
  "január", "február", "március", "április", "május", "június",
  "július", "augusztus", "szeptember", "október", "november", "december",
];
const MONTHS_SHORT = [
  "jan.", "febr.", "márc.", "ápr.", "máj.", "jún.",
  "júl.", "aug.", "szept.", "okt.", "nov.", "dec.",
];
const DOW_LONG = ["vasárnap", "hétfő", "kedd", "szerda", "csütörtök", "péntek", "szombat"];

const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
const MONTH_RE = /^\d{4}-\d{2}$/;

function pad(n: number) {
  return String(n).padStart(2, "0");
}
export function toStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
export function fromStr(s: string): Date {
  const [y, m, d] = s.split("-").map(Number);
  return new Date(y, m - 1, d);
}
function isValidDate(s: string): boolean {
  if (!DATE_RE.test(s)) return false;
  return toStr(fromStr(s)) === s;
}
export function addDays(s: string, n: number): string {
  const d = fromStr(s);
  d.setDate(d.getDate() + n);
  return toStr(d);
}
/** A hét hétfője (magyar hét). */
export function mondayOf(s: string): string {
  const d = fromStr(s);
  const dow = (d.getDay() + 6) % 7; // hétfő = 0
  return addDays(s, -dow);
}
function monthStart(s: string): string {
  return s.slice(0, 8) + "01";
}
function monthEnd(s: string): string {
  const d = fromStr(monthStart(s));
  return toStr(new Date(d.getFullYear(), d.getMonth() + 1, 0));
}

export function makePeriod(kind: PeriodKind, date: string, today: string): Period {
  let start: string, end: string;
  if (kind === "day") {
    start = end = date;
  } else if (kind === "week") {
    start = mondayOf(date);
    end = addDays(start, 6);
  } else {
    start = monthStart(date);
    end = monthEnd(date);
  }
  return { kind, start, end, anchor: start, isCurrent: start <= today && today <= end };
}

/**
 * URL-paraméterekből: ?nap=YYYY-MM-DD | ?het=YYYY-MM-DD | ?ho=YYYY-MM.
 * Hiányzó vagy hibás érték → a mai nap.
 */
export function parsePeriod(
  sp: { nap?: string; het?: string; ho?: string },
  today: string
): Period {
  if (sp.ho && MONTH_RE.test(sp.ho) && isValidDate(`${sp.ho}-01`)) {
    return makePeriod("month", `${sp.ho}-01`, today);
  }
  if (sp.het && isValidDate(sp.het)) return makePeriod("week", sp.het, today);
  if (sp.nap && isValidDate(sp.nap)) return makePeriod("day", sp.nap, today);
  return makePeriod("day", today, today);
}

/** Az időszak URL-je az /ma oldalon. A mai nap a paraméter nélküli alap-URL. */
export function periodHref(p: Pick<Period, "kind" | "anchor">, today: string): string {
  if (p.kind === "day") return p.anchor === today ? "/ma" : `/ma?nap=${p.anchor}`;
  if (p.kind === "week") return `/ma?het=${p.anchor}`;
  return `/ma?ho=${p.anchor.slice(0, 7)}`;
}

/** Előző / következő időszak ugyanabban a nézetben. */
export function shiftPeriod(p: Period, dir: 1 | -1, today: string): Period {
  if (p.kind === "day") return makePeriod("day", addDays(p.anchor, dir), today);
  if (p.kind === "week") return makePeriod("week", addDays(p.anchor, 7 * dir), today);
  const d = fromStr(p.anchor);
  return makePeriod("month", toStr(new Date(d.getFullYear(), d.getMonth() + dir, 1)), today);
}

export function periodLabel(p: Period, today: string): string {
  const s = fromStr(p.start);
  const e = fromStr(p.end);
  if (p.kind === "day") {
    const base = `${s.getFullYear()}. ${MONTHS[s.getMonth()]} ${s.getDate()}., ${DOW_LONG[s.getDay()]}`;
    if (p.start === today) return `Ma · ${base}`;
    if (p.start === addDays(today, 1)) return `Holnap · ${base}`;
    if (p.start === addDays(today, -1)) return `Tegnap · ${base}`;
    return base;
  }
  if (p.kind === "week") {
    const sameMonth = s.getMonth() === e.getMonth();
    const range = sameMonth
      ? `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()}–${e.getDate()}.`
      : `${MONTHS_SHORT[s.getMonth()]} ${s.getDate()}. – ${MONTHS_SHORT[e.getMonth()]} ${e.getDate()}.`;
    return `${p.isCurrent ? "Ez a hét · " : ""}${s.getFullYear()}. ${range}`;
  }
  return `${p.isCurrent ? "Ez a hónap · " : ""}${s.getFullYear()}. ${MONTHS[s.getMonth()]}`;
}

/** A naptárrács napjai egy hónaphoz: hétfőtől vasárnapig, teljes hetekkel. */
export function monthGrid(monthAnchor: string): string[] {
  const first = monthStart(monthAnchor);
  const last = monthEnd(monthAnchor);
  const days: string[] = [];
  let d = mondayOf(first);
  const stop = addDays(mondayOf(last), 6);
  while (d <= stop) {
    days.push(d);
    d = addDays(d, 1);
  }
  return days;
}
