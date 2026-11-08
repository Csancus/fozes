// Levélküldés a Resend HTTP API-ján keresztül (Story 2.4). Opcionális: ha
// nincs RESEND_API_KEY, az app email nélkül is működik (a jelszó-visszaállító
// linket ilyenkor a háztartás tulajdonosa generálja).
//
// Env: RESEND_API_KEY, MAIL_FROM (pl. "Főzés <noreply@sajatdomain.hu>").
// Saját ellenőrzött domain nélkül a Resend csak a fiók saját címére küld.

export function isMailConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY);
}

export async function sendMail(msg: {
  to: string;
  subject: string;
  text: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("Email küldés nincs beállítva.");
  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.MAIL_FROM || "Főzés <onboarding@resend.dev>",
      to: [msg.to],
      subject: msg.subject,
      text: msg.text,
      html: msg.html,
    }),
  });
  if (!res.ok) {
    throw new Error(`Resend hiba: ${res.status}`);
  }
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!
  );
}

export function passwordResetEmail(name: string, url: string) {
  const subject = "Jelszó visszaállítása – Főzés";
  const text =
    `Szia ${name}!\n\n` +
    `Valaki (remélhetőleg te) új jelszót kért a Főzés fiókodhoz.\n` +
    `Az alábbi linken 1 órán belül állíthatsz be újat:\n\n${url}\n\n` +
    `Ha nem te kérted, nyugodtan hagyd figyelmen kívül ezt a levelet.`;
  const html =
    `<p>Szia ${escapeHtml(name)}!</p>` +
    `<p>Valaki (remélhetőleg te) új jelszót kért a Főzés fiókodhoz. ` +
    `Az alábbi linken <b>1 órán belül</b> állíthatsz be újat:</p>` +
    `<p><a href="${escapeHtml(url)}">Új jelszó beállítása</a></p>` +
    `<p style="color:#666">Ha nem te kérted, nyugodtan hagyd figyelmen kívül ezt a levelet.</p>`;
  return { subject, text, html };
}
