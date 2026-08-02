// Minimál HTML-tisztító a rich-text jegyzetekhez.
// A szerkesztő contentEditable-t használ, ezért mentés előtt (szerveren) whitelistre szűrünk:
// csak a formázó tageket tartjuk meg, attribútumot csak az <a href>-en (http/https/mailto).

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

export function sanitizeRichText(input: string): string {
  if (!input) return "";
  let html = input.slice(0, 200_000);

  // Veszélyes blokkok tartalmastul.
  html = html
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/<(script|style|iframe|object|embed|link|meta)[\s\S]*?<\/\1\s*>/gi, "")
    .replace(/<(script|style|iframe|object|embed|link|meta)\b[^>]*\/?>/gi, "");

  const openStack: string[] = [];

  html = html.replace(
    /<\s*(\/)?\s*([a-zA-Z][a-zA-Z0-9]*)\b([^>]*)>/g,
    (_m, closing: string | undefined, rawName: string, attrs: string) => {
      const tag = rawName.toLowerCase();
      if (!ALLOWED_TAGS.has(tag)) return "";

      if (closing) {
        const idx = openStack.lastIndexOf(tag);
        if (idx === -1) return "";
        openStack.splice(idx, 1);
        return `</${tag}>`;
      }

      if (VOID_TAGS.has(tag)) return `<${tag}>`;

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
