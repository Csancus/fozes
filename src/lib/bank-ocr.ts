// Bank-app képernyőkép OCR-szövegéből tételek kinyerése (heurisztika).
// Támogatott minták: K&H, Revolut, Erste (Visa Wizz) — de bank-agnosztikus.
// A felismerés best-effort; a user utólag szerkeszti a táblázatban.

export type ParsedTx = {
  kind: "expense" | "income";
  amount: number;
  merchant: string;
  day: string; // yyyy-mm-dd
  note: string;
};

const MONTHS: Record<string, string> = {
  jan: "01",
  feb: "02",
  mar: "03",
  apr: "04",
  maj: "05",
  jun: "06",
  jul: "07",
  aug: "08",
  sze: "09",
  sep: "09",
  okt: "10",
  oct: "10",
  nov: "11",
  dec: "12",
};

function pad(n: number): string {
  return String(n).padStart(2, "0");
}
function normalize(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}
function dayStr(d: Date): string {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// Kihagyandó (nem bolt/nem tétel) sorok.
const SKIP_RE =
  /(ref\.?:|hitelk|zárolt|egyenleg|számlacsomag|tranzakci|funkci|informáci|ebben a hón|feltöltött pénz|\bIBAN\b|HU\d{2}\b|jelenlegi)/i;

// Előjeles Ft összeg (a előjel nélküli = egyenleg → kihagyjuk).
const AMOUNT_RE = /([+\-−])\s?(\d[\d . ]*)\s*Ft/;

export function parseBankText(text: string, now: Date = new Date()): ParsedTx[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.replace(/ /g, " ").trim())
    .filter(Boolean);

  const y = now.getFullYear();
  let currentDay = dayStr(now);
  let blockFirst = ""; // az aktuális blokk első szöveges sora = a bolt
  let lastText = "";
  const out: ParsedTx[] = [];

  for (const line of lines) {
    const low = normalize(line);

    // Dátum-kontextus frissítése.
    const dmy = line.match(/(\d{4})\.\s?(\d{1,2})\.\s?(\d{1,2})/);
    let isDateLine = false;
    if (dmy) {
      currentDay = `${dmy[1]}-${pad(+dmy[2])}-${pad(+dmy[3])}`;
      isDateLine = true;
    } else {
      const mon = low.match(
        /\b(jan|feb|mar|apr|maj|jun|jul|aug|sze|sep|okt|oct|nov|dec)[a-z]*\.?\s?(\d{1,2})\b/
      );
      if (mon && MONTHS[mon[1]]) {
        currentDay = `${y}-${MONTHS[mon[1]]}-${pad(+mon[2])}`;
        isDateLine = true;
      } else if (/^ma\b/.test(low) && line.length <= 6) {
        currentDay = dayStr(now);
        isDateLine = true;
      } else if (low.includes("tegnap")) {
        const d = new Date(now);
        d.setDate(d.getDate() - 1);
        currentDay = dayStr(d);
        isDateLine = true;
      }
    }

    // Összeg?
    const m = line.match(AMOUNT_RE);
    if (m) {
      const sign = m[1] === "+" ? "+" : "-";
      const amount = parseInt(m[2].replace(/[ . ]/g, ""), 10);
      if (!isNaN(amount) && amount > 0) {
        // A sorból az összeg(ek) eltávolítása → maradék lehet a bolt neve.
        const residual = line
          .replace(/[+\-−]?\s?\d[\d . ]*\s*(Ft|EUR)/g, "")
          .replace(/\s{2,}/g, " ")
          .trim();
        const resLetters = (residual.match(/\p{L}/gu) || []).length;
        const merchant = (blockFirst || (resLetters >= 2 ? residual : "") || lastText).trim();
        if (merchant) {
          out.push({
            kind: sign === "+" ? "income" : "expense",
            amount,
            merchant: merchant.slice(0, 60),
            day: currentDay,
            note: "",
          });
        }
      }
      blockFirst = "";
      continue;
    }

    // Nem összeg-sor: eldöntjük, lehet-e bolt-jelölt.
    if (isDateLine) continue;
    if (SKIP_RE.test(line)) continue;
    if (/^\d{1,2}:\d{2}$/.test(line)) continue; // idő (14:26)
    const letters = (line.match(/\p{L}/gu) || []).length;
    if (letters >= 3 && line.length <= 48) {
      const clean = line.replace(/\s{2,}/g, " ").trim();
      if (!blockFirst) blockFirst = clean;
      lastText = clean;
    }
  }

  return out;
}
