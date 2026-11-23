# Story 10.16 – Teljes UX- és kód-átvizsgálás, hibajavítások

**Állapot:** kész (2026-11-23)

## Igény
Teljes UX és kódügyi ellenőrzés, a talált hibák javítása.

## Elfogadási feltételek
- AC1 (biztonság): a rich-text tisztító le nem zárt tagből sem enged élő HTML-t (jegyzet, utazás-terv jegyzet → XSS).
  A publikus R2-be ismeretlen típusú feltöltés `application/octet-stream`-ként megy (nem futhat le HTML/SVG).
- AC2 (adatduplikáció): ismétlődő költség egy hónapra párhuzamos oldalbetöltésnél is csak egyszer jön létre;
  ismétlődő teendő egy előfordulásból csak egy következőt gyárt (kész → vissza → kész, dupla koppintás);
  vásárlás újramentése nem teszi újra a spájzba a már betett sorokat; a tétel-tábla mentés után friss állapottal
  indul (nem menti újra az új sort), és a „minden” nézet megmarad.
- AC3 (összegek, dátumok): beillesztett „12 345,00 Ft” → 12 345 (nem 1 234 500); a tétel-táblában üres dátumú vagy
  összeg/név nélküli sor nem mentődik csendben, pirossal jelölt és a mentés-sáv kiírja.
  A szerver budapesti idő szerint számol (`src/instrumentation.ts` → `TZ=Europe/Budapest`): Ma oldal, határidők,
  hónap eleje, előtöltött dátumok éjfél után is jók, nincs hidratálási eltérés.
- AC4 (UX):
  - gyors rögzítésben bevétel-sorból „Új kategória…” bevétel-kategóriát hoz létre;
  - „Szűrők törlése” a terv-szűrőt is törli, a helyben létrehozott kategóriák/fizetési módok a szűrőben is látszanak;
  - legördülő: újranyitáskor a kiválasztott elem aktív (Enter nem törli), szóköz választ, képernyőolvasó követi az
    aktív sort, a típus/jelleg legördülőnek van neve;
  - /ma: a ma lejárt időpontú teendő nem szerepel kétszer;
  - bevásárlólista: dupla koppintás / párhuzamos törlés nem törli a szomszédos tételt (név szerinti azonosítás);
  - főzés-napló, bevásárlólista-létrehozás, számla-párosítás: dupla kattintás nem ment kétszer;
  - utazás-tervező: új nap/programpont azonosítója nem ütközik a mentettekkel; mentési hiba nem dobja el a tervet;
  - bakancslista képes import: hiba esetén nem ragad „mentés” állapotban;
  - meglepetés-jelszó cseréjéhez a jelenlegi jelszó kell, a feloldás próbálkozás-korlátos (10 / 15 perc);
  - /katalogus/uj mobilon nem lóg ki a vonalkód-sor.

## Tesztek
| Teszt | Típus |
|---|---|
| `tests/lib/richtext.test.ts` | AC1 |
| `tests/lib/recurring-run.test.ts` | AC2 (ismétlődő költség párhuzamosan) |
| `tests/lib/amount-input.test.ts` | AC3 (összeg-beillesztés) |
| Tábla mentés → nincs újramentés, összeg-beillesztés, jelszócsere régi jelszó nélkül, katalógus mobilon | helyi Playwright-próba |
| Többi AC4 pont | kézi |

## Nyitva hagyva (alacsony kockázat)
- Egyidejű regisztráció ugyanazzal az e-maillel (nem atomikus ellenőrzés), meghívó elhasználódása sikertelen regisztrációnál.
- Közös pipálható lista egyidejű pipálása (utolsó írás nyer).
