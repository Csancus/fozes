// Story 10.16 – a szerver (Vercel: UTC) is budapesti idő szerint számolja a „mát”.
// A teendők határideje, a Ma oldal, a hónap eleje és a mai dátummal előtöltött mezők mind
// getDate()/getHours()-szal dolgoznak; UTC-ben éjfél és 01:00/02:00 között még „tegnap” lenne,
// és a böngésző (budapesti idő) mást számolna, mint a szerver → hidratálási eltérés.
// A Node a process.env.TZ futás közbeni átállítását azonnal követi.
export function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") process.env.TZ = "Europe/Budapest";
}
