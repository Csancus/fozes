import { describe, expect, it } from "vitest";
import { extractLinks, guessSavedFromText } from "@/lib/ocr/saved-guess";
import { DEFAULT_SAVED_TYPES, type SavedType } from "@/lib/types";

// Story 10.1 – képből bakancslista-tétel: cím, típus, hely, linkek (OCR-szövegből).
const types: SavedType[] = DEFAULT_SAVED_TYPES.map((t) => ({ ...t, createdAt: 0 }));

describe("Story 10.1 – bakancslista-heurisztika", () => {
  it("AC6: Instagram-poszt – a név a képaláírás eleje (nem a leíró mondat), a link http nélkül is link", () => {
    const text = [
      "4 bistro_frank",
      "1248 kedvelés",
      "bistro_frank Bisztró Frank",
      "Hétvégi brunch és kézműves kávé a VII. kerületben.",
      "1072 Budapest, Klauzal tér 7.",
      "Foglalas: bistrofrank.hu/foglalas",
      "#brunch #budapest #étterem",
      "2 napja",
    ].join("\n");
    const g = guessSavedFromText(text, types);
    expect(g.title).toBe("Bisztró Frank");
    expect(g.kind).toBe("etterem");
    expect(g.location).toBe("1072 Budapest, Klauzal tér 7.");
    expect(g.links.map((l) => l.url)).toEqual(["https://bistrofrank.hu/foglalas"]);
  });

  it("AC6: elveszett fejléc + OCR-ral szétesett felhasználónév („bistro. frank”)", () => {
    const g = guessSavedFromText("1248 kedvelés\nbistro. frank Bisztró Frank\nHétvégi brunch.", types);
    expect(g.title).toBe("Bisztró Frank");
  });

  it("AC6: térkép-kártya – értékelés-sor és „Cím:” címke nem cím; a hely a címke nélkül", () => {
    const text = [
      "Normafa Kilátó",
      "4,7 kkkkxk (2314)",
      "Kilátó - Látnivaló",
      "Cím: 1121 Budapest, Eötvös út 59.",
      "Nyitva - Bezár: 20:00",
      "Webhely: https://normafa.hu",
    ].join("\n");
    const g = guessSavedFromText(text, types);
    expect(g.title).toBe("Normafa Kilátó");
    expect(g.kind).toBe("helyszin");
    expect(g.location).toBe("1121 Budapest, Eötvös út 59.");
    expect(g.links.map((l) => l.url)).toEqual(["https://normafa.hu"]);
  });

  it("AC6: link-alapú típus (YouTube → videó), ékezet nélküli kulcsszó is talál", () => {
    expect(guessSavedFromText("Jó videó\nhttps://youtu.be/abc123", types).kind).toBe("video");
    expect(guessSavedFromText("Panorama Hotel\nszallas reggelivel", types).kind).toBe("utazas");
  });

  it("AC6: linkek – e-mail nem link, ismétlés egyszer, záró írásjel le", () => {
    expect(extractLinks("írj: info@bistro.hu vagy www.bistro.hu, és www.bistro.hu/")).toEqual(["https://www.bistro.hu"]);
    expect(extractLinks("linktr.ee/frank!")).toEqual(["https://linktr.ee/frank"]);
  });
});
