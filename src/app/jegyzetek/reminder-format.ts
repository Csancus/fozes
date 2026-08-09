// Emlékeztető-időpont emberi formára — a szerveren számoljuk (a Vercel UTC-ben
// fut, ezért mindenhol kötött magyar időzónával), így nincs hidratálási eltérés.
const TZ = "Europe/Budapest";
const DAY_MS = 24 * 60 * 60 * 1000;

const dayFmt = new Intl.DateTimeFormat("sv-SE", {
  timeZone: TZ,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFmt = new Intl.DateTimeFormat("hu-HU", {
  timeZone: TZ,
  hour: "2-digit",
  minute: "2-digit",
});
const dateFmt = new Intl.DateTimeFormat("hu-HU", {
  timeZone: TZ,
  month: "short",
  day: "numeric",
});
const dateYearFmt = new Intl.DateTimeFormat("hu-HU", {
  timeZone: TZ,
  year: "numeric",
  month: "short",
  day: "numeric",
});

function dayKey(ts: number): string {
  return dayFmt.format(new Date(ts));
}

export function reminderLabel(ts: number, now = Date.now()): string {
  const day = dayKey(ts);
  const time = timeFmt.format(new Date(ts));
  if (day === dayKey(now)) return `Ma ${time}`;
  if (day === dayKey(now + DAY_MS)) return `Holnap ${time}`;
  if (day === dayKey(now - DAY_MS)) return `Tegnap ${time}`;
  const sameYear = day.slice(0, 4) === dayKey(now).slice(0, 4);
  const d = new Date(ts);
  return `${sameYear ? dateFmt.format(d) : dateYearFmt.format(d)} ${time}`;
}
