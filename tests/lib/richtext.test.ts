import { describe, expect, it } from "vitest";
import { sanitizeRichText } from "@/lib/richtext";

describe("Story 10.16 – sanitizeRichText (XSS)", () => {
  it("AC1: le nem zárt tag nem válhat élő taggé", () => {
    const out = sanitizeRichText("<b>a<img src=x onerror=alert(1) x=");
    expect(out).not.toMatch(/<img/i);
    expect(out).toContain("&lt;img");
    expect(out.endsWith("</b>")).toBe(true);
  });
  it("AC1: engedélyezett formázás és pipálható lista megmarad", () => {
    expect(sanitizeRichText("<p>szia <b>te</b></p>")).toBe("<p>szia <b>te</b></p>");
    expect(sanitizeRichText('<ul data-check="1"><li data-checked="true">tej</li></ul>')).toBe(
      '<ul data-check="1"><li data-checked="true">tej</li></ul>'
    );
  });
  it("AC1: tiltott tag és eseménykezelő eltűnik", () => {
    expect(sanitizeRichText('<p onclick="x()">a</p><script>alert(1)</script>')).toBe("<p>a</p>");
    expect(sanitizeRichText('<a href="javascript:alert(1)">x</a>')).toBe("<a>x</a>");
  });
  it("AC1: szöveges kisebb-jel escape-elve marad", () => {
    expect(sanitizeRichText("<p>3 < 5</p>")).toBe("<p>3 &lt; 5</p>");
  });
});
