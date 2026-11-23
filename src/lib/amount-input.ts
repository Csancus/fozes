/**
 * Hármas tagolás Ft-összeg beviteli mezőhöz (mentéskor a szerver eltávolítja a szóközöket).
 * A végén álló 1–2 jegyű tizedes részt (",00", ".5", "4,99 Ft") levágja, különben beillesztéskor
 * a tizedesvessző eltűnne és az összeg 100-szorosa lenne ("12 345,00 Ft" → 1 234 500).
 * Ezres pont ("1.234") nem tizedes: ott 3 jegy jön utána, az megmarad.
 */
export function groupDigits(s: string): string {
  const d = s.replace(/[.,]\d{1,2}\s*(?:Ft|HUF)?\s*$/i, "").replace(/\D/g, "");
  return d ? d.replace(/\B(?=(\d{3})+(?!\d))/g, " ") : "";
}
