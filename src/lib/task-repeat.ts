import type { TaskRepeat, TaskRepeatUnit } from "./types";

// Dátum-matek YYYY-MM-DD stringeken (időzóna-mentesen, mint a többi modulban).
function parse(d: string): { y: number; m: number; day: number } {
  const [y, m, day] = d.split("-").map(Number);
  return { y, m, day };
}
function fmt(y: number, m: number, day: number): string {
  return `${y}-${String(m).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}
function daysInMonth(y: number, m: number): number {
  return new Date(y, m, 0).getDate();
}

export function todayStr(now = new Date()): string {
  return fmt(now.getFullYear(), now.getMonth() + 1, now.getDate());
}

// Egy lépés előre a szabály szerint. Hónap/év léptetésnél a hónap végét
// levágja (jan 31 + 1 hónap → feb 28/29), nem csúszik át a következő hóra.
export function addInterval(date: string, repeat: TaskRepeat): string {
  const { y, m, day } = parse(date);
  const n = Math.max(1, Math.round(repeat.every));
  if (repeat.unit === "day" || repeat.unit === "week") {
    const step = repeat.unit === "week" ? 7 * n : n;
    const d = new Date(y, m - 1, day + step);
    return fmt(d.getFullYear(), d.getMonth() + 1, d.getDate());
  }
  const months = repeat.unit === "month" ? n : 12 * n;
  const total = (y * 12 + (m - 1)) + months;
  const ny = Math.floor(total / 12);
  const nm = (total % 12) + 1;
  return fmt(ny, nm, Math.min(day, daysInMonth(ny, nm)));
}

// A következő esedékesség: a megadott dátumtól lépteti, amíg a jövőbe (vagy
// mára) nem ér — így a régen elmaradt ismétlődő teendő sem generál sorozatot.
export function nextDueDate(
  from: string | null,
  repeat: TaskRepeat,
  today = todayStr()
): string {
  let d = addInterval(from ?? today, repeat);
  let guard = 0;
  while (d < today && guard < 400) {
    d = addInterval(d, repeat);
    guard += 1;
  }
  return d;
}

const UNIT_ONE: Record<TaskRepeatUnit, string> = {
  day: "Naponta",
  week: "Hetente",
  month: "Havonta",
  year: "Évente",
};
const UNIT_MANY: Record<TaskRepeatUnit, string> = {
  day: "naponta",
  week: "hetente",
  month: "hónaponta",
  year: "évente",
};

export function repeatLabel(repeat: TaskRepeat | null): string | null {
  if (!repeat) return null;
  const n = Math.max(1, Math.round(repeat.every));
  return n === 1 ? UNIT_ONE[repeat.unit] : `${n} ${UNIT_MANY[repeat.unit]}`;
}
