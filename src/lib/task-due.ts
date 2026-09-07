// Teendő-határidő: dátum (YYYY-MM-DD) + OPCIONÁLIS időpont (HH:MM).
// Idő nélkül a teendő „egész napos": a nap folyamán még nem lejárt, és a
// rendezésben a napja végére kerül.

const DOW_SHORT = ["vas", "hét", "kedd", "sze", "csüt", "pén", "szo"];
const DOW_LONG = [
  "vasárnap",
  "hétfő",
  "kedd",
  "szerda",
  "csütörtök",
  "péntek",
  "szombat",
];

export function todayStr(offsetDays = 0): string {
  const d = new Date();
  if (offsetDays) d.setDate(d.getDate() + offsetDays);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export function nowTimeStr(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

// „14:5" / „14.05" / „1405" → „14:05"; érvénytelen vagy üres → null.
export function parseDueTime(raw: unknown): string | null {
  const v = String(raw ?? "").trim();
  if (!v) return null;
  const m = v.match(/^(\d{1,2})[:.\s]?(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]);
  const min = Number(m[2]);
  if (h > 23 || min > 59) return null;
  return `${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`;
}

// Rövid címke a chipekre: „Ma 14:00" / „9. 8. (pén)".
export function fmtDue(date: string, time?: string | null): string {
  const [y, m, d] = date.split("-").map(Number);
  let label: string;
  if (date === todayStr()) label = "Ma";
  else if (date === todayStr(1)) label = "Holnap";
  else if (date === todayStr(-1)) label = "Tegnap";
  else label = `${m}. ${d}. (${DOW_SHORT[new Date(y, m - 1, d).getDay()]})`;
  return time ? `${label} ${time}` : label;
}

// Hosszú címke a teendő-oldalra: „2026. 9. 8. (hétfő) 14:00".
export function fmtDueLong(date: string, time?: string | null): string {
  const [y, m, d] = date.split("-").map(Number);
  const base = `${y}. ${m}. ${d}. (${DOW_LONG[new Date(y, m - 1, d).getDay()]})`;
  return time ? `${base} ${time}` : base;
}

// Lejárt-e: a dátum a mai előtt van, vagy ma van és az időpont már elmúlt.
// Az egész napos (idő nélküli) teendő a nap végéig nem lejárt.
export function isOverdue(
  date: string | null,
  time?: string | null
): boolean {
  if (!date) return false;
  const today = todayStr();
  if (date < today) return true;
  if (date > today) return false;
  return !!time && time < nowTimeStr();
}

// Rendezési kulcs: idő nélküli határidő a napja végére kerül.
export function dueKey(date: string | null, time?: string | null): string {
  if (!date) return "9999-99-99T99:99";
  return `${date}T${time ?? "23:59"}`;
}

// Két határidő összehasonlítása (dátum, majd időpont szerint).
export function compareDue(
  a: { dueDate: string | null; dueTime?: string | null },
  b: { dueDate: string | null; dueTime?: string | null }
): number {
  return dueKey(a.dueDate, a.dueTime).localeCompare(dueKey(b.dueDate, b.dueTime));
}
