// Minimál HTML-tisztító a rich-text jegyzetekhez.
// A szerkesztő contentEditable-t használ, ezért mentés előtt (szerveren) whitelistre szűrünk:
// csak a formázó tageket tartjuk meg, attribútumot csak az <a href>-en (http/https/mailto),
// valamint a pipálható listán: <ul data-check="1"> és a benne lévő <li data-checked="true|false">.

const ALLOWED_TAGS = new Set([
  "p",
  "br",
  "b",
  "strong",
  "i",
  "em",
  "u",
  "s",
  "strike",
  "del",
  "h2",
  "h3",
  "ul",
  "ol",
  "li",
  "blockquote",
  "a",
  "code",
  "pre",
  "div",
  "span",
]);

// Önzáró / tartalom nélküli tagek.
const VOID_TAGS = new Set(["br"]);

function safeHref(raw: string): string | null {
  const href = raw.trim().replace(/\s+/g, "");
  if (/^(https?:|mailto:)/i.test(href)) return href;
  // séma nélküli cím → https
  if (/^[\w.-]+\.[a-z]{2,}(\/|$)/i.test(href)) return `https://${href}`;
  return null;
}

function escapeAttr(v: string): string {
  return v
    .replace(/&/g, "&amp;")
    .replace(/"/g, "&quot;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Régi, sima szöveges jegyzet → rich-text HTML (bekezdésenként).
export function plainToRichText(text: string): string {
  const t = text.trim();
  if (!t) return "";
  return t
    .split(/\n{2,}/)
    .map(
      (para) =>
        `<p>${para
          .split("\n")
          .map((line) =>
            line
              .replace(/&/g, "&amp;")
              .replace(/</g, "&lt;")
              .replace(/>/g, "&gt;")
          )
          .join("<br>")}</p>`
    )
    .join("");
}

export function sanitizeRichText(input: string): string {
  if (!input) return "";
  let html = input.slice(0, 200_000);

  // Veszélyes blokkok tartalmastul.
  html = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|link|meta)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "");

  const openStack: string[] = [];
  // Nyitott lista-szintek: igaz, ha az adott <ul> pipálható lista.
  const listStack: boolean[] = [];

  html = html.replace(
    /<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (_m, closing: string | undefined, rawName: string, attrs: string) => {
      const tag = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";

      if (closing) {
        const idx = openStack.lastIndexOf(tag);
        if (idx === -1) return "";
        openStack.splice(idx, 1);
        if (tag === "ul" || tag === "ol") listStack.pop();
        return `</${tag}>`;
      }

      if (VOID_TAGS.has(tag)) return `<${tag}>`;

      if (tag === "ul" || tag === "ol") {
        const check = tag === "ul" && /data-check\s*=/.test(attrs);
        listStack.push(check);
        openStack.push(tag);
        return check ? `<ul data-check="1">` : `<${tag}>`;
      }

      if (tag === "li") {
        openStack.push("li");
        if (!listStack[listStack.length - 1]) return "<li>";
        const checked = /data-checked\s*=\s*["']?true/i.test(attrs);
        return `<li data-checked="${checked}">`;
      }

      if (tag === "a") {
        const m = /href\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
        const href = m ? safeHref(m[2] ?? m[3] ?? m[4] ?? "") : null;
        if (!href) {
          openStack.push("a");
          return "<a>";
        }
        openStack.push("a");
        return `<a href="${escapeAttr(href)}" target="_blank" rel="noopener noreferrer">`;
      }

      openStack.push(tag);
      return `<${tag}>`;
    }
  );

  // Nyitva maradt tagek zárása.
  for (let i = openStack.length - 1; i >= 0; i -= 1) {
    html += `</${openStack[i]}>`;
  }

  // Üres tartalom (csak whitespace / üres tagek) → üres string.
  const text = html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").trim();
  if (!text) return "";

  return html.trim();
}

// ============ Pipálható lista ============
// A tisztító garantálja, hogy minden pipálható elem pontosan így néz ki:
// <li data-checked="true"> / <li data-checked="false"> — így a szerver
// ugyanabban a sorrendben tudja indexelni őket, mint a böngésző DOM-ja
// (document.querySelectorAll("li[data-checked]")).
const CHECK_LI_RE = /<li\s+data-checked="(true|false)">/gi;

export function checklistStats(html: string): { total: number; done: number } {
  let total = 0;
  let done = 0;
  for (const m of html.matchAll(CHECK_LI_RE)) {
    total += 1;
    if (m[1].toLowerCase() === "true") done += 1;
  }
  return { total, done };
}

// A sorszám szerinti pipa átbillentése (a kártyán/olvasó nézetben kattintva).
export function toggleChecklistItem(html: string, index: number): string {
  let i = 0;
  return html.replace(CHECK_LI_RE, (m, val: string) => {
    const cur = i;
    i += 1;
    if (cur !== index) return m;
    return `<li data-checked="${val.toLowerCase() === "true" ? "false" : "true"}">`;
  });
}

// Rich-text → sima szöveg (kereséshez, előnézethez, értesítés-szöveghez).
export function richTextToPlain(html: string): string {
  return html
    .replace(/<\/(p|div|h2|h3|li|blockquote|ul|ol)>/gi, " ")
    .replace(/<br\s*\/?>/gi, " ")
    .replace(/<[^>]*>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, " ")
    .trim();
}
